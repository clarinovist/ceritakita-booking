import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const body = await request.json();
        const { name, slug, description, thumbnail_url, is_active, display_order } = body;
        const db = getDb();

        // Dynmaic update query
        const updates = [];
        const values = [];

        if (name !== undefined) { updates.push('name = ?'); values.push(name); }
        if (slug !== undefined) { updates.push('slug = ?'); values.push(slug); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }
        if (thumbnail_url !== undefined) { updates.push('thumbnail_url = ?'); values.push(thumbnail_url); }
        if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active ? 1 : 0); }
        if (display_order !== undefined) { updates.push('display_order = ?'); values.push(display_order); }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        const query = `UPDATE service_categories SET ${updates.join(', ')} WHERE id = ?`;
        db.prepare(query).run(...values);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating service category:', error);
        return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
    }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const db = getDb();
        db.prepare('DELETE FROM service_categories WHERE id = ?').run(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting service category:', error);
        return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }
}
