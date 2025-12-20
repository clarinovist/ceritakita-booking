# SQLite Migration Guide

## Overview

The CeritaKita Booking App has been migrated from a file-based JSON database to SQLite for better reliability, performance, and data integrity.

## What Changed

### Before (File-based JSON)
- Database: `data/db.txt` (JSON array)
- File locking with `proper-lockfile`
- Sequential reads/writes
- No data validation at database level

### After (SQLite)
- Database: `data/bookings.db` (SQLite database)
- Tables: `bookings` and `payments`
- ACID transactions
- Foreign key constraints
- Indexes for better performance
- WAL mode for concurrent access

## Database Schema

### Bookings Table
```sql
CREATE TABLE bookings (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  status TEXT CHECK(status IN ('Active', 'Completed', 'Cancelled')),

  customer_name TEXT NOT NULL,
  customer_whatsapp TEXT NOT NULL,
  customer_category TEXT NOT NULL,

  booking_date TEXT NOT NULL,
  booking_notes TEXT,
  booking_location_link TEXT,

  total_price INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
)
```

### Payments Table
```sql
CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id TEXT NOT NULL,
  date TEXT NOT NULL,
  amount INTEGER NOT NULL,
  note TEXT,
  proof_filename TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
)
```

## Setup Instructions

### On Your PC/Server

1. **Install Dependencies**
   ```bash
   npm install
   ```
   This will install `better-sqlite3` which requires native compilation.

2. **Run Migration (if you have existing data)**
   ```bash
   npx tsx scripts/migrate-to-sqlite.ts
   ```

3. **Start the Application**
   ```bash
   npm run dev
   ```

The database will be automatically created at `data/bookings.db` on first run.

## Migration Script

The migration script (`scripts/migrate-to-sqlite.ts`) will:
1. Read all bookings from `data/db.txt`
2. Create a backup of your JSON file
3. Insert all bookings into SQLite
4. Clean up old `proof_base64` fields
5. Verify the migration

### Usage

```bash
# Run migration
npx tsx scripts/migrate-to-sqlite.ts

# Force migration even if SQLite has data (appends)
npx tsx scripts/migrate-to-sqlite.ts --force
```

## API Changes

No changes to the API endpoints! The same REST API works with SQLite:

- `GET /api/bookings` - List all bookings
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/update` - Update existing booking

## New Features

With SQLite, you now have:

### 1. **Better Concurrency**
- Multiple requests can be handled simultaneously
- WAL mode prevents blocking

### 2. **Data Integrity**
- Foreign key constraints ensure payment references are valid
- Status checks prevent invalid statuses
- Transactions ensure all-or-nothing operations

### 3. **Better Performance**
- Indexed queries for faster searches
- Efficient filtering and sorting
- No need to load entire database into memory

### 4. **Advanced Queries** (Available for future use)
```typescript
import { getBookingsByStatus, searchBookings } from '@/lib/storage-sqlite';

// Get only active bookings
const activeBookings = getBookingsByStatus('Active');

// Search bookings by customer name or WhatsApp
const results = searchBookings('John');
```

## File Structure

```
data/
├── bookings.db          # SQLite database (auto-created)
├── bookings.db-shm      # Shared memory file (WAL mode)
├── bookings.db-wal      # Write-ahead log (WAL mode)
├── db.txt               # Old JSON file (keep as backup)
├── db.txt.backup.*      # Migration backups
└── services.json        # Service categories (unchanged)
```

## Troubleshooting

### Issue: `better-sqlite3` won't install

**Solution:** Make sure you have:
- Python installed (required for node-gyp)
- Build tools for your platform:
  - **Windows**: `npm install --global windows-build-tools`
  - **Mac**: Xcode Command Line Tools
  - **Linux**: `build-essential` package

### Issue: Database locked errors

**Cause:** Another process is accessing the database

**Solution:**
- WAL mode (enabled by default) should prevent this
- Check for multiple app instances running
- Restart the application

### Issue: Migration failed

**Solution:**
1. Check the backup file created: `data/db.txt.backup.*`
2. Review error messages from migration script
3. Fix data issues in JSON file
4. Delete `data/bookings.db` and retry migration

## Rollback

If you need to rollback to JSON:

1. Stop the application
2. Restore from backup:
   ```bash
   cp data/db.txt.backup.TIMESTAMP data/db.txt
   ```
3. Revert code to use `@/lib/storage` instead of `@/lib/storage-sqlite`
4. Delete `data/bookings.db`

## Performance Tips

### For Production

1. **Enable WAL mode** (already enabled by default)
   - Better concurrent access
   - Faster writes

2. **Regular backups**
   ```bash
   # Backup SQLite database
   sqlite3 data/bookings.db ".backup data/bookings.backup.db"

   # Or simple file copy (when app is stopped)
   cp data/bookings.db data/bookings.backup.db
   ```

3. **Optimize database**
   ```bash
   sqlite3 data/bookings.db "VACUUM;"
   ```

## Security Notes

- Database file is in `.gitignore` - won't be committed to git
- Keep regular backups
- File permissions should be restricted (owner read/write only)
- Consider encryption at rest for sensitive data

## Support

If you encounter issues:
1. Check this migration guide
2. Review the migration script output
3. Check application logs
4. Verify database file permissions

## Future Enhancements

With SQLite, you can now easily add:
- Advanced reporting queries
- Full-text search
- Data analytics
- Export to CSV/Excel
- Automated backups
- Database replication

Enjoy your new SQLite-powered booking system! 🚀
