import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const body = await request.json();
        const { title, description, icon, is_active, display_order } = body;
        const db = getDb();

        const updates = [];
        const values = [];

        if (title !== undefined) { updates.push('title = ?'); values.push(title); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }
        if (icon !== undefined) { updates.push('icon = ?'); values.push(icon); }
        if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active ? 1 : 0); }
        if (display_order !== undefined) { updates.push('display_order = ?'); values.push(display_order); }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        const query = `UPDATE value_propositions SET ${updates.join(', ')} WHERE id = ?`;
        db.prepare(query).run(...values);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating value prop:', error);
        return NextResponse.json({ error: 'Failed to update value prop' }, { status: 500 });
    }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const db = getDb();
        db.prepare('DELETE FROM value_propositions WHERE id = ?').run(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting value prop:', error);
        return NextResponse.json({ error: 'Failed to delete value prop' }, { status: 500 });
    }
}
