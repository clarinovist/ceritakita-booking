import { NextResponse } from 'next/server';
import { getAllTestimonials, createTestimonial } from '@/lib/repositories/cms';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const testimonials = getAllTestimonials();
        return NextResponse.json(testimonials);
    } catch (error) {
        console.error('Error fetching testimonials:', error);
        return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { quote, author_name, author_title, is_active } = body;

        createTestimonial({ quote, author_name, author_title, is_active });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error creating testimonial:', error);
        return NextResponse.json({ error: 'Failed to create testimonial' }, { status: 500 });
    }
}
