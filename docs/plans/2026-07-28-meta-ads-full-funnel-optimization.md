# Plan: Meta Ads Full-Funnel Optimization

Tanggal: 2026-07-28  
Status: Completed  
Completed: 2026-07-28  
Verified: 2026-07-28 tsc 0 errors, lint 0 warnings  
Final Verified: 2026-07-27 05:31 UTC VPS container ceritakita-booking healthy, token valid, spend accurate 2.9M, attribution 100%  
Related Docs:
- docs/plans/2026-07-28-meta-ads-vps-verification.md (initial deploy)
- docs/plans/2026-07-28-meta-ads-final-verification.md (final after fixes)
Owner: CeritaKita Booking  
Token scope: `ads_read + ads_management + business_management` (full)  
Goal: semua data Meta masuk DB lokal, bisa kelola sendiri, ROAS per iklan akurat

---

## 0. Problem sekarang

```
Current: dashboard load → hit Graph API langsung (account level, 4 fields)
          → simpen spend/impr/click/reach 1 row/hari
```

Issue:
- breakdown campaign/adset/ad hilang
- fields tipis (tanpa cpc,cpm,ctr,freq,results,cost_per_result,actions)
- backfill N hari = N request → boros rate limit
- lead cuma label "Meta Ads", ga ada campaign_id/ad_id/fbclid/fbc/fbp/utm
- wa_clicks ada utm_campaign tapi ga join ke ads
- CAPI ga kirim Purchase+value, Meta optimasi buta revenue
- dashboard baca API live → lambat, ga ada history kalo token off

---

## 1. Arsitektur target

```
Meta Graph API
  ├─ /campaigns, /adsets, /ads, /adcreatives  → meta_campaigns/adsets/ads
  ├─ /insights?level=campaign|adset|ad,time_increment=1,breakdown
  │     → meta_insights_daily
  └─ /act_id/insights (legacy) → ads_performance_log (keep compat)

Website/WA redirect
  ├─ capture fbclid/fbc/fbp/utm → cookie + WA redirect log
  └─ lead create → save meta_campaign_id/adset_id/ad_id + fbc/fbp

Bookings → lead link → CAPI Purchase(value=currency,IDR)

Cron /api/meta/sync (every 1h) + /api/meta/manage (write)
Dashboard baca DB only → <100ms

Telegram daily report + anomaly alert
```

### Prinsip
- DB = source of truth, Meta = upstream sync
- Semua route baru di `lib/services/meta-ads-service.ts` + repo `lib/repositories/meta-ads.ts`
- Dashboard ga langsung hit Meta lagi
- Token health check endpoint

---

## 2. DB schema baru

### 2.1 Core ads tables

```sql
CREATE TABLE meta_campaigns (
  id TEXT PRIMARY KEY, -- "1202..."
  account_id TEXT,
  name TEXT NOT NULL,
  status TEXT, -- ACTIVE/PAUSED/DELETED/ARCHIVED
  objective TEXT,
  daily_budget INTEGER,
  lifetime_budget INTEGER,
  bid_strategy TEXT,
  created_time TEXT,
  updated_time TEXT,
  meta_created_at TEXT,
  raw_json TEXT, -- full object backup
  synced_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE meta_adsets (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT,
  daily_budget INTEGER,
  lifetime_budget INTEGER,
  bid_amount INTEGER,
  targeting TEXT, -- JSON
  optimization_goal TEXT,
  billing_event TEXT,
  created_time TEXT,
  updated_time TEXT,
  raw_json TEXT,
  synced_at TEXT,
  FOREIGN KEY(campaign_id) REFERENCES meta_campaigns(id)
);

CREATE TABLE meta_ads (
  id TEXT PRIMARY KEY,
  adset_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT,
  creative_id TEXT,
  creative_json TEXT,
  tracking_specs TEXT, -- JSON
  created_time TEXT,
  updated_time TEXT,
  raw_json TEXT,
  synced_at TEXT,
  FOREIGN KEY(adset_id) REFERENCES meta_adsets(id),
  FOREIGN KEY(campaign_id) REFERENCES meta_campaigns(id)
);

CREATE INDEX idx_meta_adsets_campaign ON meta_adsets(campaign_id);
CREATE INDEX idx_meta_ads_adset ON meta_ads(adset_id);
CREATE INDEX idx_meta_ads_campaign ON meta_ads(campaign_id);
```

### 2.2 Insights daily granular

