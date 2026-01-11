import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const db = getDb();
        const categories = db.prepare('SELECT * FROM service_categories ORDER BY display_order ASC').all();
        return NextResponse.json(categories);
    } catch (error) {
        console.error('Error fetching service categories:', error);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, slug, description, thumbnail_url, is_active } = body;
        const db = getDb();

        // Get max display_order
        const maxOrder = db.prepare('SELECT MAX(display_order) as max FROM service_categories').get() as { max: number };
        const nextOrder = (maxOrder.max || 0) + 1;

        const stmt = db.prepare(`
      INSERT INTO service_categories (id, name, slug, description, thumbnail_url, display_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(randomUUID(), name, slug, description, thumbnail_url, nextOrder, is_active ? 1 : 0);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error creating service category:', error);
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }
}
