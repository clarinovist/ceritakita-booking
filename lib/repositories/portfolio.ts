import 'server-only';
import { getDb } from '@/lib/db';

export interface PortfolioImage {
  id: string;
  service_id: string;
  image_url: string;
  display_order: number;
  is_active: number;
  created_at: string;
}

export function getPortfolioImages(serviceId: string): PortfolioImage[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM portfolio_images
    WHERE service_id = ?
    ORDER BY display_order ASC
  `).all(serviceId) as PortfolioImage[];
}

export function addPortfolioImage(data: {
  id: string;
  service_id: string;
  image_url: string;
  display_order?: number;
}): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO portfolio_images (id, service_id, image_url, display_order, is_active)
    VALUES (?, ?, ?, ?, 1)
  `).run(data.id, data.service_id, data.image_url, data.display_order || 0);
}

export function addPortfolioImageWithAutoOrder(id: string, serviceId: string, imageUrl: string): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO portfolio_images (id, service_id, image_url, display_order, is_active)
    VALUES (?, ?, ?, COALESCE((SELECT MAX(display_order) + 1 FROM portfolio_images WHERE service_id = ?), 0), 1)
  `).run(id, serviceId, imageUrl, serviceId);
}

export function getPortfolioImage(id: string): PortfolioImage | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM portfolio_images WHERE id = ?').get(id) as PortfolioImage | undefined;
}

export function deletePortfolioImage(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM portfolio_images WHERE id = ?').run(id);
}

export function updatePortfolioImageActiveStatus(id: string, isActive: boolean): void {
  const db = getDb();
  db.prepare(`
    UPDATE portfolio_images 
    SET is_active = ? 
    WHERE id = ?
  `).run(isActive ? 1 : 0, id);
}