```sql
CREATE TABLE meta_insights_daily (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date_record TEXT NOT NULL, -- YYYY-MM-DD
  campaign_id TEXT,
  adset_id TEXT,
  ad_id TEXT,
  -- metrics
  spend REAL DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0, -- link clicks
  inline_link_clicks INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  frequency REAL DEFAULT 0,
  cpc REAL DEFAULT 0,
  cpm REAL DEFAULT 0,
  ctr REAL DEFAULT 0,
  cpp REAL DEFAULT 0,
  results INTEGER DEFAULT 0,
  cost_per_result REAL DEFAULT 0,
  actions TEXT, -- JSON array of action_type/value
  action_values TEXT, -- JSON
  video_views INTEGER DEFAULT 0,
  -- breakdown optional (null = account rollup)
  breakdown_type TEXT, -- age/gender/placement/device/publisher_platform
  breakdown_value TEXT,
  -- raw
  raw_json TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date_record, campaign_id, adset_id, ad_id, breakdown_type, breakdown_value)
);

CREATE INDEX idx_insights_date ON meta_insights_daily(date_record);
CREATE INDEX idx_insights_campaign_date ON meta_insights_daily(campaign_id, date_record);
CREATE INDEX idx_insights_ad_date ON meta_insights_daily(ad_id, date_record);
```

### 2.3 Attribution columns

```sql
ALTER TABLE leads ADD COLUMN meta_campaign_id TEXT;
ALTER TABLE leads ADD COLUMN meta_adset_id TEXT;
ALTER TABLE leads ADD COLUMN meta_ad_id TEXT;
ALTER TABLE leads ADD COLUMN fbclid TEXT;
ALTER TABLE leads ADD COLUMN fbc TEXT;
ALTER TABLE leads ADD COLUMN fbp TEXT;
ALTER TABLE leads ADD COLUMN utm_campaign TEXT;
ALTER TABLE leads ADD COLUMN utm_content TEXT;
ALTER TABLE leads ADD COLUMN utm_term TEXT;
ALTER TABLE leads ADD COLUMN utm_medium TEXT;
ALTER TABLE leads ADD COLUMN utm_source TEXT;

ALTER TABLE bookings ADD COLUMN lead_id TEXT REFERENCES leads(id);
ALTER TABLE wa_clicks ADD COLUMN fbclid TEXT;
ALTER TABLE wa_clicks ADD COLUMN fbc TEXT;
ALTER TABLE wa_clicks ADD COLUMN fbp TEXT;
ALTER TABLE wa_clicks ADD COLUMN matched_ad_id TEXT;
ALTER TABLE wa_clicks ADD COLUMN matched_campaign_id TEXT;
```

### 2.4 Meta sync log

```sql
CREATE TABLE meta_sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sync_type TEXT, -- campaigns|adsets|ads|insights|full
  started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  finished_at TEXT,
  status TEXT, -- running/success/failed
  records_synced INTEGER DEFAULT 0,
  error_msg TEXT
);
```

Keep existing `ads_performance_log` for backward compat, dual-write.

---

## 3. Lib layer

### 3.1 `lib/meta/client.ts` (baru)
```ts
- getMetaConfig(): token, adAccountId, apiVersion, pixelId
- metaGraphFetch(path, params, method) with retry + error code handle (190 token, 100 acct, 80004 rate limit)
- typed helpers: listCampaigns(), listAdSets(campaignId), listAds(adsetId), getInsights({level, time_range, time_increment, breakdowns, fields})
- manage: updateCampaignStatus(id,status), updateAdSetStatus, updateAdStatus, updateBudget
- paginator for graph paging
```

Fields list untuk insights:
```
campaign_id, campaign_name, adset_id, adset_name, ad_id, ad_name,
spend, impressions, clicks, inline_link_clicks, reach, frequency,
cpc, cpm, ctr, cpp, purchase_roas, results, cost_per_result,
actions, action_values, video_p25_watched_actions, video_p100...
```

### 3.2 `lib/repositories/meta-ads.ts` (baru)
CRUD + upsert:
- upsertCampaigns(rows), upsertAdSets, upsertAds
- upsertInsightsDaily(batch) chunked 180
- getInsightsByDateRange + groupBy campaign/adset/ad
- getCampaignsWithStats(start,end) => join insights_daily SUM
- getAttributionStats: wa_clicks + leads + bookings per campaign

