import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const body = await request.json();
        const { quote, author_name, author_title, is_active, display_order } = body;
        const db = getDb();

        const updates = [];
        const values = [];

        if (quote !== undefined) { updates.push('quote = ?'); values.push(quote); }
        if (author_name !== undefined) { updates.push('author_name = ?'); values.push(author_name); }
        if (author_title !== undefined) { updates.push('author_title = ?'); values.push(author_title); }
        if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active ? 1 : 0); }
        if (display_order !== undefined) { updates.push('display_order = ?'); values.push(display_order); }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        const query = `UPDATE testimonials SET ${updates.join(', ')} WHERE id = ?`;
        db.prepare(query).run(...values);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating testimonial:', error);
        return NextResponse.json({ error: 'Failed to update testimonial' }, { status: 500 });
    }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const db = getDb();
        db.prepare('DELETE FROM testimonials WHERE id = ?').run(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting testimonial:', error);
        return NextResponse.json({ error: 'Failed to delete testimonial' }, { status: 500 });
    }
}
