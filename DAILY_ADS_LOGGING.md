# Daily Ads Logging System

## Overview

The ads logging system has been changed from **Monthly** to **Daily** granularity. This allows for more precise tracking of Meta Ads performance over time.

## Changes Made

### 1. API Route (`app/api/meta/insights/route.ts`)

**Before:**
```typescript
params.date_preset = 'this_month';  // Monthly data
```

**After:**
```typescript
params.date_preset = 'today';  // Daily data
```

### 2. Database Storage (`lib/storage-sqlite.ts`)

**Before:**
- `date_record`: `YYYY-MM-01` (first day of month)
- Validation: Only saved full month data
- Logic: Monthly aggregation

**After:**
- `date_record`: `YYYY-MM-DD` (exact date)
- Validation: Saves all valid data (including zero values)
- Logic: Daily upsert (INSERT OR REPLACE)

### 3. Upsert Behavior

Every time the dashboard is opened:
1. Fetches today's data from Meta API (`date_preset: 'today'`)
2. Extracts the date from `date_start` (YYYY-MM-DD)
3. Upserts the record in `ads_performance_log` table
4. If a record for today already exists, it gets updated

**Database Schema:**
```sql
CREATE TABLE ads_performance_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date_record TEXT NOT NULL UNIQUE,  -- YYYY-MM-DD format
  spend REAL NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  reach INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## Historical Backfill

### Option 1: Using API Endpoint

Backfill the last 30 days of data:

```bash
curl -X POST "http://localhost:3001/api/meta/backfill?days=30"
```

Backfill the last 7 days:

```bash
curl -X POST "http://localhost:3001/api/meta/backfill?days=7"
```

Maximum: 90 days

**Response Example:**
```json
{
  "success": true,
  "message": "Successfully backfilled 30 out of 30 days",
  "daysBackfilled": 30,
  "totalDays": 30,
  "errors": []
}
```

### Option 2: Using Function Directly

```typescript
import { backfillAdsHistory } from '@/lib/storage-sqlite';

const result = await backfillAdsHistory(
  process.env.META_ACCESS_TOKEN!,
  process.env.META_AD_ACCOUNT_ID!,
  30,  // days
  'v19.0'  // API version
);

console.log(result);
// {
//   success: true,
//   daysBackfilled: 30,
//   errors: []
// }
```

### Backfill Features

- ✅ Fetches data for each day individually
- ✅ Handles API errors gracefully (continues on failure)
- ✅ Rate limiting protection (100ms delay between requests)
- ✅ Comprehensive logging
- ✅ Upserts existing records (won't create duplicates)

## Usage Examples

### Fetch Today's Data

```bash
GET /api/meta/insights
```

Response:
```json
{
  "success": true,
  "data": {
    "spend": 30232,
    "impressions": 3273,
    "inlineLinkClicks": 13,
    "reach": 2786,
    "date_start": "2025-12-30",
    "date_end": "2025-12-30"
  }
}
```

### Fetch Custom Date Range

```bash
GET /api/meta/insights?since=2025-12-25&until=2025-12-30
```

### Retrieve Historical Data from Database

```typescript
import { getAdsLog } from '@/lib/storage-sqlite';

// Get specific day
const todayData = getAdsLog('2025-12-30');

// Get date range
const lastWeek = getAdsLog(undefined, '2025-12-24', '2025-12-30');

// Get last 30 days
const last30Days = getAdsLog(undefined, undefined, undefined, 30);
```

## Data Flow

```
┌─────────────────┐
│  Dashboard Load │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ GET /api/meta/insights      │
│ (date_preset: 'today')      │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Meta API Response          │
│  {                          │
│    spend: 30232,            │
│    date_start: '2025-12-30' │
│  }                          │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  saveAdsLog(data)           │
│  - Extract date_record      │
│  - Validate data            │
│  - INSERT OR REPLACE        │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  ads_performance_log        │
│  date_record: '2025-12-30'  │
│  spend: 30232               │
│  updated_at: CURRENT_TIME   │
└─────────────────────────────┘
```

## Benefits of Daily Logging

1. **Granular Tracking**: Track performance day by day
2. **Trend Analysis**: Identify daily patterns and trends
3. **Accurate Attribution**: Match spend to specific dates
4. **Better Reporting**: Generate daily, weekly, monthly reports from same data
5. **Real-time Updates**: Dashboard always shows current day's performance

## Migration from Monthly to Daily

If you had monthly data before, you can:

1. **Keep old monthly records**: They won't conflict (different date format)
2. **Start fresh**: Backfill last 30-90 days for complete daily timeline
3. **Gradual transition**: Old monthly data stays, new daily data accumulates

## Recommendations

1. **Run backfill once** after deployment to get historical data:
   ```bash
   curl -X POST "http://localhost:3001/api/meta/backfill?days=30"
   ```

2. **Monitor logs** for the first few days to ensure smooth operation

3. **Set up alerts** if daily saves fail (check logs for errors)

4. **Verify data** by querying the database:
   ```sql
   SELECT * FROM ads_performance_log
   ORDER BY date_record DESC
   LIMIT 30;
   ```

## Troubleshooting

### Issue: No data being saved

**Check:**
- Verify `.env.local` has `META_ACCESS_TOKEN` and `META_AD_ACCOUNT_ID`
- Check logs for database errors
- Ensure Meta API is accessible

### Issue: Backfill failing

**Check:**
- API rate limits (add longer delay if needed)
- Token expiration
- Network connectivity

### Issue: Duplicate records

**Solution:**
- The `UNIQUE` constraint on `date_record` prevents duplicates
- `INSERT OR REPLACE` automatically updates existing records

## Code Quality

✅ **Type Safety**: Proper TypeScript interfaces
✅ **Error Handling**: Comprehensive try-catch blocks
✅ **Logging**: Detailed info and error logs
✅ **Validation**: Checks for negative values
✅ **Performance**: Rate limiting, query limits
✅ **Reliability**: Non-blocking saves, graceful failures

## Next Steps

- [ ] Run backfill to populate historical data
- [ ] Monitor dashboard to verify daily updates
- [ ] Consider building daily/weekly/monthly trend charts
- [ ] Set up automated alerts for anomalies
