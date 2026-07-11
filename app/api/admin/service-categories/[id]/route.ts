import { NextResponse } from 'next/server';
import { updateServiceCategory, deleteServiceCategory } from '@/lib/repositories/cms';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const body = await request.json();
        const { name, slug, description, thumbnail_url, is_active, display_order } = body;

        updateServiceCategory(id, { name, slug, description, thumbnail_url, is_active, display_order });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating service category:', error);
        return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
    }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        deleteServiceCategory(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting service category:', error);
        return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }
}
