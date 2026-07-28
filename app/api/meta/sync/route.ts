import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { syncAll } from '@/lib/services/meta-ads-service';
import { getSyncRuns, getLatestSyncLogs } from '@/lib/repositories/meta-ads';
import { logger, createErrorResponse } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/meta/sync?days=30&full=1&scope=account,objects,creatives
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth) return auth;

  try {
    const search = request.nextUrl.searchParams;
    const body = await request.json().catch(() => ({}));

    const daysParam = search.get('days') || body.days;
    const full = search.get('full') === '1' || search.get('full') === 'true' || body.full === true;
    const scopeParam = search.get('scope') || body.scope;
    const requestedScopes = scopeParam ? (Array.isArray(scopeParam) ? scopeParam : scopeParam.split(',')) : undefined;

    let days = daysParam ? Math.min(parseInt(String(daysParam)), 90) : 7;
    if (isNaN(days) || days < 1) days = 7;

    logger.info('Meta sync API triggered', { days, full, requestedScopes });

    const result = await syncAll(days, full, requestedScopes);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const { error: errResp } = createErrorResponse(error as Error);
    logger.error('Meta sync API failed', {}, error as Error);
    return NextResponse.json({ success: false, error: errResp.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth) return auth;

  try {
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
    const runs = getSyncRuns(limit);
    const logs = getLatestSyncLogs(limit);
    return NextResponse.json({ success: true, data: runs, logs });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}
