import { NextResponse } from 'next/server';
import { updateValueProp, deleteValueProp } from '@/lib/repositories/cms';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const body = await request.json();
        const { title, description, icon, is_active, display_order } = body;

        updateValueProp(id, { title, description, icon, is_active, display_order });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating value prop:', error);
        return NextResponse.json({ error: 'Failed to update value prop' }, { status: 500 });
    }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        deleteValueProp(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting value prop:', error);
        return NextResponse.json({ error: 'Failed to delete value prop' }, { status: 500 });
    }
}
