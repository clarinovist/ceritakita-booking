import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getExplorerInsights } from '@/lib/repositories/meta-ads';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth) return auth;

  try {
    const sp = request.nextUrl.searchParams;
    const campaignId = sp.get('campaign_id') || sp.get('campaignId') || undefined;
    const adsetId = sp.get('adset_id') || sp.get('adsetId') || undefined;
    const adId = sp.get('ad_id') || sp.get('adId') || undefined;
    const start = sp.get('start') || sp.get('since') || undefined;
    const end = sp.get('end') || sp.get('until') || undefined;
    const limit = sp.get('limit') ? parseInt(sp.get('limit')!) : 50;
    const offset = sp.get('offset') ? parseInt(sp.get('offset')!) : 0;
    const level = sp.get('level') || undefined;
    const breakdownType = sp.get('breakdown_type') !== null ? sp.get('breakdown_type')! : undefined;
    const search = sp.get('search') || undefined;

    const res = getExplorerInsights({
      level,
      campaignId,
      adsetId,
      adId,
      startDate: start,
      endDate: end,
      breakdownType,
      search,
      limit,
      offset,
    });

    return NextResponse.json({ success: true, ...res });
  } catch (e) {
    logger.error('insights-db error', {}, e as Error);
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}