### 3.3 `lib/services/meta-ads-service.ts` (baru)
Business logic:
- syncAll(accessToken,accountId,days): campaigns→adsets→ads→insights 1x time_increment=1
- syncCampaigns()
- syncInsightsForRange(since,until)
- matchWaClickToAd(): logic fbclid→fbc decode campaign? atau utm_campaign name exact match
- calculateROAS: insights spend vs bookings linked via leads
- anomaly detection
- budget rules

### 3.4 `lib/meta/attribution.ts` (baru)
- parseFbclidToFBC(fbclid): `fb.1.{ts}.{fbclid}`
- readFBP/FBC from cookies (client util + server from headers)
- capture util for /wa redirect
- resolve campaign from utm_campaign

### 3.5 Update existing
- `lib/meta-capi.ts`: add fbc/fbp from lead columns, send Purchase when booking paid
- `app/api/wa/[source]/route.ts` : capture fbclid/fbc/fbp + match
- `lib/repositories/leads.ts`: save new columns
- `app/api/leads/route.ts`: auto parse meta ids

---

## 4. API routes baru

```
GET  /api/meta/campaigns?start=&end=         → list campaigns + stats (DB, no Meta call)
GET  /api/meta/adsets?campaign_id=&start=&end=
GET  /api/meta/ads?adset_id=&campaign_id=&start=&end=
GET  /api/meta/insights?level=campaign|adset|ad|account&since=&until=&breakdown=
     → DB first, fallback Meta if miss (optional query param ?fresh=1)

POST /api/meta/sync?days=30&full=1          → trigger full sync (protected admin)
  steps: sync campaigns, adsets, ads, insights_daily (time_increment=1 single request)
  returns sync_log id + counts
GET  /api/meta/sync/status?id=               → polling

POST /api/meta/manage                        → body { entity:'campaign|adset|ad', id, action:'pause|resume|update_budget', value }
  protected + audit log

GET  /api/meta/health                        → check token valid, expiry days left, permissions list (via /debug_token), rate limit header

GET  /api/meta/attribution?start=&end=       → funnel: spend per campaign -> wa_clicks -> leads -> bookings -> revenue, CPA, ROAS
GET  /api/meta/creatives?campaign_id=        → list creative thumbnail + copy + stats

Legacy keep:
GET  /api/meta/insights (old) → proxy to new but keep shape + dual write
POST /api/meta/backfill      → refactor to use sync service (1 request)
GET  /api/meta/history       → adapt to new table if param level given
```

Security: all admin routes behind auth middleware, sync/manage only `role=admin`.

---

## 5. Attribution detail design

### 5.1 Capture chain

1. User click ad → URL contains `fbclid=xxxx` + utm? Meta append auto
2. Landing `ceritakitastudio.site/?fbclid=...&utm_campaign=camp_name`
   - client JS: store `fbclid` → localStorage, `_fbc` cookie = `fb.1.ts.fbclid`, read `_fbp` from fb pixel
3. Click WA button → `/api/wa/self-photo?fbclid=...` 
   - server: extract ip, ua, fbclid, fbc (from cookie header or query), fbp, utm params
   - save wa_clicks with all fields
   - attempt match: if utm_campaign equals campaign name OR we have ad_id from URL param `ad_id`, save matched_campaign_id
   - fire CAPI Contact with ip,ua,fbc,fbp (existing)
4. WA chat → admin create lead manually or auto via webhook
   - when lead created from wa_clicks context, copy attribution columns
5. Lead → Booking → store lead_id in bookings
6. Booking paid → CAPI Purchase with value

### 5.2 Matching strategy

- Exact: if URL contains `utm_campaign` == `meta_campaigns.name` (case-insensitive trim) → link
- Explicit: if URL contains `meta_campaign_id` param (we can inject in ad final URL)
- Future: parse `fbc` not enough to get campaign, need add param. Best: edit ad URL template in Meta to include `?campaign_id={{campaign.id}}&ad_id={{ad.id}}&fbclid=...`
- Fallback: daily job that matches wa_clicks without matched_campaign_id by closest time window + utm_campaign LIKE campaign name

Propose ad URL template:
```
https://ceritakitastudio.site/?utm_source=facebook&utm_medium=cpc&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&campaign_id={{campaign.id}}&adset_id={{adset.id}}&ad_id={{ad.id}}&fbclid={{fbclid}}...
```
This makes attribution 100%.

---

## 6. Frontend / Admin UI

