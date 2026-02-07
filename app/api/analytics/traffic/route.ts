import { NextRequest, NextResponse } from 'next/server';
import { getTrafficStats, getTopPages } from '@/lib/repositories/analytics';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('start') || undefined;
        const endDate = searchParams.get('end') || undefined;

        const stats = getTrafficStats(startDate, endDate);
        const topPages = getTopPages(startDate, endDate);

        return NextResponse.json({
            traffic: stats,
            topPages: topPages
        });
    } catch (error) {
        console.error('Traffic API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
