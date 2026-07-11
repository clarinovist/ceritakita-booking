import { NextResponse } from 'next/server';
import { HomepageContent } from '@/types/homepage';
import { getAllHomepageContent, updateHomepageContentBatch } from '@/lib/repositories/homepage';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const content = getAllHomepageContent();
        return NextResponse.json(content);
    } catch (error) {
        console.error('Error fetching admin homepage content:', error);
        return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const updates: HomepageContent[] = body;

        updateHomepageContentBatch(updates);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating homepage content:', error);
        return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
    }
}
