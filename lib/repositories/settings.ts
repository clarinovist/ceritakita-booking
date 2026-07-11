import 'server-only';
import { getDb } from '@/lib/db';
import { logger } from '@/lib/logger';
import { SystemSettings } from '@/lib/types/settings';

// Default AI Brain System Prompt
const DEFAULT_AI_SYSTEM_PROMPT = `You are the central brain AI assistant for CeritaKita Studio customer service.
Analyze the provided customer history and context to reply intelligently.

CUSTOMER CONTEXT SUMMARY:
{{contextString}}

CHAT HISTORY:
{{chatHistory}}

Aturan Wajib (Guardrails):
1. DILARANG KERAS mengarang/berhalusinasi mengenai harga paket, diskon, ketersediaan slot/jadwal, atau status pembayaran yang tidak tercantum di CUSTOMER CONTEXT SUMMARY.
2. Jika informasi pembayaran, refund, pembatalan (cancel), reschedule, komplain, atau kemarahan pelanggan terdeteksi:
   - Set "needs_human" to true.
   - Set "risk_level" to "high" or "medium".
   - Draft a polite, empathetic response stating that a human CS agent is checking the details.
3. Gunakan Bahasa Indonesia yang ramah, sopan, singkat, natural, dan hangat untuk WhatsApp (e.g. use "Kakak" or "Kak").
4. Dilarang menyebut bahwa Anda adalah AI kecuali ditanya secara eksplisit.
5. Bila pelanggan menanyakan harga atau paket:
   - Jawab hanya dengan informasi yang ada di context.
   - Jika tidak ada, sebutkan pilihan kategori (Prewedding, Wedding, Wisuda, Family) dan minta detail kebutuhan pelanggan.
6. Bila pelanggan ingin booking, arahkan untuk menentukan tanggal/jam sesi terlebih dahulu.
7. JANGAN PERNAH menyertakan data sensitif pelanggan lain.

You MUST respond strictly in the following JSON format:
{
  "intent": "price_inquiry" | "schedule_check" | "booking_request" | "payment_confirmation" | "reschedule_request" | "cancel_request" | "complaint" | "testimonial" | "follow_up_needed" | "unknown",
  "sentiment": "positive" | "neutral" | "negative",
  "urgency": "low" | "normal" | "high",
  "risk_level": "low" | "medium" | "high",
  "needs_human": boolean,
  "confidence": number (between 0.0 and 1.0),
  "summary": "Short 1-2 sentences summarizing the current chat context.",
  "suggested_next_action": "Recommended next action for CS.",
  "draft_reply": "Your recommended friendly draft reply for the customer.",
  "guardrail_notes": "Note if any safety rule was triggered or if any information was missing."
}`;

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
    whatsapp_message_template: 'Halo {{customer_name}}!\n\nBooking Anda untuk {{service}} pada {{date}} pukul {{time}} telah dikonfirmasi.\n\nTotal: Rp {{total_price}}\nID Booking: {{booking_id}}\n\nTerima kasih telah memilih Cerita Kita!',
    initial_cash_balance: 0,
    ai_brain: {
      ai_cs_enabled: process.env.AI_CS_ENABLED === 'true',
      ai_cs_provider: process.env.AI_CS_PROVIDER || 'openai',
      ai_cs_model: process.env.AI_CS_MODEL || 'gpt-4o-mini',
      ai_cs_base_url: process.env.AI_CS_BASE_URL || '',
      ai_cs_temperature: parseFloat(process.env.AI_CS_TEMPERATURE || '0.2'),
      ai_cs_max_context_messages: parseInt(process.env.AI_CS_MAX_CONTEXT_MESSAGES || '30', 10),
      ai_cs_confidence_auto_send_threshold: parseFloat(process.env.AI_CS_CONFIDENCE_AUTO_SEND_THRESHOLD || '0.85'),
      ai_cs_allowed_auto_intents: process.env.AI_CS_ALLOWED_AUTO_INTENTS || 'schedule_check,booking_request,testimonial,unknown',
      ai_cs_insight_enabled: process.env.AI_CS_INSIGHT_ENABLED === 'true',
      ai_cs_draft_enabled: process.env.AI_CS_DRAFT_ENABLED === 'true',
      ai_cs_auto_send_enabled: process.env.AI_CS_AUTO_SEND_ENABLED === 'true',
      ai_cs_system_prompt: DEFAULT_AI_SYSTEM_PROMPT
    }
  };

  // Override with database values
  const jsonKeys = ['invoice', 'seo', 'ai_brain'];
  const numericKeys = ['deposit_amount', 'tax_rate', 'initial_cash_balance', 'ai_cs_temperature', 'ai_cs_max_context_messages', 'ai_cs_confidence_auto_send_threshold'];
  const booleanKeys = ['requires_deposit', 'customer_email_enabled', 'ai_cs_enabled', 'ai_cs_insight_enabled', 'ai_cs_draft_enabled', 'ai_cs_auto_send_enabled'];
  rows.forEach(row => {
    if (jsonKeys.includes(row.key)) {
      try {
        let raw = row.value;
        // Perbaikan P1: handle double-escaped JSON string dari DB
        for (let i = 0; i < 2; i++) {
          if (typeof raw === 'string' && raw.startsWith('"') && raw.endsWith('"')) {
            try { raw = JSON.parse(raw); } catch { break; }
          }
        }
        settings[row.key] = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch (e) {
        settings[row.key] = {};
      }
    } else if (numericKeys.includes(row.key)) {
      settings[row.key] = parseFloat(row.value) || 0;
    } else if (booleanKeys.includes(row.key)) {
      settings[row.key] = row.value === 'true' || row.value === '1';
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
    whatsapp_message_template: 'Halo {{customer_name}}!\n\nBooking Anda untuk {{service}} pada {{date}} pukul {{time}} telah dikonfirmasi.\n\nTotal: Rp {{total_price}}\nID Booking: {{booking_id}}\n\nTerima kasih telah memilih Cerita Kita!',
    initial_cash_balance: '0',
    ai_brain: JSON.stringify({
      ai_cs_enabled: process.env.AI_CS_ENABLED === 'true',
      ai_cs_provider: process.env.AI_CS_PROVIDER || 'openai',
      ai_cs_model: process.env.AI_CS_MODEL || 'gpt-4o-mini',
      ai_cs_base_url: process.env.AI_CS_BASE_URL || '',
      ai_cs_temperature: parseFloat(process.env.AI_CS_TEMPERATURE || '0.2'),
      ai_cs_max_context_messages: parseInt(process.env.AI_CS_MAX_CONTEXT_MESSAGES || '30', 10),
      ai_cs_confidence_auto_send_threshold: parseFloat(process.env.AI_CS_CONFIDENCE_AUTO_SEND_THRESHOLD || '0.85'),
      ai_cs_allowed_auto_intents: process.env.AI_CS_ALLOWED_AUTO_INTENTS || 'schedule_check,booking_request,testimonial,unknown',
      ai_cs_insight_enabled: process.env.AI_CS_INSIGHT_ENABLED === 'true',
      ai_cs_draft_enabled: process.env.AI_CS_DRAFT_ENABLED === 'true',
      ai_cs_auto_send_enabled: process.env.AI_CS_AUTO_SEND_ENABLED === 'true',
      ai_cs_system_prompt: DEFAULT_AI_SYSTEM_PROMPT
    })
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