### 6.1 New page: `/admin/ads`
Tabs:
- Overview: total spend, total leads (meta source), total bookings linked, ROAS gauge, spend trend chart (last 30d)
- Campaigns table: name, status badge, budget, spend, impr, clicks, CTR, CPC, leads count, bookings count, revenue, ROAS, cost per lead, actions pause/resume + budget edit inline
  - expand row → adsets
- Adsets table similarly
- Ads table: preview creative thumbnail, name, status, metrics
- Attribution funnel visual: Spend → Clicks → WA clicks → Leads → Bookings (sankey or bar)
- Insights drill: click campaign → daily chart spend+leads+bookings, breakdown by placement/device

Components:
- `components/admin/ads/CampaignsTable.tsx`
- `components/admin/ads/AdsFunnel.tsx`
- `components/admin/ads/BudgetEditor.tsx`
- `components/admin/ads/CreativePreview.tsx`
- reuse `AdsPerformance.tsx` refactor to read DB endpoint

### 6.2 Existing AdsPerformance.tsx
Refactor to call `/api/meta/campaigns?start=&end=` (DB) not live Meta. Add ROAS per campaign. Keep backward compat.

### 6.3 Cron UI?
Button "Sync now" triggers `/api/meta/sync?days=7`.

---

## 7. Sync job / cron

Options (pick 1):
- Vercel Cron `vercel.json` crons: `0 */3 * * *` → call `/api/meta/sync?days=2`
- Or Next.js route hit by external cron (cron-job.org)
- Or simple setInterval in server? No, use Vercel cron.

Sync steps idempotent:
1. insert sync_log running
2. listCampaigns pagination → upsert
3. listAdSets pagination → upsert
4. listAds pagination → upsert
5. insights: single request per level:
   - account level: `level=account,time_increment=1,time_range={since,until}` → upsert with campaign null
   - campaign level: `level=campaign,time_increment=1` → upsert per campaign per day
   - ad level: `level=ad,time_increment=1` → upsert per ad per day (heaviest, maybe limit to active ads only, last 30d)
6. update sync_log success

Rate limit handling:
Family: App-level rate ~200 calls/hour per ad account. Listing 100 campaigns ~2 calls, adsets 200 ~4 calls, ads 500 ~10 calls, insights campaign level 1 call (time_increment), ad level 1 call. Total ~15-20 calls per sync. Safe. Implement exponential backoff on `code 4/80004`.

Token health:
`GET /debug_token?input_token=xxx` + `GET /me?fields=...` check `ads_read` still valid. If code 190 → telegram alert + save error.

---

## 8. Automation rules (Phase 4)

Table `meta_automation_rules`:
```
id, name, condition_json, action_json, is_active, last_triggered_at, triggered_count
example condition: { metric:"cpc", op:">", value:50000, days:3, scope:"campaign" }
action: { type:"pause_adset" | "notify_telegram" | "reduce_budget", value:50 }
```

Service `evaluateAutomationRules()` runs after sync.
- If CPL > 50k last 3 days per campaign → telegram + pause
- If ROAS > 5x → suggest scale budget +20%
- Creative fatigue: frequency > 4 + CTR drop 30% → alert

Start manual actions first, automation later.

---

## 9. Security & compliance

- Token never log full, only last 6 chars
- All manage endpoints audit → `system_settings_audit` or new `meta_audit_log`
- Rate limit manage endpoint 10/min
- Validate ad belongs to configured AD_ACCOUNT_ID before mutate
- Never expose token to client, only server `lib/meta/client.ts` uses env

---

## 10. Implementation phases

### Phase 1: Foundation (1-2 days)
- [x] lib/meta/client.ts – wrapper with error handling, paginator, insights fields
- [x] lib/db.ts migrations: meta_campaigns, meta_adsets, meta_ads, meta_insights_daily, meta_sync_log, leads columns, wa_clicks columns, bookings lead_id
- [x] lib/repositories/meta-ads.ts CRUD
- [x] GET /api/meta/health
- Test: `npm run tsc`, manual curl health → 0 errors, health valid true

### Phase 2: Sync + Read DB (1-2 days)
- [x] lib/services/meta-ads-service.ts – syncAll with time_increment=1
- [x] POST /api/meta/sync + status
- [x] Refactor POST /api/meta/backfill to use service
- [x] GET /api/meta/campaigns|adsets|ads|insights reading DB
- [x] cron vercel.json (0 */3 * * * -> /api/meta/sync?days=2)
- Verification: sync 30d, check row counts, dashboard from DB → 74 rows spend 2.9M accurate after dedup fix

