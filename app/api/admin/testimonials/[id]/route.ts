import { NextResponse } from 'next/server';
import { updateTestimonial, deleteTestimonial } from '@/lib/repositories/cms';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const body = await request.json();
        const { quote, author_name, author_title, is_active, display_order } = body;

        updateTestimonial(id, { quote, author_name, author_title, is_active, display_order });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating testimonial:', error);
        return NextResponse.json({ error: 'Failed to update testimonial' }, { status: 500 });
    }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        deleteTestimonial(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting testimonial:', error);
        return NextResponse.json({ error: 'Failed to delete testimonial' }, { status: 500 });
    }
}
