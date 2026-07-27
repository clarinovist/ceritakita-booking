import 'server-only';
import { getDb } from '@/lib/db';
import { logger } from '@/lib/logger';

export interface MetaCampaignRow {
  id: string;
  account_id?: string | null;
  name: string;
  status?: string | null;
  objective?: string | null;
  daily_budget?: number | null;
  lifetime_budget?: number | null;
  bid_strategy?: string | null;
  created_time?: string | null;
  updated_time?: string | null;
  raw_json?: string | null;
  synced_at?: string | null;
}

export interface MetaAdSetRow {
  id: string;
  campaign_id: string;
  name: string;
  status?: string | null;
  daily_budget?: number | null;
  lifetime_budget?: number | null;
  bid_amount?: number | null;
  targeting?: string | null;
  optimization_goal?: string | null;
  billing_event?: string | null;
  created_time?: string | null;
  updated_time?: string | null;
  raw_json?: string | null;
  synced_at?: string | null;
}

export interface MetaAdRow {
  id: string;
  adset_id: string;
  campaign_id: string;
  name: string;
  status?: string | null;
  creative_id?: string | null;
  creative_json?: string | null;
  tracking_specs?: string | null;
  created_time?: string | null;
  updated_time?: string | null;
  raw_json?: string | null;
  synced_at?: string | null;
}

export interface MetaInsightRow {
  id?: number;
  date_record: string;
  campaign_id?: string | null;
  adset_id?: string | null;
  ad_id?: string | null;
  spend: number;
  impressions: number;
  clicks: number;
  inline_link_clicks: number;
  reach: number;
  frequency: number;
  cpc: number;
  cpm: number;
  ctr: number;
  cpp: number;
  results: number;
  cost_per_result: number;
  actions?: string | null;
  action_values?: string | null;
  video_views: number;
  breakdown_type?: string | null;
  breakdown_value?: string | null;
  raw_json?: string | null;
  updated_at?: string | null;
}

function safeParseBudget(v: any): number | null {
  if (v === undefined || v === null) return null;
  const n = typeof v === 'string' ? parseInt(v) : Number(v);
  return isNaN(n) ? null : n;
}

export function upsertCampaigns(rows: any[], accountId?: string): number {
  const db = getDb();
  if (rows.length === 0) return 0;
  const stmt = db.prepare(`
    INSERT INTO meta_campaigns (id, account_id, name, status, objective, daily_budget, lifetime_budget, bid_strategy, created_time, updated_time, raw_json, synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      account_id=excluded.account_id,
      name=excluded.name,
      status=excluded.status,
      objective=excluded.objective,
      daily_budget=excluded.daily_budget,
      lifetime_budget=excluded.lifetime_budget,
      bid_strategy=excluded.bid_strategy,
      created_time=excluded.created_time,
      updated_time=excluded.updated_time,
      raw_json=excluded.raw_json,
      synced_at=CURRENT_TIMESTAMP
  `);
  const tx = db.transaction(() => {
    for (const r of rows) {
      stmt.run(
        String(r.id),
        accountId || (r.account_id as string) || null,
        r.name || '',
        r.status || null,
        r.objective || null,
        safeParseBudget(r.daily_budget),
        safeParseBudget(r.lifetime_budget),
        r.bid_strategy || null,
        r.created_time || null,
        r.updated_time || null,
        JSON.stringify(r)
      );
    }
  });
  tx();
  return rows.length;
}

export function upsertAdSets(rows: any[]): number {
  const db = getDb();
  if (rows.length === 0) return 0;
  const stmt = db.prepare(`
    INSERT INTO meta_adsets (id, campaign_id, name, status, daily_budget, lifetime_budget, bid_amount, targeting, optimization_goal, billing_event, created_time, updated_time, raw_json, synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      campaign_id=excluded.campaign_id,
      name=excluded.name,
      status=excluded.status,
      daily_budget=excluded.daily_budget,
      lifetime_budget=excluded.lifetime_budget,
      bid_amount=excluded.bid_amount,
      targeting=excluded.targeting,
      optimization_goal=excluded.optimization_goal,
      billing_event=excluded.billing_event,
      created_time=excluded.created_time,
      updated_time=excluded.updated_time,
      raw_json=excluded.raw_json,
      synced_at=CURRENT_TIMESTAMP
  `);
  const tx = db.transaction(() => {
    for (const r of rows) {
      stmt.run(
        String(r.id),
        String(r.campaign_id || ''),
        r.name || '',
        r.status || null,
        safeParseBudget(r.daily_budget),
        safeParseBudget(r.lifetime_budget),
        safeParseBudget(r.bid_amount),
        r.targeting ? JSON.stringify(r.targeting) : null,
        r.optimization_goal || null,
        r.billing_event || null,
        r.created_time || null,
        r.updated_time || null,
        JSON.stringify(r)
      );
    }
  });
  tx();
  return rows.length;
}

