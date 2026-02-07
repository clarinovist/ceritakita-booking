import { getDb } from '@/lib/db';
import { logger } from '@/lib/logger';
import { SystemSettings } from '@/lib/types/settings';

// Simple in-memory cache for system settings
let cachedSystemSettings: SystemSettings | null = null;

/**
 * Get all system settings as an object
 */
export function getSystemSettings(): SystemSettings {
  // Return cached settings if available
  if (cachedSystemSettings) {
    return cachedSystemSettings;
  }

  const db = getDb();
  const stmt = db.prepare('SELECT key, value FROM system_settings ORDER BY key');
  const rows = stmt.all() as Array<{ key: string; value: string }>;

  const settings: any = {
    site_name: 'Cerita Kita',
    site_logo: '/images/default-logo.png',
    business_phone: '+62 812 3456 7890',
    business_address: 'Jalan Raya No. 123, Jakarta',
    whatsapp_admin_number: '+62 812 3456 7890',
    whatsapp_message_template: 'Halo {{customer_name}}!\n\nBooking Anda untuk {{service}} pada {{date}} pukul {{time}} telah dikonfirmasi.\n\nTotal: Rp {{total_price}}\nID Booking: {{booking_id}}\n\nTerima kasih telah memilih Cerita Kita!'
  };

  // Override with database values
  const jsonKeys = ['invoice', 'seo'];
  rows.forEach(row => {
    if (jsonKeys.includes(row.key)) {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch (e) {
        settings[row.key] = {};
      }
    } else {
      settings[row.key] = row.value;
    }
  });

  // Update cache
  cachedSystemSettings = Object.freeze(settings as SystemSettings);

  return settings as SystemSettings;
}

/**
 * Get a single system setting by key
 */
export function getSystemSetting(key: string): string | null {
  // Use cached settings if available to avoid DB hit
  const settings = getSystemSettings() as any;
  const val = settings[key];
  if (val === undefined) return null;
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

/**
 * Update system settings (supports batch updates)
 * Includes audit trail logging
 */
export function updateSystemSettings(settings: Record<string, string>, updatedBy: string = 'system'): void {
  // Invalidate cache
  cachedSystemSettings = null;

  const db = getDb();

  const selectStmt = db.prepare('SELECT value FROM system_settings WHERE key = ?');
  const updateStmt = db.prepare(`
    INSERT OR REPLACE INTO system_settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `);
  const auditStmt = db.prepare(`
    INSERT INTO system_settings_audit (key, old_value, new_value, updated_by, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  const transaction = db.transaction(() => {
    Object.entries(settings).forEach(([key, value]) => {
      // Get old value for audit trail
      const oldRow = selectStmt.get(key) as { value: string } | undefined;
      const oldValue = oldRow ? oldRow.value : null;

      // Update setting
      updateStmt.run(key, value);

      // Log change to audit table
      auditStmt.run(key, oldValue, value, updatedBy);

      logger.info(`Setting updated: ${key}`, {
        oldValue: oldValue || '(none)',
        newValue: value,
        updatedBy
      });
    });
  });

  transaction();
}

/**
 * Initialize system settings with defaults (if not exists)
 */
export function initializeSystemSettings(): void {
  // Invalidate cache
  cachedSystemSettings = null;

  const db = getDb();
  const defaults: Record<string, string> = {
    site_name: 'Cerita Kita',
    site_logo: '/images/default-logo.png',
    business_phone: '+62 812 3456 7890',
    business_address: 'Jalan Raya No. 123, Jakarta',
    whatsapp_admin_number: '+62 812 3456 7890',
    whatsapp_message_template: 'Halo {{customer_name}}!\n\nBooking Anda untuk {{service}} pada {{date}} pukul {{time}} telah dikonfirmasi.\n\nTotal: Rp {{total_price}}\nID Booking: {{booking_id}}\n\nTerima kasih telah memilih Cerita Kita!'
  };

  const checkStmt = db.prepare('SELECT key FROM system_settings WHERE key = ?');
  const insertStmt = db.prepare('INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)');

  const transaction = db.transaction(() => {
    Object.entries(defaults).forEach(([key, value]) => {
      const exists = checkStmt.get(key);
      if (!exists) {
        insertStmt.run(key, value);
      }
    });
  });

  transaction();
}
