import { NextRequest, NextResponse } from 'next/server';
import { getAdsWithStats } from '@/lib/repositories/meta-ads';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const campaignId = sp.get('campaign_id') || sp.get('campaignId') || undefined;
    const adsetId = sp.get('adset_id') || sp.get('adsetId') || undefined;
    const start = sp.get('start') || sp.get('since') || undefined;
    const end = sp.get('end') || sp.get('until') || undefined;

    const data = getAdsWithStats({ campaignId, adsetId, startDate: start, endDate: end });

    return NextResponse.json({ success: true, data });
  } catch (e) {
    logger.error('ads list error', {}, e as Error);
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}