export function upsertAds(rows: any[]): number {
  const db = getDb();
  if (rows.length === 0) return 0;
  const stmt = db.prepare(`
    INSERT INTO meta_ads (id, adset_id, campaign_id, name, status, creative_id, creative_json, tracking_specs, created_time, updated_time, raw_json, synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      adset_id=excluded.adset_id,
      campaign_id=excluded.campaign_id,
      name=excluded.name,
      status=excluded.status,
      creative_id=excluded.creative_id,
      creative_json=excluded.creative_json,
      tracking_specs=excluded.tracking_specs,
      created_time=excluded.created_time,
      updated_time=excluded.updated_time,
      raw_json=excluded.raw_json,
      synced_at=CURRENT_TIMESTAMP
  `);
  const tx = db.transaction(() => {
    for (const r of rows) {
      const creativeId = r.creative?.id ? String(r.creative.id) : null;
      stmt.run(
        String(r.id),
        String(r.adset_id || ''),
        String(r.campaign_id || ''),
        r.name || '',
        r.status || null,
        creativeId,
        r.creative ? JSON.stringify(r.creative) : null,
        r.tracking_specs ? JSON.stringify(r.tracking_specs) : null,
        r.created_time || null,
        r.updated_time || null,
        JSON.stringify(r)
      );
    }
  });
  tx();
  return rows.length;
}



export interface InsightInput {
  date_start?: string;
  date_stop?: string;
  date_record?: string;
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  inline_link_clicks?: string;
  reach?: string;
  frequency?: string;
  cpc?: string;
  cpm?: string;
  ctr?: string;
  cpp?: string;
  results?: any;
  cost_per_result?: string;
  actions?: any[];
  action_values?: any[];
  [k: string]: any;
}

function normalizeInsight(r: InsightInput): Omit<MetaInsightRow, 'id'> | null {
  const dateRecord = r.date_start || r.date_record || '';
  if (!dateRecord) return null;
  const spend = parseFloat((r.spend as string) || '0');
  const impressions = parseInt((r.impressions as string) || '0');
  const clicks = parseInt((r.clicks as string) || '0');
  const inlineClicks = parseInt((r.inline_link_clicks as string) || (r.clicks as string) || '0');
  const reach = parseInt((r.reach as string) || '0');
  const frequency = parseFloat((r.frequency as string) || '0');
  const cpc = parseFloat((r.cpc as string) || '0');
  const cpm = parseFloat((r.cpm as string) || '0');
  const ctr = parseFloat((r.ctr as string) || '0');
  const cpp = parseFloat((r.cpp as string) || '0');
  let resultsVal = 0;
  if (r.results) {
    if (Array.isArray(r.results)) {
      const first = r.results[0];
      resultsVal = parseInt((first?.value as string) || '0');
    } else {
      resultsVal = parseInt(String(r.results) || '0');
    }
  }
  const costPerResult = parseFloat((r.cost_per_result as string) || '0');
  let actionsStr: string | null = null;
  if (r.actions) actionsStr = typeof r.actions === 'string' ? r.actions : JSON.stringify(r.actions);
  let actionValuesStr: string | null = null;
  if (r.action_values) actionValuesStr = typeof r.action_values === 'string' ? r.action_values : JSON.stringify(r.action_values);

  // video views from actions
  let videoViews = 0;
  if (r.actions && Array.isArray(r.actions)) {
    const vv = r.actions.find((a: any) => a.action_type === 'video_view');
    videoViews = vv ? parseInt(vv.value || '0') : 0;
  }

  return {
    date_record: dateRecord,
    campaign_id: r.campaign_id || null,
    adset_id: r.adset_id || null,
    ad_id: r.ad_id || (r as any).ad_id || null,
    spend,
    impressions,
    clicks,
    inline_link_clicks: inlineClicks,
    reach,
    frequency,
    cpc,
    cpm,
    ctr,
    cpp,
    results: resultsVal,
    cost_per_result: costPerResult,
    actions: actionsStr,
    action_values: actionValuesStr,
    video_views: videoViews,
    breakdown_type: null,
    breakdown_value: null,
    raw_json: JSON.stringify(r),
  };
}

