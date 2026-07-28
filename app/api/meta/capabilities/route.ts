import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { requireMetaConfig } from '@/lib/meta/client';
import { getCapabilities } from '@/lib/repositories/meta-ads';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth) return auth;

  try {
    const cfg = requireMetaConfig();
    const caps = getCapabilities(cfg.adAccountId);
    return NextResponse.json({ success: true, accountId: cfg.adAccountId, apiVersion: cfg.apiVersion, data: caps });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
