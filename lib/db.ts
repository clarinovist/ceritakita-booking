import Database from 'better-sqlite3';
import path from 'path';

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
      status TEXT NOT NULL CHECK(status IN ('Active', 'Canceled', 'Rescheduled', 'Completed', 'Cancelled')),

      -- Customer information
      customer_name TEXT NOT NULL,
      customer_whatsapp TEXT NOT NULL,
      customer_category TEXT NOT NULL,

      -- Booking details
      booking_date TEXT NOT NULL,
      booking_notes TEXT,
      booking_location_link TEXT,

      -- Finance
      total_price INTEGER NOT NULL DEFAULT 0,

      -- Photographer assignment
      photographer_id TEXT,

      -- Timestamps
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (photographer_id) REFERENCES photographers(id)
    )
  `);

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