export function upsertInsightsBatch(rows: InsightInput[]): number {
  const db = getDb();
  if (rows.length === 0) return 0;
  const normalized = rows.map(normalizeInsight).filter(Boolean) as Array<Omit<MetaInsightRow, 'id'>>;

  if (normalized.length === 0) return 0;

  const chunkSize = 100;
  let total = 0;
  for (let i = 0; i < normalized.length; i += chunkSize) {
    const chunk = normalized.slice(i, i + chunkSize);
    const stmt = db.prepare(`
      INSERT INTO meta_insights_daily 
      (date_record, campaign_id, adset_id, ad_id, spend, impressions, clicks, inline_link_clicks, reach, frequency, cpc, cpm, ctr, cpp, results, cost_per_result, actions, action_values, video_views, breakdown_type, breakdown_value, raw_json, updated_at)
      VALUES ${chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)').join(',')}
      ON CONFLICT(date_record, campaign_id, adset_id, ad_id, breakdown_type, breakdown_value) DO UPDATE SET
        spend=excluded.spend,
        impressions=excluded.impressions,
        clicks=excluded.clicks,
        inline_link_clicks=excluded.inline_link_clicks,
        reach=excluded.reach,
        frequency=excluded.frequency,
        cpc=excluded.cpc,
        cpm=excluded.cpm,
        ctr=excluded.ctr,
        cpp=excluded.cpp,
        results=excluded.results,
        cost_per_result=excluded.cost_per_result,
        actions=excluded.actions,
        action_values=excluded.action_values,
        video_views=excluded.video_views,
        raw_json=excluded.raw_json,
        updated_at=CURRENT_TIMESTAMP
    `);
    const values: any[] = [];
    for (const r of chunk) {
      values.push(
        r.date_record,
        r.campaign_id,
        r.adset_id,
        r.ad_id,
        r.spend,
        r.impressions,
        r.clicks,
        r.inline_link_clicks,
        r.reach,
        r.frequency,
        r.cpc,
        r.cpm,
        r.ctr,
        r.cpp,
        r.results,
        r.cost_per_result,
        r.actions,
        r.action_values,
        r.video_views,
        r.breakdown_type,
        r.breakdown_value,
        r.raw_json
      );
    }
    stmt.run(...values);
    total += chunk.length;
  }
  return total;
}

