import { NextRequest, NextResponse } from 'next/server';
import { getCampaignsWithStats } from '@/lib/repositories/meta-ads';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const start = sp.get('start') || sp.get('since') || undefined;
    const end = sp.get('end') || sp.get('until') || undefined;

    const data = getCampaignsWithStats(start, end);

    // compute derived ROAS/CPL
    const enriched = data.map((c: any) => {
      const spend = c.total_spend || 0;
      const leads = c.leads_count || 0;
      const bookings = c.bookings_count || 0;
      const revenue = c.revenue || 0;
      return {
        ...c,
        cpl: leads > 0 ? spend / leads : 0,
        cpb: bookings > 0 ? spend / bookings : 0,
        roas: spend > 0 ? revenue / spend : 0,
        roi: spend > 0 ? ((revenue - spend) / spend) * 100 : 0,
      };
    });

    return NextResponse.json({ success: true, data: enriched });
  } catch (e) {
    logger.error('campaigns list error', {}, e as Error);
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}
