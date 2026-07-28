import { NextRequest, NextResponse } from 'next/server';
import { getInsights, DEFAULT_INSIGHT_FIELDS, requireMetaConfig } from '@/lib/meta/client';
import { upsertInsightsBatch } from '@/lib/repositories/meta-ads';
import { logger } from '@/lib/logger';

// Force dynamic rendering to handle search params properly
export const dynamic = 'force-dynamic';

export interface MetaInsightsData {
  spend: number;
  impressions: number;
  inlineLinkClicks: number;
  reach: number;
  date_start: string;
  date_end: string;
  cpc?: number;
  cpm?: number;
  ctr?: number;
  frequency?: number;
}

export interface MetaInsightsResponse {
  success: boolean;
  data?: MetaInsightsData;
  error?: string;
  meta?: any;
}

export async function GET(request: NextRequest): Promise<NextResponse<MetaInsightsResponse>> {
  try {
    // Keep backward compat: still support ENV check, but use client
    try {
      requireMetaConfig();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required environment variables: META_ACCESS_TOKEN or META_AD_ACCOUNT_ID',
        },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const since = searchParams.get('since');
    const until = searchParams.get('until');
    const level = (searchParams.get('level') as any) || 'account';
    const useDb = searchParams.get('from') === 'db';

    // Fast path: if requesting from DB, don't hit Meta API
    if (useDb) {
      const { getInsightsRange } = await import('@/lib/repositories/meta-ads');
      // Account response must use one hierarchy level. Summing account,
      // campaign and ad rows together would multiply the same Meta metrics.
      const rows = getInsightsRange({ startDate: since || undefined, endDate: until || undefined, level: 'campaign', limit: 500 });
      // aggregate for account level response shape
      let spend = 0,
        impressions = 0,
        inlineLinkClicks = 0,
        reach = 0;
      let ds = since || '',
        de = until || '';
      for (const r of rows as any[]) {
        spend += r.spend || 0;
        impressions += r.impressions || 0;
        inlineLinkClicks += r.inline_link_clicks || 0;
        reach += r.reach || 0;
        if (!ds) ds = r.date_record;
        de = r.date_record;
      }
      return NextResponse.json(
        {
          success: true,
          data: { spend, impressions, inlineLinkClicks, reach, date_start: ds, date_end: de },
          meta: { source: 'db', count: rows.length },
        },
        { status: 200 }
      );
    }

    const params: any = {
      level,
      fields: DEFAULT_INSIGHT_FIELDS,
      limit: 500,
    };
    if (since && until) {
      params.time_range = { since, until };
      // request daily granularity when range >1 day to save to DB properly
      const diff = new Date(until).getTime() - new Date(since).getTime();
      const daysDiff = diff / (1000 * 60 * 60 * 24);
      if (daysDiff > 0) params.time_increment = 1;
    } else {
      params.date_preset = 'today';
    }

    let insightsRows: any[] = [];
    try {
      insightsRows = await getInsights(params);
    } catch (e: any) {
      const msg = e.message || 'Meta API error';
      if (e.code === 190) {
        return NextResponse.json({ success: false, error: 'Invalid or expired access token. Please update META_ACCESS_TOKEN.' }, { status: 401 });
      }
      if (e.code === 100) {
        return NextResponse.json({ success: false, error: 'Invalid ad account ID format. Ensure it starts with "act_" followed by numbers.' }, { status: 400 });
      }
      return NextResponse.json({ success: false, error: msg }, { status: e.status || 500 });
    }

    if (!insightsRows || insightsRows.length === 0) {
      const today = new Date().toISOString().split('T')[0]!;
      return NextResponse.json(
        {
          success: true,
          data: {
            spend: 0,
            impressions: 0,
            inlineLinkClicks: 0,
            reach: 0,
            date_start: today,
            date_end: today,
          },
        },
        { status: 200 }
      );
    }

    // If time_increment=1, we have daily rows – upsert all to new table + legacy logic aggregates
    if (insightsRows.length > 1) {
      try {
        upsertInsightsBatch(insightsRows);
      } catch (err) {
        logger.warn('Failed to save insights batch (non-critical)', { error: (err as Error).message });
      }

      // aggregate for backward compat response
      let spend = 0,
        impressions = 0,
        inlineLinkClicks = 0,
        reach = 0;
      let ds = insightsRows[0].date_start || since || '';
      let de = insightsRows[insightsRows.length - 1].date_stop || until || '';
      let cpc = 0,
        cpm = 0,
        ctr = 0,
        freq = 0,
        freqCount = 0;
      for (const row of insightsRows) {
        spend += parseFloat(row.spend || '0');
        impressions += parseInt(row.impressions || '0');
        inlineLinkClicks += parseInt(row.inline_link_clicks || row.clicks || '0');
        reach += parseInt(row.reach || '0');
        cpc += parseFloat(row.cpc || '0');
        cpm += parseFloat(row.cpm || '0');
        ctr += parseFloat(row.ctr || '0');
        freq += parseFloat(row.frequency || '0');
        freqCount++;
      }
      if (freqCount > 0) {
        cpc /= freqCount;
        cpm /= freqCount;
        ctr /= freqCount;
        freq /= freqCount;
      }
      return NextResponse.json(
        {
          success: true,
          data: { spend, impressions, inlineLinkClicks, reach, date_start: ds, date_end: de, cpc, cpm, ctr, frequency: freq },
          meta: { count: insightsRows.length },
        },
        { status: 200 }
      );
    }

    // Single data point (now only uses new table)
    const insights = insightsRows[0];
    const result: MetaInsightsData = {
      spend: parseFloat(insights.spend || '0'),
      impressions: parseInt(insights.impressions || '0'),
      inlineLinkClicks: parseInt(insights.inline_link_clicks || insights.clicks || '0'),
      reach: parseInt(insights.reach || '0'),
      date_start: insights.date_start || '',
      date_end: insights.date_stop || '',
      cpc: parseFloat(insights.cpc || '0'),
      cpm: parseFloat(insights.cpm || '0'),
      ctr: parseFloat(insights.ctr || '0'),
      frequency: parseFloat(insights.frequency || '0'),
    };

    try {
      upsertInsightsBatch([insights]);
    } catch (dbError) {
      logger.warn('Database save failed (non-critical)', { error: (dbError as Error).message });
    }

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    logger.error('Unexpected error in Meta insights API', {}, error as Error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
