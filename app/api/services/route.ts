import { NextRequest, NextResponse } from 'next/server';
import { readServices, writeServices } from '@/lib/storage';

export async function GET() {
    const data = readServices();
    return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        if (!Array.isArray(body)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }
        writeServices(body);
        return NextResponse.json(body);
    } catch {
        return NextResponse.json({ error: 'Failed to update services' }, { status: 500 });
    }
}
