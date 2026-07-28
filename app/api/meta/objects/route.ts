import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getExplorerObjects } from '@/lib/repositories/meta-ads';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth) return auth;

  try {
    const sp = req.nextUrl.searchParams;
    const type = (sp.get('type') || 'campaign') as 'account' | 'campaign' | 'adset' | 'ad' | 'creative';
    const search = sp.get('search') || undefined;
    const status = sp.get('status') || undefined;
    const campaignId = sp.get('campaign_id') || undefined;
    const adsetId = sp.get('adset_id') || undefined;
    const limit = sp.get('limit') ? parseInt(sp.get('limit')!) : 50;
    const offset = sp.get('offset') ? parseInt(sp.get('offset')!) : 0;

    const res = getExplorerObjects(type, { search, status, campaignId, adsetId, limit, offset });
    return NextResponse.json({ success: true, ...res });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
