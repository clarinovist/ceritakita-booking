import { NextResponse } from 'next/server';
import { backfillAttribution } from '@/lib/services/attribution-service';
import { getAttributionFunnel } from '@/lib/repositories/meta-ads';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/meta/backfill-attribution
 * Link existing bookings→leads via phone, leads→campaigns via utm_campaign, wa_clicks→campaigns
 * Idempotent
 */
export async function POST() {
  try {
    const result = backfillAttribution();

    const funnel = getAttributionFunnel();

    return NextResponse.json({
      success: true,
      result,
      funnelAfter: funnel,
    });
  } catch (e) {
    logger.error('backfill-attribution failed', {}, e as Error);
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const funnel = getAttributionFunnel();
    return NextResponse.json({ success: true, data: funnel });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}
