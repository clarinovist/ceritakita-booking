/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Add-on management operations
 */

import getDb from './db';

export interface Addon {
  id: string;
  name: string;
  price: number;
  applicable_categories?: string[]; // Array of service categories this addon applies to
  is_active: boolean;
  created_at: string;
}

export interface BookingAddon {
  addon_id: string;
  addon_name: string;
  quantity: number;
  price_at_booking: number;
}

/**
 * Get all add-ons
 */
export function getAllAddons(): Addon[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM addons ORDER BY created_at DESC');
  const rows = stmt.all() as any[];

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    price: row.price,
    applicable_categories: row.applicable_categories ? JSON.parse(row.applicable_categories) : undefined,
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
  }));
}

/**
 * Get active add-ons, optionally filtered by category
 */
export function getActiveAddons(category?: string): Addon[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM addons WHERE is_active = 1 ORDER BY name ASC');
  const rows = stmt.all() as any[];

  const addons = rows.map(row => ({
    id: row.id,
    name: row.name,
    price: row.price,
    applicable_categories: row.applicable_categories ? JSON.parse(row.applicable_categories) : undefined,
    is_active: true,
    created_at: row.created_at,
  }));

  // Filter by category if provided
  if (category) {
    return addons.filter(addon =>
      !addon.applicable_categories ||
      addon.applicable_categories.length === 0 ||
      addon.applicable_categories.includes(category)
    );
  }

  return addons;
}

/**
 * Create a new add-on
 */
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

/**
 * Update an existing add-on
 */
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

/**
 * Delete an add-on
 */
export function deleteAddon(id: string): boolean {
  const db = getDb();

  // Delete associated booking addons first (cascade will handle this, but being explicit)
  db.prepare('DELETE FROM booking_addons WHERE addon_id = ?').run(id);

  const stmt = db.prepare('DELETE FROM addons WHERE id = ?');
  const result = stmt.run(id);

  return result.changes > 0;
}

/**
 * Get add-ons for a specific booking
 */
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

/**
 * Set add-ons for a booking (replaces existing add-ons)
 */
export function setBookingAddons(bookingId: string, addons: { addon_id: string; quantity: number; price: number }[]): void {
  const db = getDb();

  const transaction = db.transaction(() => {
    // Remove existing add-ons for this booking
    db.prepare('DELETE FROM booking_addons WHERE booking_id = ?').run(bookingId);

    // Insert new add-ons
    if (addons.length > 0) {
      const insertStmt = db.prepare(`
        INSERT INTO booking_addons (booking_id, addon_id, quantity, price_at_booking)
        VALUES (?, ?, ?, ?)
      `);

      for (const addon of addons) {
        insertStmt.run(bookingId, addon.addon_id, addon.quantity, addon.price);
      }
    }
  });

  transaction();
}

/**
 * Calculate total price for add-ons
 */
export function calculateAddonsTotal(addons: { quantity: number; price: number }[]): number {
  return addons.reduce((total, addon) => total + (addon.quantity * addon.price), 0);
}
