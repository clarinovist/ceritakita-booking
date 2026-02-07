import { NextRequest, NextResponse } from 'next/server';
import { recordPageView } from '@/lib/repositories/analytics';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { path, visitor_id, user_agent, device_type, referer } = body;

        // Basic validation
        if (!path || !visitor_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Record page view asynchronously to not block the response
        recordPageView({
            path,
            visitor_id,
            user_agent: user_agent || req.headers.get('user-agent'),
            device_type,
            referer: referer || null
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Track API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
