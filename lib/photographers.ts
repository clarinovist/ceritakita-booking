/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Photographer management operations
 */

import getDb from './db';

export interface Photographer {
  id: string;
  name: string;
  phone?: string;
  specialty?: string;
  is_active: boolean;
  created_at: string;
}

/**
 * Get all photographers
 */
export function getAllPhotographers(): Photographer[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM photographers ORDER BY created_at DESC');
  const rows = stmt.all() as any[];

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    phone: row.phone || undefined,
    specialty: row.specialty || undefined,
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
  }));
}

/**
 * Get active photographers only
 */
export function getActivePhotographers(): Photographer[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM photographers WHERE is_active = 1 ORDER BY name ASC');
  const rows = stmt.all() as any[];

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    phone: row.phone || undefined,
    specialty: row.specialty || undefined,
    is_active: true,
    created_at: row.created_at,
  }));
}

/**
 * Get a single photographer by ID
 */
export function getPhotographer(id: string): Photographer | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM photographers WHERE id = ?');
  const row = stmt.get(id) as any;

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    phone: row.phone || undefined,
    specialty: row.specialty || undefined,
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
  };
}

/**
 * Create a new photographer
 */
export function createPhotographer(data: Omit<Photographer, 'id' | 'created_at'>): Photographer {
  const db = getDb();
  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO photographers (id, name, phone, specialty, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.name,
    data.phone || null,
    data.specialty || null,
    data.is_active ? 1 : 0,
    created_at
  );

  return {
    id,
    name: data.name,
    phone: data.phone,
    specialty: data.specialty,
    is_active: data.is_active,
    created_at,
  };
}

/**
 * Update an existing photographer
 */
export function updatePhotographer(id: string, data: Partial<Omit<Photographer, 'id' | 'created_at'>>): boolean {
  const db = getDb();

  const stmt = db.prepare(`
    UPDATE photographers
    SET name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        specialty = COALESCE(?, specialty),
        is_active = COALESCE(?, is_active)
    WHERE id = ?
  `);

  const result = stmt.run(
    data.name !== undefined ? data.name : null,
    data.phone !== undefined ? data.phone : null,
    data.specialty !== undefined ? data.specialty : null,
    data.is_active !== undefined ? (data.is_active ? 1 : 0) : null,
    id
  );

  return result.changes > 0;
}

/**
 * Delete a photographer
 * Note: This will set photographer_id to NULL in bookings due to foreign key constraints
 */
export function deletePhotographer(id: string): boolean {
  const db = getDb();

  // First, remove photographer assignment from all bookings
  db.prepare('UPDATE bookings SET photographer_id = NULL WHERE photographer_id = ?').run(id);

  // Then delete the photographer
  const stmt = db.prepare('DELETE FROM photographers WHERE id = ?');
  const result = stmt.run(id);

  return result.changes > 0;
}

/**
 * Get photographer with their booking statistics
 */
export function getPhotographerStats(id: string) {
  const db = getDb();

  const photographer = getPhotographer(id);
  if (!photographer) return null;

  // Get booking stats
  const statsStmt = db.prepare(`
    SELECT
      COUNT(*) as total_bookings,
      SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_bookings,
      SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_bookings,
      SUM(total_price) as total_revenue
    FROM bookings
    WHERE photographer_id = ?
  `);

  const stats = statsStmt.get(id) as any;

  return {
    photographer,
    stats: {
      totalBookings: stats.total_bookings || 0,
      activeBookings: stats.active_bookings || 0,
      completedBookings: stats.completed_bookings || 0,
      totalRevenue: stats.total_revenue || 0,
    }
  };
}
