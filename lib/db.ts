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
      drive_link TEXT,

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

  try {
    db.exec(`ALTER TABLE bookings ADD COLUMN drive_link TEXT`);
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

  // Create wa_clicks table for WhatsApp redirect tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS wa_clicks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL DEFAULT 'unknown',
      package TEXT NOT NULL DEFAULT 'General',
      utm_campaign TEXT,
      utm_medium TEXT,
      utm_content TEXT,
      ip TEXT,
      user_agent TEXT,
      referrer TEXT,
      clicked_at TEXT DEFAULT CURRENT_TIMESTAMP
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
      { key: 'site_name', value: 'CeritaKita Studio' },
      { key: 'site_logo', value: '/images/default-logo.png' },
      { key: 'business_phone', value: '+62 812 3456 7890' },
      { key: 'business_address', value: 'Sukoharjo, Jawa Tengah, Indonesia' },
      { key: 'initial_cash_balance', value: '0' }
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
    CREATE INDEX IF NOT EXISTS idx_wa_clicks_source ON wa_clicks(source);
    CREATE INDEX IF NOT EXISTS idx_wa_clicks_clicked_at ON wa_clicks(clicked_at);
    CREATE INDEX IF NOT EXISTS idx_wa_clicks_package ON wa_clicks(package);
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

  // Create performance_metrics table
  db.exec(`
    CREATE TABLE IF NOT EXISTS performance_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation TEXT NOT NULL,
      module TEXT NOT NULL,
      execution_time_ms REAL NOT NULL,
      timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      metadata TEXT -- Extra context in JSON
    )
  `);

  // Create indexes for leads table and performance metrics
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
    CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
    CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
    CREATE INDEX IF NOT EXISTS idx_leads_whatsapp ON leads(whatsapp);
    CREATE INDEX IF NOT EXISTS idx_leads_status_source ON leads(status, source);
    CREATE INDEX IF NOT EXISTS idx_leads_follow_up ON leads(next_follow_up) WHERE next_follow_up IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_perf_metrics_op ON performance_metrics(operation);
    CREATE INDEX IF NOT EXISTS idx_perf_metrics_ts ON performance_metrics(timestamp);
    CREATE INDEX IF NOT EXISTS idx_perf_metrics_module ON performance_metrics(module);
  `);

  // Create lead_interactions table (Mini CRM Upgrade)
  db.exec(`
    CREATE TABLE IF NOT EXISTS lead_interactions (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      interaction_type TEXT NOT NULL CHECK(interaction_type IN ('WhatsApp', 'Phone', 'Email', 'Note')),
      interaction_content TEXT,
      created_by TEXT,
      meta_event_sent INTEGER DEFAULT 0, -- Boolean 0/1
      meta_event_id TEXT,
      
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for lead_interactions
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_lead_interactions_lead_id ON lead_interactions(lead_id);
    CREATE INDEX IF NOT EXISTS idx_lead_interactions_created_at ON lead_interactions(created_at);
  `);

  // Add interest column to existing leads table (migration)
  try {
    db.exec(`ALTER TABLE leads ADD COLUMN interest TEXT`);
    console.log('✅ Database migration: Added interest column to leads table');
  } catch {
    // Column already exists
  }

  // Create expenses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('operational', 'equipment', 'marketing', 'salary', 'other')),
      description TEXT NOT NULL,
      amount INTEGER NOT NULL,
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes for expenses table
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
  `);

  // Create website_traffic table for analytics
  db.exec(`
    CREATE TABLE IF NOT EXISTS website_traffic (
      id TEXT PRIMARY KEY,
      path TEXT NOT NULL,
      visitor_id TEXT NOT NULL,
      user_agent TEXT,
      device_type TEXT NOT NULL CHECK(device_type IN ('mobile', 'desktop', 'tablet', 'unknown')),
      referer TEXT,
      visited_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes for website_traffic
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_traffic_visited_at ON website_traffic(visited_at);
    CREATE INDEX IF NOT EXISTS idx_traffic_path ON website_traffic(path);
    CREATE INDEX IF NOT EXISTS idx_traffic_visitor_id ON website_traffic(visitor_id);
  `);

  // --- FREELANCER TABLES ---

  // Create freelancers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS freelancers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      default_fee INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create freelancer_roles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS freelancer_roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      short_code TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed Freelancer Roles (if empty)
  const freelancerRolesCount = db.prepare('SELECT COUNT(*) as count FROM freelancer_roles').get() as { count: number };
  if (freelancerRolesCount.count === 0) {
    const seedRoles = [
      { name: 'Photographer', short_code: 'FG' },
      { name: 'Makeup Artist', short_code: 'MUA' },
      { name: 'Videographer', short_code: 'VG' },
      { name: 'Assistant', short_code: 'AST' },
      { name: 'Designer', short_code: 'DSG' },
    ];

    const insertStmt = db.prepare('INSERT INTO freelancer_roles (id, name, short_code) VALUES (?, ?, ?)');
    const insertMany = db.transaction(() => {
      seedRoles.forEach(role => Object.assign(role, { id: randomUUID() }));
      seedRoles.forEach(role => insertStmt.run(randomUUID(), role.name, role.short_code));
    });
    insertMany();
    console.log('✅ Database seeded: Freelancer Roles');
  }

  // Create freelancer_jobs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS freelancer_jobs (
      id TEXT PRIMARY KEY,
      freelancer_id TEXT NOT NULL,
      booking_id TEXT, -- Optional, can be independent of a specific booking via system
      role_id TEXT NOT NULL,
      work_date TEXT NOT NULL, -- The date the job was performed
      fee INTEGER NOT NULL,
      notes TEXT,
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (freelancer_id) REFERENCES freelancers(id) ON DELETE CASCADE,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
      FOREIGN KEY (role_id) REFERENCES freelancer_roles(id)
    )
  `);

  // Create indexes for freelancer tables
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_freelancers_is_active ON freelancers(is_active);
    CREATE INDEX IF NOT EXISTS idx_freelancer_roles_is_active ON freelancer_roles(is_active);
    CREATE INDEX IF NOT EXISTS idx_freelancer_jobs_freelancer_id ON freelancer_jobs(freelancer_id);
    CREATE INDEX IF NOT EXISTS idx_freelancer_jobs_booking_id ON freelancer_jobs(booking_id);
    CREATE INDEX IF NOT EXISTS idx_freelancer_jobs_work_date ON freelancer_jobs(work_date);
  `);

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
      { section: 'hero', key: 'tagline', value: 'Lagi Butuh Foto Apa?' },
      { section: 'hero', key: 'subtagline', value: 'Foto sendiri bisa. Difotoin juga bisa. Dari self photo, family, wisuda, pas foto, sampai prewedding — semua ada di CeritaKita Studio Sukoharjo.' },
      { section: 'hero', key: 'cta_text', value: 'Booking Sekarang' },
      { section: 'hero', key: 'background_image', value: '/images/hero_photography.png' },
      // About
      { section: 'about', key: 'label', value: 'Tentang Kami' },
      { section: 'about', key: 'headline', value: 'Studio Foto Lengkap untuk Setiap Cerita' },
      { section: 'about', key: 'body_1', value: 'CeritaKita Studio adalah studio foto di Sukoharjo yang melayani berbagai kebutuhan: self photo, family, wisuda, pas foto, sesi fotografer, dan prewedding.' },
      { section: 'about', key: 'body_2', value: 'Mau foto sendiri? Bisa. Mau dibantu fotografer? Buga bisa. Tinggal pilih paket yang paling cocok buat momen kamu.' },
      { section: 'about', key: 'image', value: '/images/studio_interior.png' },
      // Promo
      { section: 'promo', key: 'title', value: 'Self Photo Rp150K — Makeup + Baju Adat Jawa Include' },
      { section: 'promo', key: 'description', value: 'Self photo 30 menit dengan kamera pro, lighting studio, makeup, baju adat Jawa, pose guide, dan semua file high-res via Google Drive.' },
      { section: 'promo', key: 'is_active', value: 'true' },
      // CTA
      { section: 'cta', key: 'headline', value: 'Siap Mengabadikan Momen Kamu?' },
      { section: 'cta', key: 'description', value: 'Pilih layanan, tentukan jadwal, dan biarkan kami yang mengurus sisanya. Booking online atau konsultasi via WhatsApp.' },
      { section: 'cta', key: 'primary_button', value: 'Mulai Booking' },
      { section: 'cta', key: 'secondary_button', value: 'Konsultasi via WhatsApp' },
      // Footer
      { section: 'footer', key: 'tagline', value: 'Studio foto di Sukoharjo untuk self photo, family, wisuda, pas foto, prewedding, dan momen spesial lainnya.' },
      { section: 'footer', key: 'email', value: 'hello@ceritakitastudio.site' },
      { section: 'footer', key: 'phone', value: '+62 812 3456 7890' },
      { section: 'footer', key: 'address', value: 'Sukoharjo, Jawa Tengah, Indonesia' },
      { section: 'footer', key: 'whatsapp', value: '6281234567890' },
      { section: 'footer', key: 'instagram', value: 'https://instagram.com/ceritakitastudio' },
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

  // Seed Service Categories (only on first run)
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM service_categories').get() as { count: number };
  if (categoryCount.count === 0) {
    const seedCategories = [
      { name: 'Self Photo', slug: 'self-photo', description: 'Foto sendiri dengan kamera pro, lighting studio, makeup + baju adat Jawa include. Rp150k.', thumbnail_url: '/images/self-photo.png', display_order: 1 },
      { name: 'Family', slug: 'family', description: 'Foto keluarga 6 orang Rp300k. Include photographer + asisten + cetak 4R & 10R + file GDrive.', thumbnail_url: '/images/family.png', display_order: 2 },
      { name: 'Wisuda', slug: 'graduation', description: 'Foto wisuda personal, bareng teman, atau keluarga. Studio atau outdoor.', thumbnail_url: '/images/graduation.png', display_order: 3 },
      { name: 'Prewedding', slug: 'prewedding', description: 'Sesi foto pasangan dengan fotografer, pose direction, dan konsep yang lebih niat.', thumbnail_url: '/images/prewedding.png', display_order: 5 },
      { name: 'Wedding', slug: 'wedding', description: 'Dokumentasi lengkap hari pernikahan Anda.', thumbnail_url: '/images/wedding.png', display_order: 6 },
      { name: 'Birthday', slug: 'birthday', description: 'Kenangan manis pesta ulang tahun.', thumbnail_url: '/images/birthday.png', display_order: 7 },
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

  // Ensure critical categories exist and are active (runs every startup, idempotent)
  ensureCategoriesExist(db);
  // Deactivate Pas Foto on homepage grid (utility service, not aspirational)
  deactivateNonVisualCategories(db);

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
      { title: "Foto Sendiri atau Dibantu Fotografer", description: "Self photo untuk yang mau pegang kontrol sendiri. Paket fotografer untuk yang mau diarahkan penuh.", icon: "Camera" },
      { title: "Paket Jelas & Fleksibel", description: "Self Photo Rp150k, Family Rp300k, plus add-on sesuai kebutuhan. Transparan, tanpa biaya tersembunyi.", icon: "CreditCard" },
      { title: "File High-Res via Google Drive", description: "Semua file JPG high-res bisa diakses dan di-download kapan saja melalui Google Drive.", icon: "Cloud" },
      { title: "Studio Nyaman, Kamera & Lighting Siap", description: "Studio indoor nyaman dengan kamera profesional dan lighting yang disiapkan sesuai kebutuhan sesi.", icon: "Zap" },
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

  // --- WHATSAPP TABLES ---
  db.exec(`
    CREATE TABLE IF NOT EXISTS wati_raw_events (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      wati_id TEXT,
      payload TEXT NOT NULL,
      received_at TEXT DEFAULT CURRENT_TIMESTAMP,
      processed_at TEXT,
      processing_status TEXT DEFAULT 'pending',
      error_message TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS whatsapp_contacts (
      id TEXT PRIMARY KEY,
      phone_number TEXT NOT NULL UNIQUE,
      display_name TEXT,
      wati_contact_id TEXT,
      is_opted_in INTEGER DEFAULT 1,
      opted_in_at TEXT,
      last_message_at TEXT,
      linked_customer_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS whatsapp_conversations (
      id TEXT PRIMARY KEY,
      wati_conversation_id TEXT,
      contact_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'pending_human', 'resolved', 'archived')),
      assigned_to TEXT,
      last_inbound_at TEXT,
      last_outbound_at TEXT,
      last_message_at TEXT,
      booking_id TEXT,
      crm_label TEXT DEFAULT 'leads',
      next_fu_at TEXT,
      fu_note TEXT,
      fu_template_key TEXT,
      last_fu_at TEXT,
      fu_count INTEGER NOT NULL DEFAULT 0,
      label_source TEXT DEFAULT 'system',
      label_updated_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contact_id) REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
    )
  `);

  // Add new columns to existing whatsapp_conversations table (migration)
  const columnsToAdd = [
    { name: 'crm_label', definition: "TEXT DEFAULT 'leads'" },
    { name: 'next_fu_at', definition: 'TEXT' },
    { name: 'fu_note', definition: 'TEXT' },
    { name: 'fu_template_key', definition: 'TEXT' },
    { name: 'last_fu_at', definition: 'TEXT' },
    { name: 'fu_count', definition: 'INTEGER NOT NULL DEFAULT 0' },
    { name: 'label_source', definition: "TEXT DEFAULT 'system'" },
    { name: 'label_updated_at', definition: 'TEXT' }
  ];

  for (const col of columnsToAdd) {
    try {
      db.exec(`ALTER TABLE whatsapp_conversations ADD COLUMN ${col.name} ${col.definition}`);
      console.log(`✅ Database migration: Added ${col.name} column to whatsapp_conversations table`);
    } catch {
      // Column already exists
    }
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS whatsapp_messages (
      id TEXT PRIMARY KEY,
      wati_message_id TEXT UNIQUE,
      conversation_id TEXT NOT NULL,
      contact_id TEXT NOT NULL,
      direction TEXT NOT NULL CHECK(direction IN ('incoming', 'outgoing')),
      sender_type TEXT NOT NULL CHECK(sender_type IN ('customer', 'owner', 'cs', 'bot', 'system')),
      message_type TEXT NOT NULL DEFAULT 'text',
      text TEXT,
      media_url TEXT,
      media_mime_type TEXT,
      reply_to_message_id TEXT,
      status TEXT CHECK(status IN ('sent', 'delivered', 'read', 'failed')),
      wati_timestamp TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      raw_event_id TEXT,
      FOREIGN KEY (conversation_id) REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (contact_id) REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
      FOREIGN KEY (raw_event_id) REFERENCES wati_raw_events(id) ON DELETE SET NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS message_outbox (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      contact_id TEXT NOT NULL,
      channel TEXT NOT NULL DEFAULT 'wati',
      send_type TEXT NOT NULL DEFAULT 'session_text',
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'sending', 'sent', 'failed', 'cancelled')),
      attempt_count INTEGER DEFAULT 0,
      last_error TEXT,
      scheduled_at TEXT NOT NULL,
      sent_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (contact_id) REFERENCES whatsapp_contacts(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS whatsapp_conversation_insights (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      summary TEXT,
      intent TEXT,
      sentiment TEXT,
      urgency TEXT,
      risk_level TEXT,
      needs_human INTEGER DEFAULT 0,
      suggested_next_action TEXT,
      confidence REAL DEFAULT 0,
      model_name TEXT,
      source_message_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES whatsapp_conversations(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS whatsapp_ai_drafts (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      message_id TEXT,
      draft_text TEXT NOT NULL,
      draft_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'drafted',
      risk_level TEXT,
      guardrail_notes TEXT,
      created_by TEXT NOT NULL DEFAULT 'ai',
      approved_by TEXT,
      sent_outbox_id TEXT,
      model_name TEXT,
      prompt_version TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES whatsapp_conversations(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS whatsapp_ai_events (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      input_snapshot TEXT,
      output_snapshot TEXT,
      actor TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES whatsapp_conversations(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for WhatsApp tables
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_wa_raw_events_status ON wati_raw_events(processing_status);
    CREATE INDEX IF NOT EXISTS idx_wa_contacts_phone ON whatsapp_contacts(phone_number);
    CREATE INDEX IF NOT EXISTS idx_wa_contacts_wati_id ON whatsapp_contacts(wati_contact_id);
    CREATE INDEX IF NOT EXISTS idx_wa_conv_contact ON whatsapp_conversations(contact_id);
    CREATE INDEX IF NOT EXISTS idx_wa_conv_last_msg ON whatsapp_conversations(last_message_at);
    CREATE INDEX IF NOT EXISTS idx_wa_conv_booking ON whatsapp_conversations(booking_id);
    CREATE INDEX IF NOT EXISTS idx_wa_msg_conv_time ON whatsapp_messages(conversation_id, wati_timestamp);
    CREATE INDEX IF NOT EXISTS idx_wa_msg_contact ON whatsapp_messages(contact_id);
    CREATE INDEX IF NOT EXISTS idx_wa_msg_wati_id ON whatsapp_messages(wati_message_id);
    CREATE INDEX IF NOT EXISTS idx_msg_outbox_status ON message_outbox(status);
    CREATE INDEX IF NOT EXISTS idx_wa_conv_crm_label ON whatsapp_conversations(crm_label);
    CREATE INDEX IF NOT EXISTS idx_wa_conv_next_fu_at ON whatsapp_conversations(next_fu_at);
    CREATE INDEX IF NOT EXISTS idx_wa_conv_label_fu ON whatsapp_conversations(crm_label, next_fu_at);
    CREATE INDEX IF NOT EXISTS idx_wa_insights_conv ON whatsapp_conversation_insights(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_wa_drafts_conv ON whatsapp_ai_drafts(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_wa_events_conv ON whatsapp_ai_events(conversation_id);
  `);
}

/**
 * Ensure critical categories exist and are active.
 * Runs every startup — idempotent, safe for existing production DBs.
 * Uses INSERT OR IGNORE for new categories, UPDATE to activate existing ones.
 */
function ensureCategoriesExist(db: Database.Database) {
  const requiredCategories = [
    {
      name: 'Self Photo',
      slug: 'self-photo',
      description: 'Foto sendiri dengan kamera pro, lighting studio, makeup + baju adat Jawa include. Rp150k.',
      thumbnail_url: '/images/self-photo.png',
      display_order: 1,
    },
    {
      name: 'Family',
      slug: 'family',
      description: 'Foto keluarga 6 orang Rp300k. Include photographer + asisten + cetak 4R & 10R + file GDrive.',
      thumbnail_url: '/images/family.png',
      display_order: 2,
    },
  ];

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO service_categories (id, name, slug, description, thumbnail_url, display_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);
  const activateStmt = db.prepare(`
    UPDATE service_categories SET is_active = 1, display_order = ? WHERE slug = ? AND is_active = 0
  `);
  const updateDescStmt = db.prepare(`
    UPDATE service_categories SET description = ? WHERE slug = ? AND description != ?
  `);

  const tx = db.transaction(() => {
    for (const cat of requiredCategories) {
      insertStmt.run(randomUUID(), cat.name, cat.slug, cat.description, cat.thumbnail_url, cat.display_order);
      activateStmt.run(cat.display_order, cat.slug);
      updateDescStmt.run(cat.description, cat.slug, cat.description);
    }
  });
  tx();
  console.log('✅ ensureCategoriesExist: Self Photo, Family verified');
}

/**
 * Deactivate non-visual/utility categories from homepage grid.
 * Pas Foto is a utility service (document/ID photos) — not aspirational,
 * doesn't belong in the visual browsing grid. It stays available via
 * WA quick reply, Google Maps, and service detail page.
 */
function deactivateNonVisualCategories(db: Database.Database) {
  const nonVisualSlugs = ['pas-foto'];
  const stmt = db.prepare(`UPDATE service_categories SET is_active = 0 WHERE slug = ?`);
  const tx = db.transaction(() => {
    for (const slug of nonVisualSlugs) {
      stmt.run(slug);
    }
  });
  tx();
  console.log('✅ deactivateNonVisualCategories: Pas Foto hidden from grid');
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
