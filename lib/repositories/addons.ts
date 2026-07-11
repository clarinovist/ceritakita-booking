/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only';
import { getDb } from '@/lib/db';

export interface Addon {
  id: string;
  name: string;
  price: number;
  applicable_categories?: string[];
  is_active: boolean;
  created_at: string;
}

export interface BookingAddon {
  addon_id: string;
  addon_name: string;
  quantity: number;
  price_at_booking: number;
}

const categoriesCache = new Map<string, string[]>();

function parseCategories(json: string): string[] | undefined {
  if (!json) return undefined;

  if (categoriesCache.has(json)) {
    const cached = categoriesCache.get(json);
    if (Array.isArray(cached)) return [...cached];
    return cached;
  }

  try {
    const parsed = JSON.parse(json);
    if (categoriesCache.size > 1000) {
      categoriesCache.clear();
    }
    categoriesCache.set(json, parsed);
    if (Array.isArray(parsed)) return [...parsed];
    return parsed;
  } catch (e) {
    return undefined;
  }
}

function mapRowToAddon(row: any): Addon {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    applicable_categories: row.applicable_categories ? parseCategories(row.applicable_categories) : undefined,
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
  };
}

export function getAllAddons(): Addon[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM addons ORDER BY created_at DESC');
  const rows = stmt.all() as any[];

  return rows.map(mapRowToAddon);
}

export function getAddonById(id: string): Addon | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM addons WHERE id = ?');
  const row = stmt.get(id) as any;

  if (!row) return null;

  return mapRowToAddon(row);
}

export function getActiveAddons(category?: string): Addon[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM addons WHERE is_active = 1 ORDER BY name ASC');
  const rows = stmt.all() as any[];

  const addons = rows.map(mapRowToAddon);

  if (category) {
    return addons.filter(addon =>
      !addon.applicable_categories ||
      addon.applicable_categories.length === 0 ||
      addon.applicable_categories.includes(category)
    );
  }

  return addons;
}

export function createAddon(data: Omit<Addon, 'id' | 'created_at'>): Addon {
  const db = getDb();
  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO addons (id, name, price, applicable_categories, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.name,
    data.price,
    data.applicable_categories ? JSON.stringify(data.applicable_categories) : null,
    data.is_active ? 1 : 0,
    created_at
  );

  return {
    id,
    name: data.name,
    price: data.price,
    applicable_categories: data.applicable_categories,
    is_active: data.is_active,
    created_at,
  };
}

export function updateAddon(id: string, data: Partial<Omit<Addon, 'id' | 'created_at'>>): boolean {
  const db = getDb();

  const stmt = db.prepare(`
    UPDATE addons
    SET name = COALESCE(?, name),
        price = COALESCE(?, price),
        applicable_categories = COALESCE(?, applicable_categories),
        is_active = COALESCE(?, is_active)
    WHERE id = ?
  `);

  const result = stmt.run(
    data.name !== undefined ? data.name : null,
    data.price !== undefined ? data.price : null,
    data.applicable_categories !== undefined ? JSON.stringify(data.applicable_categories) : null,
    data.is_active !== undefined ? (data.is_active ? 1 : 0) : null,
    id
  );

  return result.changes > 0;
}

export function deleteAddon(id: string): boolean {
  const db = getDb();

  db.prepare('DELETE FROM booking_addons WHERE addon_id = ?').run(id);

  const stmt = db.prepare('DELETE FROM addons WHERE id = ?');
  const result = stmt.run(id);

  return result.changes > 0;
}

export function getBookingAddons(bookingId: string): BookingAddon[] {
  const db = getDb();

  const stmt = db.prepare(`
    SELECT ba.addon_id, a.name as addon_name, ba.quantity, ba.price_at_booking
    FROM booking_addons ba
    JOIN addons a ON ba.addon_id = a.id
    WHERE ba.booking_id = ?
    ORDER BY a.name ASC
  `);

  const rows = stmt.all(bookingId) as any[];

  return rows.map(row => ({
    addon_id: row.addon_id,
    addon_name: row.addon_name,
    quantity: row.quantity,
    price_at_booking: row.price_at_booking,
  }));
}

export function getBookingAddonsForBookings(bookingIds: string[]): Map<string, BookingAddon[]> {
  if (bookingIds.length === 0) return new Map();

  const db = getDb();
  const resultMap = new Map<string, BookingAddon[]>();

  bookingIds.forEach(id => resultMap.set(id, []));

  const chunkSize = 900;
  for (let i = 0; i < bookingIds.length; i += chunkSize) {
    const chunk = bookingIds.slice(i, i + chunkSize);
    const placeholders = chunk.map(() => '?').join(',');

    const stmt = db.prepare(`
      SELECT ba.booking_id, ba.addon_id, a.name as addon_name, ba.quantity, ba.price_at_booking
      FROM booking_addons ba
      JOIN addons a ON ba.addon_id = a.id
      WHERE ba.booking_id IN (${placeholders})
      ORDER BY a.name ASC
    `);

    const rows = stmt.all(...chunk) as any[];

    for (const row of rows) {
      const bookingId = String(row.booking_id);
      const current = resultMap.get(bookingId) || [];
      current.push({
        addon_id: row.addon_id,
        addon_name: row.addon_name,
        quantity: row.quantity,
        price_at_booking: row.price_at_booking,
      });
      resultMap.set(bookingId, current);
    }
  }

  return resultMap;
}

export function setBookingAddons(bookingId: string, addons: { addon_id: string; quantity: number; price: number }[]): void {
  const db = getDb();

  const dedupedMap = new Map<string, { addon_id: string; quantity: number; price: number }>();
  for (const addon of addons) {
    dedupedMap.set(addon.addon_id, addon);
  }
  const deduped = Array.from(dedupedMap.values());

  db.prepare('DELETE FROM booking_addons WHERE booking_id = ?').run(bookingId);

  if (deduped.length > 0) {
    const insertStmt = db.prepare(`
      INSERT INTO booking_addons (booking_id, addon_id, quantity, price_at_booking)
      VALUES (?, ?, ?, ?)
    `);

    for (const addon of deduped) {
      insertStmt.run(bookingId, addon.addon_id, addon.quantity, addon.price);
    }
  }
}

export function calculateAddonsTotal(addons: { quantity: number; price: number }[]): number {
  return addons.reduce((total, addon) => total + (addon.quantity * addon.price), 0);
}
