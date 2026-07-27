import { NextRequest, NextResponse } from 'next/server';
import { getInsightsRange } from '@/lib/repositories/meta-ads';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const campaignId = sp.get('campaign_id') || sp.get('campaignId') || undefined;
    const adsetId = sp.get('adset_id') || sp.get('adsetId') || undefined;
    const adId = sp.get('ad_id') || sp.get('adId') || undefined;
    const start = sp.get('start') || sp.get('since') || undefined;
    const end = sp.get('end') || sp.get('until') || undefined;
    const limit = sp.get('limit') ? parseInt(sp.get('limit')!) : undefined;
    const level = sp.get('level') || undefined; // not used for query but for UI

    const data = getInsightsRange({
      campaignId,
      adsetId,
      adId,
      startDate: start,
      endDate: end,
      limit,
    });

    return NextResponse.json({ success: true, data, level });
  } catch (e) {
    logger.error('insights-db error', {}, e as Error);
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}
