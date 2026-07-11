import 'server-only';
import { getDb } from '@/lib/db';
import { randomUUID } from 'crypto';

// --- Testimonials ---
export function getAllTestimonials(): any[] {
  const db = getDb();
  return db.prepare('SELECT * FROM testimonials ORDER BY display_order ASC').all();
}

export function createTestimonial(data: {
  quote: string;
  author_name: string;
  author_title?: string;
  is_active: boolean;
}): void {
  const db = getDb();
  const maxOrder = db.prepare('SELECT MAX(display_order) as max FROM testimonials').get() as { max: number };
  const nextOrder = (maxOrder.max || 0) + 1;

  db.prepare(`
    INSERT INTO testimonials (id, quote, author_name, author_title, display_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(randomUUID(), data.quote, data.author_name, data.author_title || null, nextOrder, data.is_active ? 1 : 0);
}

export function updateTestimonial(id: string, data: {
  quote?: string;
  author_name?: string;
  author_title?: string;
  is_active?: boolean;
  display_order?: number;
}): void {
  const db = getDb();
  const updates: string[] = [];
  const values: any[] = [];

  if (data.quote !== undefined) { updates.push('quote = ?'); values.push(data.quote); }
  if (data.author_name !== undefined) { updates.push('author_name = ?'); values.push(data.author_name); }
  if (data.author_title !== undefined) { updates.push('author_title = ?'); values.push(data.author_title); }
  if (data.is_active !== undefined) { updates.push('is_active = ?'); values.push(data.is_active ? 1 : 0); }
  if (data.display_order !== undefined) { updates.push('display_order = ?'); values.push(data.display_order); }

  if (updates.length === 0) return;

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const query = `UPDATE testimonials SET ${updates.join(', ')} WHERE id = ?`;
  db.prepare(query).run(...values);
}

export function deleteTestimonial(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM testimonials WHERE id = ?').run(id);
}


// --- Value Propositions ---
export function getAllValueProps(): any[] {
  const db = getDb();
  return db.prepare('SELECT * FROM value_propositions ORDER BY display_order ASC').all();
}

export function createValueProp(data: {
  title: string;
  description: string;
  icon: string;
  is_active: boolean;
}): void {
  const db = getDb();
  const maxOrder = db.prepare('SELECT MAX(display_order) as max FROM value_propositions').get() as { max: number };
  const nextOrder = (maxOrder.max || 0) + 1;

  db.prepare(`
    INSERT INTO value_propositions (id, title, description, icon, display_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(randomUUID(), data.title, data.description, data.icon, nextOrder, data.is_active ? 1 : 0);
}

export function updateValueProp(id: string, data: {
  title?: string;
  description?: string;
  icon?: string;
  is_active?: boolean;
  display_order?: number;
}): void {
  const db = getDb();
  const updates: string[] = [];
  const values: any[] = [];

  if (data.title !== undefined) { updates.push('title = ?'); values.push(data.title); }
  if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
  if (data.icon !== undefined) { updates.push('icon = ?'); values.push(data.icon); }
  if (data.is_active !== undefined) { updates.push('is_active = ?'); values.push(data.is_active ? 1 : 0); }
  if (data.display_order !== undefined) { updates.push('display_order = ?'); values.push(data.display_order); }

  if (updates.length === 0) return;

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const query = `UPDATE value_propositions SET ${updates.join(', ')} WHERE id = ?`;
  db.prepare(query).run(...values);
}

export function deleteValueProp(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM value_propositions WHERE id = ?').run(id);
}


// --- Service Categories ---
export function getAllServiceCategories(): any[] {
  const db = getDb();
  return db.prepare('SELECT * FROM service_categories ORDER BY display_order ASC').all();
}

export function createServiceCategory(data: {
  name: string;
  slug: string;
  description?: string;
  thumbnail_url?: string;
  is_active: boolean;
}): void {
  const db = getDb();
  const maxOrder = db.prepare('SELECT MAX(display_order) as max FROM service_categories').get() as { max: number };
  const nextOrder = (maxOrder.max || 0) + 1;

  db.prepare(`
    INSERT INTO service_categories (id, name, slug, description, thumbnail_url, display_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(randomUUID(), data.name, data.slug, data.description || null, data.thumbnail_url || null, nextOrder, data.is_active ? 1 : 0);
}

export function updateServiceCategory(id: string, data: {
  name?: string;
  slug?: string;
  description?: string;
  thumbnail_url?: string;
  is_active?: boolean;
  display_order?: number;
}): void {
  const db = getDb();
  const updates: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
  if (data.slug !== undefined) { updates.push('slug = ?'); values.push(data.slug); }
  if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
  if (data.thumbnail_url !== undefined) { updates.push('thumbnail_url = ?'); values.push(data.thumbnail_url); }
  if (data.is_active !== undefined) { updates.push('is_active = ?'); values.push(data.is_active ? 1 : 0); }
  if (data.display_order !== undefined) { updates.push('display_order = ?'); values.push(data.display_order); }

  if (updates.length === 0) return;

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const query = `UPDATE service_categories SET ${updates.join(', ')} WHERE id = ?`;
  db.prepare(query).run(...values);
}

export function deleteServiceCategory(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM service_categories WHERE id = ?').run(id);
}
