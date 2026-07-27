import { NextRequest, NextResponse } from 'next/server';
import { getInsightsRange } from '@/lib/repositories/meta-ads';
import { logger, createErrorResponse } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export interface AdsHistoryRecord {
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
  date_record: string;
  updated_at: string;
}

export interface AdsHistoryResponse {
  success: boolean;
  data?: AdsHistoryRecord[];
  error?: string;
  note?: string;
}

/**
 * GET /api/meta/history - refactored to read from meta_insights_daily (new)
 * Legacy ads_performance_log kept for backward compat but this endpoint now uses new table
 */
export async function GET(request: NextRequest): Promise<NextResponse<AdsHistoryResponse>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '30');
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    // Read from new granular table, aggregate by date (account level)
    const rows = getInsightsRange({ startDate, endDate, limit: limit * 5 });

    // Group by date_record and sum
    const grouped = new Map<string, { spend: number; impressions: number; clicks: number; reach: number; updated_at: string }>();
    for (const r of rows as any[]) {
      const key = r.date_record;
      const existing = grouped.get(key) || { spend: 0, impressions: 0, clicks: 0, reach: 0, updated_at: r.updated_at || new Date().toISOString() };
      existing.spend += r.spend || 0;
      existing.impressions += r.impressions || 0;
      existing.clicks += r.inline_link_clicks || 0;
      existing.reach += r.reach || 0;
      grouped.set(key, existing);
    }

    let historyData: AdsHistoryRecord[] = Array.from(grouped.entries())
      .map(([date_record, v]) => ({
        spend: v.spend,
        impressions: v.impressions,
        clicks: v.clicks,
        reach: v.reach,
        date_record,
        updated_at: v.updated_at,
      }))
      .sort((a, b) => b.date_record.localeCompare(a.date_record))
      .slice(0, limit);

    // Fallback to legacy table if new table empty (for transition period)
    if (historyData.length === 0) {
      try {
        const { getAdsLog } = await import('@/lib/repositories/analytics');
        const legacy = getAdsLog(undefined, startDate, endDate, limit);
        historyData = legacy.map(record => ({
          spend: record.spend,
          impressions: record.impressions,
          clicks: record.inlineLinkClicks,
          reach: record.reach,
          date_record: record.date_start || '',
          updated_at: record.updated_at || new Date().toISOString(),
        }));
      } catch {}
    }

    return NextResponse.json(
      {
        success: true,
        data: historyData,
        note: 'Refactored to read from meta_insights_daily',
      },
      { status: 200 }
    );
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    logger.error('Error fetching ads history', {}, error as Error);
    return NextResponse.json(
      {
        success: false,
        error: errorResponse.message || 'Failed to fetch ads history',
      },
      { status: statusCode }
    );
  }
}