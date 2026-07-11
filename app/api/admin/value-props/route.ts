import { NextResponse } from 'next/server';
import { getAllValueProps, createValueProp } from '@/lib/repositories/cms';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const valueProps = getAllValueProps();
        return NextResponse.json(valueProps);
    } catch (error) {
        console.error('Error fetching value props:', error);
        return NextResponse.json({ error: 'Failed to fetch value props' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, description, icon, is_active } = body;

        createValueProp({ title, description, icon, is_active });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error creating value prop:', error);
        return NextResponse.json({ error: 'Failed to create value prop' }, { status: 500 });
    }
}
