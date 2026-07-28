import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getRawPayload } from '@/lib/repositories/meta-ads';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth) return auth;

  try {
    const sp = req.nextUrl.searchParams;
    const type = (sp.get('type') || 'campaign') as 'account' | 'campaign' | 'adset' | 'ad' | 'creative' | 'insight';
    const id = sp.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'id param required' }, { status: 400 });
    }

    const res = getRawPayload(type, id);
    if (!res) {
      return NextResponse.json({ success: false, error: 'Payload not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: res });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