export function getCampaignsWithStats(startDate?: string, endDate?: string): Array<MetaCampaignRow & { total_spend: number; total_impressions: number; total_clicks: number; total_reach: number; avg_cpc: number; avg_ctr: number; leads_count: number; bookings_count: number; revenue: number }> {
  const db = getDb();
  let sql = `
    SELECT c.*,
      COALESCE(SUM(i.spend),0) as total_spend,
      COALESCE(SUM(i.impressions),0) as total_impressions,
      COALESCE(SUM(i.inline_link_clicks),0) as total_clicks,
      COALESCE(MAX(i.reach),0) as total_reach,
      COALESCE(AVG(i.cpc),0) as avg_cpc,
      COALESCE(AVG(i.ctr),0) as avg_ctr
    FROM meta_campaigns c
    LEFT JOIN meta_insights_daily i ON i.campaign_id = c.id
  `;
  const params: any[] = [];
  const cond: string[] = [];
  if (startDate) { cond.push('i.date_record >= ?'); params.push(startDate); }
  if (endDate) { cond.push('i.date_record <= ?'); params.push(endDate); }
  // if we have date filters, they should be inside LEFT JOIN condition to not filter out campaigns without insights
  // rebuild
  if (startDate || endDate) {
    sql = `
      SELECT c.*,
        COALESCE(SUM(i.spend),0) as total_spend,
        COALESCE(SUM(i.impressions),0) as total_impressions,
        COALESCE(SUM(i.inline_link_clicks),0) as total_clicks,
        COALESCE(SUM(i.reach),0) as total_reach,
        COALESCE(AVG(i.cpc),0) as avg_cpc,
        COALESCE(AVG(i.ctr),0) as avg_ctr
      FROM meta_campaigns c
      LEFT JOIN meta_insights_daily i ON i.campaign_id = c.id
        ${startDate ? 'AND i.date_record >= ?' : ''}
        ${endDate ? 'AND i.date_record <= ?' : ''}
    `;
    // params already pushed in order
  }
  sql += ' GROUP BY c.id ORDER BY total_spend DESC';

  const rows = db.prepare(sql).all(...params) as any[];

  // enrich with leads/bookings counts per campaign if columns exist
  for (const row of rows) {
    try {
      const campaignId = row.id as string;
      const leadsCnt = db.prepare(`SELECT COUNT(*) as c FROM leads WHERE meta_campaign_id = ? ${startDate ? 'AND DATE(created_at) >= ?' : ''} ${endDate ? 'AND DATE(created_at) <= ?' : ''}`).get(
        campaignId, ...(startDate ? [startDate] : []), ...(endDate ? [endDate] : [])
      ) as { c: number } | undefined;
      row.leads_count = leadsCnt?.c ?? 0;

      const bookingsAgg = db.prepare(`
        SELECT COUNT(*) as cnt, COALESCE(SUM(b.total_price),0) as rev
        FROM bookings b
        JOIN leads l ON b.lead_id = l.id
        WHERE l.meta_campaign_id = ?
        ${startDate ? 'AND DATE(b.created_at) >= ?' : ''}
        ${endDate ? 'AND DATE(b.created_at) <= ?' : ''}
      `).get(
        campaignId, ...(startDate ? [startDate] : []), ...(endDate ? [endDate] : [])
      ) as { cnt: number; rev: number } | undefined;
      row.bookings_count = bookingsAgg?.cnt ?? 0;
      row.revenue = bookingsAgg?.rev ?? 0;
    } catch {
      row.leads_count = 0;
      row.bookings_count = 0;
      row.revenue = 0;
    }
  }

  return rows as any;
}

export function getAdSetsWithStats(campaignId?: string, startDate?: string, endDate?: string) {
  const db = getDb();
  let sql = `
    SELECT a.*,
      COALESCE(SUM(i.spend),0) as total_spend,
      COALESCE(SUM(i.impressions),0) as total_impressions,
      COALESCE(SUM(i.inline_link_clicks),0) as total_clicks,
      COALESCE(SUM(i.reach),0) as total_reach
    FROM meta_adsets a
    LEFT JOIN meta_insights_daily i ON i.adset_id = a.id
      ${startDate ? 'AND i.date_record >= ?' : ''}
      ${endDate ? 'AND i.date_record <= ?' : ''}
    WHERE 1=1
  `;
  const params: any[] = [];
  if (startDate) params.push(startDate);
  if (endDate) params.push(endDate);
  if (campaignId) { sql += ' AND a.campaign_id = ?'; params.push(campaignId); }
  sql += ' GROUP BY a.id ORDER BY total_spend DESC';
  return db.prepare(sql).all(...params);
}

export function getAdsWithStats(opts: { campaignId?: string; adsetId?: string; startDate?: string; endDate?: string }) {
  const db = getDb();
  let sql = `
    SELECT ad.*,
      COALESCE(SUM(i.spend),0) as total_spend,
      COALESCE(SUM(i.impressions),0) as total_impressions,
      COALESCE(SUM(i.inline_link_clicks),0) as total_clicks,
      COALESCE(SUM(i.reach),0) as total_reach
    FROM meta_ads ad
    LEFT JOIN meta_insights_daily i ON i.ad_id = ad.id
      ${opts.startDate ? 'AND i.date_record >= ?' : ''}
      ${opts.endDate ? 'AND i.date_record <= ?' : ''}
    WHERE 1=1
  `;
  const params: any[] = [];
  if (opts.startDate) params.push(opts.startDate);
  if (opts.endDate) params.push(opts.endDate);
  if (opts.campaignId) { sql += ' AND ad.campaign_id = ?'; params.push(opts.campaignId); }
  if (opts.adsetId) { sql += ' AND ad.adset_id = ?'; params.push(opts.adsetId); }
  sql += ' GROUP BY ad.id ORDER BY total_spend DESC';
  return db.prepare(sql).all(...params);
}

