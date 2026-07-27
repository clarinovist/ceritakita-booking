import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Lazy import to avoid DB init errors breaking health check
    let health: any = null;
    let logs: any[] = [];
    try {
      const { checkTokenHealth } = await import('@/lib/services/meta-ads-service');
      health = await checkTokenHealth();
    } catch (e: any) {
      health = { valid: false, error: e.message, note: 'checkTokenHealth failed' };
      logger.warn('meta health checkTokenHealth failed', { error: e.message });
    }
    try {
      const { getLatestSyncLogs } = await import('@/lib/repositories/meta-ads');
      logs = getLatestSyncLogs(5);
    } catch (e: any) {
      logger.warn('meta health getLatestSyncLogs failed', { error: e.message });
      logs = [];
    }

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
