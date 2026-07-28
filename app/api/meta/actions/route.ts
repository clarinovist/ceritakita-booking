import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getExplorerActions } from '@/lib/repositories/meta-ads';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth) return auth;

  try {
    const sp = req.nextUrl.searchParams;
    const start = sp.get('start') || sp.get('since') || undefined;
    const end = sp.get('end') || sp.get('until') || undefined;
    const actionType = sp.get('action_type') || undefined;
    const limit = sp.get('limit') ? parseInt(sp.get('limit')!) : 50;
    const offset = sp.get('offset') ? parseInt(sp.get('offset')!) : 0;

    const res = getExplorerActions({ startDate: start, endDate: end, actionType, limit, offset });
    return NextResponse.json({ success: true, ...res });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
