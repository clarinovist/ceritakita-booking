import { NextResponse } from 'next/server';
import { getAllServiceCategories, createServiceCategory } from '@/lib/repositories/cms';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const categories = getAllServiceCategories();
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

        createServiceCategory({ name, slug, description, thumbnail_url, is_active });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error creating service category:', error);
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }
}
