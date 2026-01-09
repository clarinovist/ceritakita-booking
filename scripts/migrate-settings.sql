-- Migration Script: Expand System Settings Table
-- Purpose: Add new settings keys for comprehensive admin settings
-- Compatible with: SQLite (Key-Value Store Pattern)
-- Usage: Execute this script to migrate existing database

-- NOTE: system_settings table is a Key-Value store (key, value), not a columnar table.
-- We use INSERT OR IGNORE to add new keys without overwriting existing ones.

-- 1. General & SEO Settings
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('hero_title', 'Capture Your Special Moments');
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('meta_title', 'Cerita Kita - Professional Photography Services');
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('meta_description', 'Professional photography services in Jakarta. Book your special moments with Cerita Kita. Quality service, affordable prices.');

-- 2. Contact & Socials Settings
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('business_email', 'info@ceritakita.studio');
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('instagram_url', '');
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('tiktok_url', '');
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('maps_link', '');

-- 3. Finance Settings
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('bank_name', 'BCA');
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('bank_number', '1234567890');
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('bank_holder', 'CERITA KITA');
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('invoice_notes', 'Terima kasih telah memilih layanan kami. Pembayaran dapat dilakukan sebelum tanggal sesi. Hubungi kami jika ada pertanyaan.');
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('requires_deposit', 'false');
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('deposit_amount', '50'); -- 50% deposit
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('tax_rate', '0'); -- 0% tax

-- 4. Booking Rules Settings
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('min_booking_notice', '1');
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('max_booking_ahead', '90');

-- 5. Templates Settings
-- Ensure whatsapp_message_template exists (it might already be seeded by the app)
INSERT OR IGNORE INTO system_settings (key, value) 
VALUES ('whatsapp_message_template', 'Halo {{customer_name}}!\n\nBooking Anda untuk {{service}} pada {{date}} pukul {{time}} telah dikonfirmasi.\n\nTotal: Rp {{total_price}}\nID Booking: {{booking_id}}\n\nTerima kasih telah memilih Cerita Kita!');

-- Create a backup log of the migration if not exists
CREATE TABLE IF NOT EXISTS settings_migration_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    migrated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    status TEXT
);

INSERT INTO settings_migration_log (description, status) 
VALUES ('Expanded system_settings table with new keys (Key-Value)', 'completed');

SELECT 'Migration completed successfully' as result;