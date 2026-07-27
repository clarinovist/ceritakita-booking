import { NextRequest, NextResponse } from 'next/server';
import { getAttributionFunnel } from '@/lib/repositories/meta-ads';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const start = sp.get('start') || sp.get('since') || undefined;
    const end = sp.get('end') || sp.get('until') || undefined;

    const data = getAttributionFunnel(start, end);

    return NextResponse.json({ success: true, data });
  } catch (e) {
    logger.error('attribution route error', {}, e as Error);
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}
