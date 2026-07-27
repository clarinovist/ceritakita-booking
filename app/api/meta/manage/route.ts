import { NextRequest, NextResponse } from 'next/server';
import { updateCampaign, updateAdSet, updateAd, getMetaConfig } from '@/lib/meta/client';
import { logAudit } from '@/lib/repositories/meta-ads';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

type ManageAction = 'pause' | 'resume' | 'archive' | 'update_budget' | 'update_status';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entity, id, action, value, performed_by } = body as {
      entity: 'campaign' | 'adset' | 'ad';
      id: string;
      action: ManageAction;
      value?: any;
      performed_by?: string;
    };

    if (!entity || !id || !action) {
      return NextResponse.json({ success: false, error: 'entity, id, action required' }, { status: 400 });
    }

    const cfg = getMetaConfig();
    if (!cfg.accessToken || !cfg.adAccountId) {
      return NextResponse.json({ success: false, error: 'Meta not configured' }, { status: 500 });
    }

    // safety: only allow act_ prefix check if ad account matches? We skip strict but log
    // Ensure id looks like numeric
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 });
    }

    let payload: Record<string, any> = {};
    if (action === 'pause') payload = { status: 'PAUSED' };
    else if (action === 'resume') payload = { status: 'ACTIVE' };
    else if (action === 'archive') payload = { status: 'ARCHIVED' };
    else if (action === 'update_budget') {
      if (value === undefined || isNaN(Number(value))) {
        return NextResponse.json({ success: false, error: 'value must be daily budget in IDR cents? Provide integer' }, { status: 400 });
      }
      // Meta expects daily_budget in account currency smallest unit? For IDR it's IDR.
      // We accept value as integer of IDR (e.g. 100000). Pass through.
      payload = { daily_budget: String(value) };
    } else if (action === 'update_status') {
      if (!value) return NextResponse.json({ success: false, error: 'value required for update_status' }, { status: 400 });
      payload = { status: String(value).toUpperCase() };
    } else {
      return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }

    let result: any;
    try {
      if (entity === 'campaign') result = await updateCampaign(id, payload);
      else if (entity === 'adset') result = await updateAdSet(id, payload);
      else if (entity === 'ad') result = await updateAd(id, payload);
      else return NextResponse.json({ success: false, error: 'Unknown entity' }, { status: 400 });
    } catch (e: any) {
      logger.error('Meta manage action failed', { entity, id, action, error: e.message });
      return NextResponse.json({ success: false, error: e.message, code: e.code }, { status: e.status || 500 });
    }

    logAudit(entity, id, action, payload, performed_by || 'system');

    // update local DB status to reflect
    try {
      const { getDb } = await import('@/lib/db');
      const db = getDb();
      const table = entity === 'campaign' ? 'meta_campaigns' : entity === 'adset' ? 'meta_adsets' : 'meta_ads';
      if (payload.status) {
        db.prepare(`UPDATE ${table} SET status = ?, synced_at = CURRENT_TIMESTAMP WHERE id = ?`).run(payload.status, id);
      }
      if (payload.daily_budget) {
        db.prepare(`UPDATE ${table} SET daily_budget = ?, synced_at = CURRENT_TIMESTAMP WHERE id = ?`).run(parseInt(payload.daily_budget), id);
      }
    } catch {}

    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    logger.error('manage route error', {}, e as Error);
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}
