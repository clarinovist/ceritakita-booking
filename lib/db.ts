import 'server-only';
import Database from 'better-sqlite3';
import path from 'path';
import { randomUUID } from 'crypto';

const DB_PATH = path.join(process.cwd(), 'data', 'bookings.db');

// Singleton database instance
let db: Database.Database | null = null;

/**
 * Get or create database connection
 */
export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency
    db.pragma('foreign_keys = ON'); // Enable foreign key constraints
    initializeSchema();
  }
  return db;
}

/**
 * Initialize database schema
 */
function initializeSchema() {
  if (!db) return;

  // Create photographers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS photographers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      specialty TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create bookings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Active', 'Cancelled', 'Rescheduled', 'Completed')),

      -- Customer information
      customer_name TEXT NOT NULL,
      customer_whatsapp TEXT NOT NULL,
      customer_category TEXT NOT NULL,
      customer_service_id TEXT,

      -- Booking details
      booking_date TEXT NOT NULL,
      booking_notes TEXT,
      booking_location_link TEXT,

      -- Finance
      total_price INTEGER NOT NULL DEFAULT 0,

      -- Price breakdown (for transparency)
      service_base_price INTEGER,
      base_discount INTEGER,
      addons_total INTEGER,
      coupon_discount INTEGER,
      coupon_code TEXT,

      -- Photographer assignment
      photographer_id TEXT,

      -- Timestamps
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (photographer_id) REFERENCES photographers(id)
    )
  `);

  // Add new columns to existing tables (migration)
  try {
    db.exec(`ALTER TABLE bookings ADD COLUMN customer_service_id TEXT`);
  } catch (e) {
    // Column already exists
  }

  try {
    db.exec(`ALTER TABLE bookings ADD COLUMN service_base_price INTEGER`);
  } catch (e) {
    // Column already exists
  }

  try {
    db.exec(`ALTER TABLE bookings ADD COLUMN base_discount INTEGER`);
  } catch (e) {
    // Column already exists
  }

  try {
    db.exec(`ALTER TABLE bookings ADD COLUMN addons_total INTEGER`);
  } catch (e) {
    // Column already exists
  }

  try {
    db.exec(`ALTER TABLE bookings ADD COLUMN coupon_discount INTEGER`);
  } catch (e) {
    // Column already exists
  }

  try {
    db.exec(`ALTER TABLE bookings ADD COLUMN coupon_code TEXT`);
  } catch (e) {
    // Column already exists
  }

  // Create payments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id TEXT NOT NULL,
      date TEXT NOT NULL,
      amount INTEGER NOT NULL,
      note TEXT,
      proof_filename TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    )
  `);

  // Create add-ons table
  db.exec(`
    CREATE TABLE IF NOT EXISTS addons (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      applicable_categories TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create booking_addons junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS booking_addons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id TEXT NOT NULL,
      addon_id TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      price_at_booking INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      FOREIGN KEY (addon_id) REFERENCES addons(id) ON DELETE CASCADE,
      UNIQUE(booking_id, addon_id)
    )
  `);

  // Create reschedule_history table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reschedule_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id TEXT NOT NULL,
      old_date TEXT NOT NULL,
      new_date TEXT NOT NULL,
      rescheduled_at TEXT DEFAULT CURRENT_TIMESTAMP,
      reason TEXT,

      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    )
  `);

  // Create coupons table
  db.exec(`
    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      discount_type TEXT NOT NULL CHECK(discount_type IN ('percentage', 'fixed')),
      discount_value REAL NOT NULL,
      min_purchase REAL DEFAULT 0,
      max_discount REAL,
      usage_limit INTEGER,
      usage_count INTEGER DEFAULT 0,
      valid_from TEXT,
      valid_until TEXT,
      is_active INTEGER DEFAULT 1,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create coupon usage history table
  db.exec(`
    CREATE TABLE IF NOT EXISTS coupon_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coupon_id TEXT NOT NULL,
      booking_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_whatsapp TEXT NOT NULL,
      discount_amount REAL NOT NULL,
      order_total REAL NOT NULL,
      used_at TEXT DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    )
  `);

  // Create portfolio images table
  db.exec(`
    CREATE TABLE IF NOT EXISTS portfolio_images (
      id TEXT PRIMARY KEY,
      service_id TEXT NOT NULL,
      image_url TEXT NOT NULL,
      display_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create users table for NextAuth credentials
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff' CHECK(role IN ('admin', 'staff')),
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      permissions TEXT
    )
  `);

  // Add permissions column to existing users table if it doesn't exist (migration)
  const tableInfo = db.prepare('PRAGMA table_info(users)').all() as { name: string }[];
  const hasPermissionsColumn = tableInfo.some(col => col.name === 'permissions');

  if (!hasPermissionsColumn) {
    try {
      db.exec(`ALTER TABLE users ADD COLUMN permissions TEXT`);
      console.log('✅ Database migration: Added permissions column to users table');
    } catch (e) {
      console.error('❌ Failed to add permissions column:', e);
    }
  }

  // Create payment_methods table (multiple payment options)
  db.exec(`
    CREATE TABLE IF NOT EXISTS payment_methods (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      provider_name TEXT NOT NULL,
      account_name TEXT NOT NULL,
      account_number TEXT NOT NULL,
      qris_image_url TEXT,
      is_active INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add B2 support columns to payments table
  try {
    db.exec(`ALTER TABLE payments ADD COLUMN proof_url TEXT`);
  } catch (e) {
    // Column already exists
  }

  try {
    db.exec(`ALTER TABLE payments ADD COLUMN storage_backend TEXT DEFAULT 'local'`);
  } catch (e) {
    // Column already exists
  }

  // Migrate existing single payment_settings to payment_methods
  try {
    const existingSettings = db.prepare('SELECT * FROM payment_settings LIMIT 1').get() as any;
    if (existingSettings) {
      // Check if already migrated
      const hasMethods = db.prepare('SELECT COUNT(*) as count FROM payment_methods').get() as { count: number };
      if (hasMethods.count === 0) {
        db.prepare(`
          INSERT INTO payment_methods (id, name, provider_name, account_name, account_number, qris_image_url, display_order)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          randomUUID(),
          existingSettings.bank_name,
          existingSettings.bank_name,
          existingSettings.account_name,
          existingSettings.account_number,
          existingSettings.qris_image_url,
          0
        );
      }
    }
  } catch (e) {
    // Table doesn't exist or no data to migrate
  }

  // Drop old single payment_settings table if it exists
  try {
    db.exec('DROP TABLE IF EXISTS payment_settings');
  } catch (e) {
    // Table doesn't exist
  }

  // Create ads_performance_log table for Meta Ads tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS ads_performance_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date_record TEXT NOT NULL UNIQUE,
      spend REAL NOT NULL DEFAULT 0,
      impressions INTEGER NOT NULL DEFAULT 0,
      clicks INTEGER NOT NULL DEFAULT 0,
      reach INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create system_settings table for dynamic business info
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed default system settings if empty
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM system_settings').get() as { count: number };
  if (settingsCount.count === 0) {
    const defaultSettings = [
      { key: 'site_name', value: 'Cerita Kita' },
      { key: 'site_logo', value: '/images/default-logo.png' },
      { key: 'business_phone', value: '+62 812 3456 7890' },
      { key: 'business_address', value: 'Jalan Raya No. 123, Jakarta' }
    ];

    const insertStmt = db.prepare('INSERT INTO system_settings (key, value) VALUES (?, ?)');
    const insertMany = db.transaction(() => {
      defaultSettings.forEach(setting => {
        insertStmt.run(setting.key, setting.value);
      });
    });
    insertMany();
  }

  // Create system_settings_audit table for tracking changes
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_settings_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      updated_by TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
    CREATE INDEX IF NOT EXISTS idx_bookings_customer_name ON bookings(customer_name);
    CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date);
    CREATE INDEX IF NOT EXISTS idx_bookings_photographer_id ON bookings(photographer_id);
    CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
    CREATE INDEX IF NOT EXISTS idx_photographers_is_active ON photographers(is_active);
    CREATE INDEX IF NOT EXISTS idx_addons_is_active ON addons(is_active);
    CREATE INDEX IF NOT EXISTS idx_booking_addons_booking_id ON booking_addons(booking_id);
    CREATE INDEX IF NOT EXISTS idx_booking_addons_addon_id ON booking_addons(addon_id);
    CREATE INDEX IF NOT EXISTS idx_reschedule_history_booking_id ON reschedule_history(booking_id);
    CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
    CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);
    CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);
    CREATE INDEX IF NOT EXISTS idx_coupon_usage_booking_id ON coupon_usage(booking_id);
    CREATE INDEX IF NOT EXISTS idx_portfolio_service_id ON portfolio_images(service_id);
    CREATE INDEX IF NOT EXISTS idx_ads_performance_log_date ON ads_performance_log(date_record);
    CREATE INDEX IF NOT EXISTS idx_system_settings_audit_key ON system_settings_audit(key);
    CREATE INDEX IF NOT EXISTS idx_system_settings_audit_updated_at ON system_settings_audit(updated_at);
  `);
}

/**
 * Close database connection (for graceful shutdown)
 */
export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

// Export database instance getter
export default getDb;