export function getInsightsRange(opts: { campaignId?: string; adsetId?: string; adId?: string; startDate?: string; endDate?: string; level?: string; limit?: number }) {
  const db = getDb();
  let sql = `SELECT * FROM meta_insights_daily WHERE 1=1`;
  const params: any[] = [];
  if (opts.campaignId) { sql += ' AND campaign_id = ?'; params.push(opts.campaignId); }
  if (opts.adsetId) { sql += ' AND adset_id = ?'; params.push(opts.adsetId); }
  if (opts.adId) { sql += ' AND ad_id = ?'; params.push(opts.adId); }
  if (opts.startDate) { sql += ' AND date_record >= ?'; params.push(opts.startDate); }
  if (opts.endDate) { sql += ' AND date_record <= ?'; params.push(opts.endDate); }
  sql += ' ORDER BY date_record ASC';
  if (opts.limit) { sql += ' LIMIT ?'; params.push(opts.limit); }
  return db.prepare(sql).all(...params);
}

export function createSyncLog(syncType: string): number {
  const db = getDb();
  const res = db.prepare(`INSERT INTO meta_sync_log (sync_type, status) VALUES (?, 'running')`).run(syncType);
  return Number(res.lastInsertRowid);
}

export function finishSyncLog(id: number, status: 'success' | 'failed', records: number, errorMsg?: string) {
  const db = getDb();
  db.prepare(`UPDATE meta_sync_log SET status = ?, records_synced = ?, finished_at = CURRENT_TIMESTAMP, error_msg = ? WHERE id = ?`).run(status, records, errorMsg || null, id);
}

export function getLatestSyncLogs(limit = 20) {
  const db = getDb();
  return db.prepare(`SELECT * FROM meta_sync_log ORDER BY started_at DESC LIMIT ?`).all(limit);
}

