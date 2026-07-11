import 'server-only';
import { getDb } from '@/lib/db';

export interface PaymentMethod {
  id: string;
  name: string;
  provider_name: string;
  account_name: string;
  account_number: string;
  qris_image_url: string | null;
  is_active: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export function getActivePaymentMethod(): PaymentMethod | null {
  const db = getDb();
  return db.prepare('SELECT * FROM payment_methods WHERE is_active = 1 ORDER BY display_order ASC LIMIT 1').get() as PaymentMethod | null;
}

export function getFirstActivePaymentMethodId(): string | null {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM payment_methods WHERE is_active = 1 LIMIT 1').get() as { id: string } | null;
  return existing ? existing.id : null;
}

export function updatePaymentMethod(id: string, data: {
  name: string;
  account_name: string;
  account_number: string;
  qris_image_url: string | null;
}): void {
  const db = getDb();
  db.prepare(`
    UPDATE payment_methods
    SET name = ?, account_name = ?, account_number = ?,
        qris_image_url = COALESCE(?, qris_image_url), updated_at = ?
    WHERE id = ?
  `).run(data.name, data.account_name, data.account_number, data.qris_image_url, new Date().toISOString(), id);
}

export function insertPaymentMethod(data: {
  id: string;
  name: string;
  provider_name: string;
  account_name: string;
  account_number: string;
  qris_image_url: string | null;
  display_order: number;
}): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO payment_methods (id, name, provider_name, account_name, account_number, qris_image_url, display_order, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(data.id, data.name, data.provider_name, data.account_name, data.account_number, data.qris_image_url, data.display_order, new Date().toISOString());
}
