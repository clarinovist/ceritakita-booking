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
  } catch {
    // Column already exists
  }

  try {
    db.exec(`ALTER TABLE bookings ADD COLUMN service_base_price INTEGER`);
  } catch {
    // Column already exists
  }

  try {
    db.exec(`ALTER TABLE bookings ADD COLUMN base_discount INTEGER`);
  } catch {
    // Column already exists
  }

  try {
    db.exec(`ALTER TABLE bookings ADD COLUMN addons_total INTEGER`);
  } catch {
    // Column already exists
  }

  try {
    db.exec(`ALTER TABLE bookings ADD COLUMN coupon_discount INTEGER`);
  } catch {
    // Column already exists
  }

  try {
    db.exec(`ALTER TABLE bookings ADD COLUMN coupon_code TEXT`);
  } catch {
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
    } catch {
      console.error('❌ Failed to add permissions column');
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
  } catch {
    // Column already exists
  }

  try {
    db.exec(`ALTER TABLE payments ADD COLUMN storage_backend TEXT DEFAULT 'local'`);
  } catch {
    // Column already exists
  }

  // Add is_active column to portfolio_images table (migration)
  try {
    db.exec(`ALTER TABLE portfolio_images ADD COLUMN is_active INTEGER DEFAULT 1`);
  } catch {
    // Column already exists
  }

  // Migrate existing single payment_settings to payment_methods
  try {
    const existingSettings = db.prepare('SELECT * FROM payment_settings LIMIT 1').get() as Record<string, unknown> | undefined;
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
  } catch {
    // Table doesn't exist or no data to migrate
  }

  // Drop old single payment_settings table if it exists
  try {
    db.exec('DROP TABLE IF EXISTS payment_settings');
  } catch {
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

  // Create leads table for Mini CRM
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      
      -- Core lead information
      name TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      email TEXT,
      
      -- Lead tracking
      status TEXT NOT NULL CHECK(status IN ('New', 'Contacted', 'Follow Up', 'Won', 'Lost', 'Converted')),
      source TEXT NOT NULL CHECK(source IN ('Meta Ads', 'Organic', 'Referral', 'Instagram', 'WhatsApp', 'Phone Call', 'Website Form', 'Other')),
      interest TEXT, -- JSON string of interested services
      notes TEXT,
      
      -- Assignment and conversion
      assigned_to TEXT,
      booking_id TEXT,
      converted_at TEXT,
      last_contacted_at TEXT,
      next_follow_up TEXT,
      
      -- Foreign key constraints
      FOREIGN KEY (assigned_to) REFERENCES users(id),
      FOREIGN KEY (booking_id) REFERENCES bookings(id)
    )
  `);

  // Create indexes for leads table
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
    CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
    CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
    CREATE INDEX IF NOT EXISTS idx_leads_whatsapp ON leads(whatsapp);
  `);

  // Add interest column to existing leads table (migration)
  try {
    db.exec(`ALTER TABLE leads ADD COLUMN interest TEXT`);
    console.log('✅ Database migration: Added interest column to leads table');
  } catch {
    // Column already exists
  }

  // --- HOMEPAGE CMS TABLES ---

  // 1. Homepage Content (Key-Value Store)
  db.exec(`
    CREATE TABLE IF NOT EXISTS homepage_content (
      id TEXT PRIMARY KEY,
      section TEXT NOT NULL, -- 'hero', 'about', 'cta', 'footer', 'promo'
      content_key TEXT NOT NULL,
      content_value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(section, content_key)
    )
  `);

  // Seed Homepage Content
  const homepageContentCount = db.prepare('SELECT COUNT(*) as count FROM homepage_content').get() as { count: number };
  if (homepageContentCount.count === 0) {
    const seedContent = [
      // Hero
      { section: 'hero', key: 'tagline', value: 'Abadikan Setiap Momen Berharga' },
      { section: 'hero', key: 'subtagline', value: 'Dari wisuda hingga pernikahan, kami siap merekam cerita indah Anda dalam bingkai kenangan yang tak terlupakan.' },
      { section: 'hero', key: 'cta_text', value: 'Booking Sekarang' },
      { section: 'hero', key: 'background_image', value: '/images/hero_photography.png' },
      // About
      { section: 'about', key: 'label', value: 'Tentang Kami' },
      { section: 'about', key: 'headline', value: 'Studio Foto untuk Setiap Cerita Anda' },
      { section: 'about', key: 'body_1', value: 'CeritaKita hadir untuk mengabadikan setiap detik kebahagiaan Anda. Kami percaya bahwa setiap foto memiliki cerita yang layak untuk dikenang selamanya.' },
      { section: 'about', key: 'body_2', value: 'Dengan tim fotografer profesional dan peralatan modern, kami menjamin kualitas terbaik untuk setiap sesi pemotretan Anda.' },
      { section: 'about', key: 'image', value: '/images/studio_interior.png' },
      // Promo
      { section: 'promo', key: 'title', value: 'Promo Spesial Bulan Ini' },
      { section: 'promo', key: 'description', value: 'Jangan lewatkan penawaran terbatas untuk paket Prewedding dan Family.' },
      { section: 'promo', key: 'is_active', value: 'true' },
      // CTA
      { section: 'cta', key: 'headline', value: 'Siap Mengabadikan Momen Anda?' },
      { section: 'cta', key: 'description', value: 'Pilih layanan, tentukan jadwal, dan biarkan kami yang mengurus sisanya.' },
      { section: 'cta', key: 'primary_button', value: 'Mulai Booking' },
      { section: 'cta', key: 'secondary_button', value: 'Konsultasi via WhatsApp' },
      // Footer
      { section: 'footer', key: 'tagline', value: 'Studio foto profesional untuk prewedding, wedding, wisuda, dan momen spesial lainnya.' },
      { section: 'footer', key: 'email', value: 'hello@ceritakita.studio' },
      { section: 'footer', key: 'phone', value: '+62 812 3456 7890' },
      { section: 'footer', key: 'address', value: 'Jakarta, Indonesia' },
      { section: 'footer', key: 'whatsapp', value: '6281234567890' },
      { section: 'footer', key: 'instagram', value: 'https://instagram.com/ceritakita' },
    ];

    const insertStmt = db.prepare('INSERT INTO homepage_content (id, section, content_key, content_value) VALUES (?, ?, ?, ?)');
    const insertMany = db.transaction(() => {
      seedContent.forEach(item => {
        insertStmt.run(randomUUID(), item.section, item.key, item.value);
      });
    });
    insertMany();
    console.log('✅ Database seeded: Homepage Content');
  }

  // 2. Service Categories
  db.exec(`
    CREATE TABLE IF NOT EXISTS service_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      thumbnail_url TEXT,
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed Service Categories
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM service_categories').get() as { count: number };
  if (categoryCount.count === 0) {
    const seedCategories = [
      { name: 'Prewedding', slug: 'prewedding', description: 'Abadikan kemesraan sebelum hari bahagia.', thumbnail_url: '/images/prewedding.png', display_order: 1 },
      { name: 'Wedding', slug: 'wedding', description: 'Dokumentasi lengkap hari pernikahan Anda.', thumbnail_url: '/images/wedding.png', display_order: 2 },
      { name: 'Wisuda', slug: 'graduation', description: 'Rayakan kelulusan dengan foto profesional.', thumbnail_url: '/images/graduation.png', display_order: 3 },
      { name: 'Birthday', slug: 'birthday', description: 'Kenangan manis pesta ulang tahun.', thumbnail_url: '/images/birthday.png', display_order: 4 },
      { name: 'Family', slug: 'family', description: 'Foto keluarga di studio yang nyaman.', thumbnail_url: '/images/family.png', display_order: 5 },
      { name: 'Tematik', slug: 'themed', description: 'Foto dengan tema khusus sesuai keinginan.', thumbnail_url: '/images/themed.png', display_order: 6 },
    ];

    const insertStmt = db.prepare('INSERT INTO service_categories (id, name, slug, description, thumbnail_url, display_order) VALUES (?, ?, ?, ?, ?, ?)');
    const insertMany = db.transaction(() => {
      seedCategories.forEach((cat) => {
        insertStmt.run(randomUUID(), cat.name, cat.slug, cat.description, cat.thumbnail_url, cat.display_order);
      });
    });
    insertMany();
    console.log('✅ Database seeded: Service Categories');
  }

  // 3. Testimonials
  db.exec(`
    CREATE TABLE IF NOT EXISTS testimonials (
      id TEXT PRIMARY KEY,
      quote TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_title TEXT,
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed Testimonials
  const testimonialCount = db.prepare('SELECT COUNT(*) as count FROM testimonials').get() as { count: number };
  if (testimonialCount.count === 0) {
    const seedTestimonials = [
      { quote: "Hasil fotonya sangat memuaskan! Timnya ramah dan profesional banget. Suka banget sama editingnya yang natural.", author_name: "Sarah & Dimas", author_title: "Prewedding Session" },
      { quote: "Studio-nya nyaman, properti lengkap. Fotografernya sabar banget arahin gaya buat kita yang kaku ini. Recommended!", author_name: "Budi Santoso", author_title: "Family Photo" },
      { quote: "Momen wisuda jadi makin berkesan berkat CeritaKita. Kualitas cetaknya juga premium abis. Thank you!", author_name: "Jessica M.", author_title: "Graduation Package" },
    ];

    const insertStmt = db.prepare('INSERT INTO testimonials (id, quote, author_name, author_title, display_order) VALUES (?, ?, ?, ?, ?)');
    const insertMany = db.transaction(() => {
      seedTestimonials.forEach((t, index) => {
        insertStmt.run(randomUUID(), t.quote, t.author_name, t.author_title, index);
      });
    });
    insertMany();
    console.log('✅ Database seeded: Testimonials');
  }

  // 4. Value Propositions
  db.exec(`
    CREATE TABLE IF NOT EXISTS value_propositions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed Value Propositions
  const valuePropCount = db.prepare('SELECT COUNT(*) as count FROM value_propositions').get() as { count: number };
  if (valuePropCount.count === 0) {
    const seedValueProps = [
      { title: "Fotografer Profesional", description: "Tim berpengalaman yang siap mengarahkan gaya terbaik Anda.", icon: "Camera" },
      { title: "Studio Nyaman", description: "Ruang studio full AC dengan berbagai pilihan background.", icon: "Home" },
      { title: "Harga Terjangkau", description: "Paket lengkap dengan harga yang bersahabat.", icon: "CreditCard" },
      { title: "Proses Cepat", description: "Preview foto instan dan hasil edit maksimal 3 hari.", icon: "Zap" },
    ];

    const insertStmt = db.prepare('INSERT INTO value_propositions (id, title, description, icon, display_order) VALUES (?, ?, ?, ?, ?)');
    const insertMany = db.transaction(() => {
      seedValueProps.forEach((vp, index) => {
        insertStmt.run(randomUUID(), vp.title, vp.description, vp.icon, index);
      });
    });
    insertMany();
    console.log('✅ Database seeded: Value Propositions');
  }
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
