import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getInsights } from '@/lib/meta/client';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth) return auth;

  try {
    const body = await req.json().catch(() => ({}));
    const days = Math.min(body.days || 30, 90);

    const now = new Date();
    const until = now.toISOString().split('T')[0]!;
    const sinceDate = new Date(now);
    sinceDate.setDate(now.getDate() - (days - 1));
    const since = sinceDate.toISOString().split('T')[0]!;

    const liveInsights = await getInsights({
      level: 'campaign',
      time_range: { since, until },
      time_increment: 'all_days',
      fields: ['spend', 'impressions', 'inline_link_clicks'],
    });

    const metaLiveSpend = liveInsights.reduce((acc: number, r: any) => acc + parseFloat(r.spend || '0'), 0);
    const metaLiveImpressions = liveInsights.reduce((acc: number, r: any) => acc + parseInt(r.impressions || '0'), 0);

    const db = getDb();
    const dbRow = db.prepare(`
      SELECT COALESCE(SUM(spend), 0) as spend, COALESCE(SUM(impressions), 0) as impressions
      FROM meta_insights_daily
      WHERE level = 'campaign' AND date_record >= ? AND date_record <= ? AND breakdown_type = ""
    `).get(since, until) as { spend: number; impressions: number };

    const spendDiff = Math.abs(metaLiveSpend - dbRow.spend);
    const matched = spendDiff < 1;

    return NextResponse.json({
      success: true,
      range: { since, until },
      metaLive: { spend: metaLiveSpend, impressions: metaLiveImpressions },
      dbLocal: { spend: dbRow.spend, impressions: dbRow.impressions },
      difference: { spendDiff },
      reconciled: matched,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
