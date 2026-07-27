import { NextRequest, NextResponse } from 'next/server';
import { getAdSetsWithStats } from '@/lib/repositories/meta-ads';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const campaignId = sp.get('campaign_id') || sp.get('campaignId') || undefined;
    const start = sp.get('start') || sp.get('since') || undefined;
    const end = sp.get('end') || sp.get('until') || undefined;

    const data = getAdSetsWithStats(campaignId, start, end);

    return NextResponse.json({ success: true, data });
  } catch (e) {
    logger.error('adsets list error', {}, e as Error);
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}
