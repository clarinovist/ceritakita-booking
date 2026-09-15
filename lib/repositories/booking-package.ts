import 'server-only';
import { getDb } from '@/lib/db';
import { setBookingAddons } from '@/lib/repositories/addons';
import type { PackageSnapshot, PackageChangeHistory } from '@/lib/types';

export function getPackageHistory(bookingId: string): PackageChangeHistory[] {
  const rows = getDb().prepare(`SELECT id, changed_at, actor, reason, before_json, after_json
    FROM booking_package_history WHERE booking_id = ? ORDER BY id DESC`).all(bookingId) as Array<{
      id: number; changed_at: string; actor: string; reason: string; before_json: string; after_json: string;
    }>;
  return rows.map(({ before_json, after_json, ...row }) => ({
    ...row, before: JSON.parse(before_json), after: JSON.parse(after_json),
  }));
}

/** Called inside the service transaction. Deliberately never touches payment rows. */
export function savePackageChange(bookingId: string, before: PackageSnapshot, after: PackageSnapshot, actor: string, reason: string): void {
  const db = getDb();
  db.prepare(`UPDATE bookings SET customer_service_id = ?, customer_category = ?,
    total_price = ?, service_base_price = ?, base_discount = ?, addons_total = ?,
    coupon_discount = ?, coupon_code = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(
    after.serviceId, after.serviceName, after.finance.total_price, after.finance.service_base_price,
    after.finance.base_discount, after.finance.addons_total, after.finance.coupon_discount,
    after.finance.coupon_code || null, bookingId,
  );
  setBookingAddons(bookingId, after.addons.map(a => ({ addon_id: a.addon_id, quantity: a.quantity, price: a.price_at_booking })));
  db.prepare(`INSERT INTO booking_package_history (booking_id, changed_at, actor, reason, before_json, after_json)
    VALUES (?, ?, ?, ?, ?, ?)`).run(bookingId, new Date().toISOString(), actor, reason, JSON.stringify(before), JSON.stringify(after));
}
