import 'server-only';
import { getDb } from '@/lib/db';
import { HomepageContent, ServiceCategory, Testimonial, ValueProposition, PortfolioImage } from '@/types/homepage';
import { randomUUID } from 'crypto';

export function getAllHomepageContent(): HomepageContent[] {
  const db = getDb();
  return db.prepare('SELECT * FROM homepage_content').all() as HomepageContent[];
}

export function updateHomepageContentBatch(updates: HomepageContent[]): void {
  const db = getDb();
  const updateStmt = db.prepare(`
    INSERT OR REPLACE INTO homepage_content (id, section, content_key, content_value, updated_at)
    VALUES (COALESCE((SELECT id FROM homepage_content WHERE section = ? AND content_key = ?), ?), ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  const transaction = db.transaction(() => {
    updates.forEach(item => {
      updateStmt.run(item.section, item.content_key, randomUUID(), item.section, item.content_key, item.content_value);
    });
  });

  transaction();
}

export function getActiveServiceCategories(): ServiceCategory[] {
  const db = getDb();
  return db.prepare('SELECT * FROM service_categories WHERE is_active = 1 ORDER BY display_order ASC').all() as ServiceCategory[];
}

export function getActiveTestimonials(): Testimonial[] {
  const db = getDb();
  return db.prepare('SELECT * FROM testimonials WHERE is_active = 1 ORDER BY display_order ASC').all() as Testimonial[];
}

export function getActiveValuePropositions(): ValueProposition[] {
  const db = getDb();
  return db.prepare('SELECT * FROM value_propositions WHERE is_active = 1 ORDER BY display_order ASC').all() as ValueProposition[];
}

export function getActivePortfolioImagesWithService(): (PortfolioImage & { service_name: string })[] {
  const db = getDb();
  return db.prepare(`
    SELECT p.id, p.image_url, p.service_id, s.name as service_name, p.display_order
    FROM portfolio_images p
    JOIN service_categories s ON p.service_id = s.id
    WHERE p.is_active = 1 AND s.is_active = 1
    ORDER BY p.display_order ASC
  `).all() as (PortfolioImage & { service_name: string })[];
}