export function getAttributionFunnel(startDate?: string, endDate?: string) {
  const db = getDb();
  // total insights in range
  let spend = 0, impressions = 0, clicks = 0, reach = 0;
  try {
    const row = db.prepare(`
      SELECT COALESCE(SUM(spend),0) as spend, COALESCE(SUM(impressions),0) as impressions, COALESCE(SUM(inline_link_clicks),0) as clicks, COALESCE(SUM(reach),0) as reach
      FROM meta_insights_daily
      WHERE 1=1
      ${startDate ? 'AND date_record >= ?' : ''}
      ${endDate ? 'AND date_record <= ?' : ''}
    `).get(...(startDate ? [startDate] : []), ...(endDate ? [endDate] : [])) as any;
    spend = row?.spend || 0;
    impressions = row?.impressions || 0;
    clicks = row?.clicks || 0;
    reach = row?.reach || 0;
  } catch {}

  let waClicks = 0, waBySource: any[] = [];
  try {
    const params: any[] = [];
    let sql = `SELECT COUNT(*) as cnt FROM wa_clicks WHERE 1=1`;
    if (startDate) { sql += ' AND DATE(clicked_at) >= ?'; params.push(startDate); }
    if (endDate) { sql += ' AND DATE(clicked_at) <= ?'; params.push(endDate); }
    const r = db.prepare(sql).get(...params) as { cnt: number };
    waClicks = r?.cnt || 0;

    let sql2 = `SELECT source, COUNT(*) as cnt FROM wa_clicks WHERE 1=1`;
    const params2: any[] = [];
    if (startDate) { sql2 += ' AND DATE(clicked_at) >= ?'; params2.push(startDate); }
    if (endDate) { sql2 += ' AND DATE(clicked_at) <= ?'; params2.push(endDate); }
    sql2 += ' GROUP BY source ORDER BY cnt DESC';
    waBySource = db.prepare(sql2).all(...params2);
  } catch {}

  let leadsTotal = 0, leadsBySource: any[] = [];
  try {
    const params: any[] = [];
    let sql = `SELECT COUNT(*) as cnt FROM leads WHERE 1=1`;
    if (startDate) { sql += ' AND DATE(created_at) >= ?'; params.push(startDate); }
    if (endDate) { sql += ' AND DATE(created_at) <= ?'; params.push(endDate); }
    leadsTotal = (db.prepare(sql).get(...params) as any)?.cnt || 0;

    let sql2 = `SELECT source as source, COUNT(*) as cnt FROM leads WHERE 1=1`;
    const params2: any[] = [];
    if (startDate) { sql2 += ' AND DATE(created_at) >= ?'; params2.push(startDate); }
    if (endDate) { sql2 += ' AND DATE(created_at) <= ?'; params2.push(endDate); }
    sql2 += ' GROUP BY source ORDER BY cnt DESC';
    leadsBySource = db.prepare(sql2).all(...params2);
  } catch {}

  let bookingsTotal = 0, revenueTotal = 0;
  try {
    const params: any[] = [];
    let sql = `SELECT COUNT(*) as cnt, COALESCE(SUM(total_price),0) as rev FROM bookings WHERE status != 'Cancelled'`;
    if (startDate) { sql += ' AND DATE(created_at) >= ?'; params.push(startDate); }
    if (endDate) { sql += ' AND DATE(created_at) <= ?'; params.push(endDate); }
    const r = db.prepare(sql).get(...params) as any;
    bookingsTotal = r?.cnt || 0;
    revenueTotal = r?.rev || 0;
  } catch {}

  // per campaign breakdown - separate aggregations to avoid cartesian multiplication
  let byCampaign: any[] = [];
  try {
    const campaigns = db.prepare(`SELECT id, name, status FROM meta_campaigns ORDER BY name`).all() as { id: string; name: string; status: string }[];
    for (const c of campaigns) {
      let spend = 0, impressions = 0, clicks = 0;
      try {
        let sql = `SELECT COALESCE(SUM(spend),0) as spend, COALESCE(SUM(impressions),0) as impressions, COALESCE(SUM(inline_link_clicks),0) as clicks FROM meta_insights_daily WHERE campaign_id = ?`;
        const params: any[] = [c.id];
        if (startDate) { sql += ' AND date_record >= ?'; params.push(startDate); }
        if (endDate) { sql += ' AND date_record <= ?'; params.push(endDate); }
        const r = db.prepare(sql).get(...params) as any;
        spend = r?.spend || 0;
        impressions = r?.impressions || 0;
        clicks = r?.clicks || 0;
      } catch {}

      let leads = 0;
      try {
        let sql = `SELECT COUNT(*) as cnt FROM leads WHERE meta_campaign_id = ?`;
        const params: any[] = [c.id];
        if (startDate) { sql += ' AND DATE(created_at) >= ?'; params.push(startDate); }
        if (endDate) { sql += ' AND DATE(created_at) <= ?'; params.push(endDate); }
        const r = db.prepare(sql).get(...params) as any;
        leads = r?.cnt || 0;
      } catch {}

      let bookings = 0, revenue = 0;
      try {
        let sql = `
          SELECT COUNT(DISTINCT b.id) as bookings, COALESCE(SUM(b.total_price),0) as revenue
          FROM bookings b
          JOIN leads l ON b.lead_id = l.id
          WHERE l.meta_campaign_id = ? AND b.status != 'Cancelled'
        `;
        const params: any[] = [c.id];
        if (startDate) { sql += ' AND DATE(b.created_at) >= ?'; params.push(startDate); }
        if (endDate) { sql += ' AND DATE(b.created_at) <= ?'; params.push(endDate); }
        const r = db.prepare(sql).get(...params) as any;
        bookings = r?.bookings || 0;
        revenue = r?.revenue || 0;
      } catch {}

      byCampaign.push({
        id: c.id,
        name: c.name,
        status: c.status,
        spend,
        impressions,
        clicks,
        leads,
        bookings,
        revenue,
      });
    }
    byCampaign.sort((a, b) => b.spend - a.spend);
  } catch (e) {
    logger.warn('attribution byCampaign query failed', { error: (e as Error).message });
    try {
      byCampaign = db.prepare(`
        SELECT id, name, status, 0 as spend, 0 as impressions, 0 as clicks, 0 as leads, 0 as bookings, 0 as revenue FROM meta_campaigns ORDER BY name
      `).all();
    } catch {
      byCampaign = [];
    }
  }

  return {
    totals: { spend, impressions, clicks, reach, waClicks, leads: leadsTotal, bookings: bookingsTotal, revenue: revenueTotal },
    waBySource,
    leadsBySource,
    byCampaign,
  };
}

export function logAudit(entityType: string, entityId: string, action: string, payload?: any, performedBy?: string) {
  try {
    const db = getDb();
    db.prepare(`INSERT INTO meta_audit_log (entity_type, entity_id, action, payload, performed_by) VALUES (?, ?, ?, ?, ?)`).run(
      entityType, entityId, action, payload ? JSON.stringify(payload) : null, performedBy || null
    );
  } catch {}
}