### Phase 3: Attribution Funnel (1-2 days)
- [x] lib/meta/attribution.ts – fbc/fbp parsing, URL builder
- [x] Update /api/wa/[source] capture & match (fbclid,fbc,fbp,campaign_id_param,ad_id_param,utm_*)
- [x] Update leads create to save meta ids + utm
- [x] Update bookings add lead_id + auto-link by phone suffix
- [x] GET /api/meta/attribution endpoint
- [x] Component AdsFunnel – spend→clicks→WA→leads→bookings→ROAS (MetaAdsDashboard)
- [x] Migration to populate existing leads (utm_campaign LIKE + date fallback) → 316/316 Meta Ads leads with campaign (was 98)
- Test: WA click with ?campaign_id=... → wa_clicks matched 8546

### Phase 4: Management + UI (2 days)
- [x] POST /api/meta/manage (pause/resume/budget) + audit log meta_audit_log
- [x] UI /admin/ads pages + tables + budget inline edit + creative preview (MetaAdsDashboard.tsx)
- [x] Refactor AdsPerformance.tsx to use DB endpoints + keep legacy account level
- [x] CAPI Purchase integration on booking paid (lib/services/booking-service hook) with fbc/fbp
- [x] Telegram daily report include best/worst campaign (report-generator DB-first + lib/telegram.ts top campaigns)

### Phase 5: Automation & Polish (optional, 1-2 days)
- [ ] meta_automation_rules table + evaluate service (optional, not critical)
- [ ] Anomaly detection (optional)
- [ ] Creative fatigue alert (optional)
- [ ] Export ROAS report CSV (optional)

#### Phase 6: VPS Fixes & Final Verification (added post-deploy)
- [x] Fix DB version 1 early return bug → bump to 2 + always-run runMetaAdsMigrations
- [x] Fix UNIQUE NULL bug: SQLite NULL != NULL allows duplicate insights → normalize NULL to '' + dedup keeping MAX id
- [x] Fix getAttributionFunnel cartesian JOIN inflation (136M spend) → separate aggregations per campaign
- [x] Fix bookings phone match suffix fallback + lead booking_id update
- [x] Fix attribution date-based fallback for 218 leads without campaign → 0 unassigned
- [x] Add workflows: update-meta-token.yml (secure token update), meta-sync-trigger.yml, meta-clean-insights.yml, meta-reset-insights.yml, debug-* 
- [x] Add endpoints: /api/meta/backfill-attribution (idempotent), /api/bookings/link-lead, /api/debug/attribution
- [x] Final verification: health valid true, sync 74 insights spend 2,944,440 accurate, attribution funnel totals spend 2.9M impr 262k clicks 1138 waClicks 8550 leads 791 bookings 115 revenue 37M, byCampaign leads 298/18 etc

---

## 11. Risks / mitigations

- Rate limit 80004 → backoff + limit ad-level insights to active ads last 30d only
- Token expiry 60d → health check + telegram 7 days before expire, doc refresh flow
- Graph API version bump → centralize apiVersion env, fallback v19
- SQLite unique constraint on insights daily → use INSERT OR REPLACE
- Existing backfill route used → keep path but internals baru

---

## 12. Verification plan

```
1. tsc --noEmit
2. curl /api/meta/health → token valid?
3. POST /api/meta/sync?days=7&full=1 → check meta_sync_log success, row counts SELECT COUNT(*)
4. GET /api/meta/campaigns?start=2026-06-01&end=2026-07-28 → returns with stats
5. Manual WA click: https://.../api/wa/self-photo?fbclid=abc&utm_campaign=TestCamp&campaign_id=123&ad_id=456
   → check wa_clicks fbclid+fbc+matched ids filled
6. Create lead from WA → check leads meta_campaign_id populated
7. Create booking linked lead → check bookings.lead_id + attribution endpoint shows booking count
8. Booking payment → check CAPI Purchase log
9. Dashboard /admin → campaigns table shows ROAS, funnel shows numbers
10. Pause one adset via /api/meta/manage → check meta status + verify in Meta Ads Manager
```

---

## 13. Open questions before coding

- Berapa rata-rata campaigns/adsets/ads aktif? (untuk memutuskan apakah ad-level insight daily sync full atau hanya active)
- Ingin auto-sync setiap berapa jam?
- Ad URL template saat ini sudah pakai utm_campaign? Jika belum, perlu update di Meta.
- Telegram bot token ada? Untuk alert budget/rule.
