import { NextResponse } from 'next/server';
import { checkTokenHealth } from '@/lib/services/meta-ads-service';
import { getLatestSyncLogs } from '@/lib/repositories/meta-ads';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [health, logs] = await Promise.all([
      checkTokenHealth(),
      Promise.resolve(getLatestSyncLogs(5)),
    ]);

    return NextResponse.json({
      success: true,
      token: health,
      lastSyncs: logs,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    logger.error('meta health error', {}, e as Error);
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}
