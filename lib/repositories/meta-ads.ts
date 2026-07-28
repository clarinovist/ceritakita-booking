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
      AND COALESCE(i.adset_id, '') = '' AND COALESCE(i.ad_id, '') = ''
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
        AND COALESCE(i.adset_id, '') = '' AND COALESCE(i.ad_id, '') = ''
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
      AND COALESCE(i.ad_id, '') = ''
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
  // Insights are synced at multiple Meta hierarchy levels (account, campaign,
  // adset and ad).  Keep the level filter explicit so consumers do not
  // mistake the same metric repeated at different levels for duplicate rows.
  // Older rows may still contain NULLs, hence the COALESCE guards.
  switch (opts.level) {
    case 'account':
      sql += ` AND COALESCE(campaign_id, '') = '' AND COALESCE(adset_id, '') = '' AND COALESCE(ad_id, '') = ''`;
      break;
    case 'campaign':
      sql += ` AND COALESCE(campaign_id, '') != '' AND COALESCE(adset_id, '') = '' AND COALESCE(ad_id, '') = ''`;
      break;
    case 'adset':
      sql += ` AND COALESCE(adset_id, '') != '' AND COALESCE(ad_id, '') = ''`;
      break;
    case 'ad':
      sql += ` AND COALESCE(ad_id, '') != ''`;
      break;
    default:
      // No level means all granularities (backward compatible behaviour).
      break;
  }
  if (opts.campaignId) { sql += ' AND campaign_id = ?'; params.push(opts.campaignId); }
  if (opts.adsetId) { sql += ' AND adset_id = ?'; params.push(opts.adsetId); }
  if (opts.adId) { sql += ' AND ad_id = ?'; params.push(opts.adId); }
  if (opts.startDate) { sql += ' AND date_record >= ?'; params.push(opts.startDate); }
  if (opts.endDate) { sql += ' AND date_record <= ?'; params.push(opts.endDate); }
  sql += ' ORDER BY date_record ASC';
  if (opts.limit) { sql += ' LIMIT ?'; params.push(opts.limit); }
  return db.prepare(sql).all(...params);
}

export interface MetaAccountRow {
  id: string;
  name?: string | null;
  account_status?: string | null;
  currency?: string | null;
  timezone_name?: string | null;
  timezone_offset_hours?: number | null;
  business_id?: string | null;
  raw_json?: string | null;
  synced_at?: string | null;
}

export interface MetaCreativeRow {
  id: string;
  ad_id?: string | null;
  campaign_id?: string | null;
  creative_type?: string | null;
  title?: string | null;
  body?: string | null;
  call_to_action?: string | null;
  thumbnail_url?: string | null;
  asset_ids_json?: string | null;
  raw_json?: string | null;
  synced_at?: string | null;
}

export interface MetaSyncRunRow {
  id: number;
  scope?: string | null;
  since?: string | null;
  until?: string | null;
  status?: string | null;
  records_synced: number;
  request_count: number;
  rate_limit_count: number;
  started_at?: string | null;
  finished_at?: string | null;
  error_json?: string | null;
}

export interface MetaSyncErrorRow {
  id: number;
  sync_run_id?: number | null;
  endpoint?: string | null;
  field_set?: string | null;
  http_status?: number | null;
  error_code?: string | null;
  error_message?: string | null;
  retryable: number;
  created_at?: string | null;
}

export interface MetaCapabilityRow {
  account_id: string;
  api_version: string;
  capability_key: string;
  supported: number;
  last_checked_at?: string | null;
  error_code?: string | null;
  error_message?: string | null;
}

export function upsertAccount(account: any): boolean {
  const db = getDb();
  if (!account || !account.id) return false;
  const stmt = db.prepare(`
    INSERT INTO meta_accounts (id, name, account_status, currency, timezone_name, timezone_offset_hours, business_id, raw_json, synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name,
      account_status=excluded.account_status,
      currency=excluded.currency,
      timezone_name=excluded.timezone_name,
      timezone_offset_hours=excluded.timezone_offset_hours,
      business_id=excluded.business_id,
      raw_json=excluded.raw_json,
      synced_at=CURRENT_TIMESTAMP
  `);
  stmt.run(
    String(account.id),
    account.name || null,
    account.account_status !== undefined ? String(account.account_status) : null,
    account.currency || null,
    account.timezone_name || null,
    account.timezone_offset_hours_utc !== undefined ? Number(account.timezone_offset_hours_utc) : null,
    account.business?.id ? String(account.business.id) : null,
    JSON.stringify(account)
  );
  return true;
}

export function getAccount(id?: string): MetaAccountRow | null {
  const db = getDb();
  if (id) {
    return (db.prepare('SELECT * FROM meta_accounts WHERE id = ?').get(id) as MetaAccountRow) || null;
  }
  return (db.prepare('SELECT * FROM meta_accounts ORDER BY synced_at DESC LIMIT 1').get() as MetaAccountRow) || null;
}

export function upsertCreatives(rows: any[]): number {
  const db = getDb();
  if (rows.length === 0) return 0;
  const stmt = db.prepare(`
    INSERT INTO meta_creatives (id, ad_id, campaign_id, creative_type, title, body, call_to_action, thumbnail_url, asset_ids_json, raw_json, synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      ad_id=excluded.ad_id,
      campaign_id=excluded.campaign_id,
      creative_type=excluded.creative_type,
      title=excluded.title,
      body=excluded.body,
      call_to_action=excluded.call_to_action,
      thumbnail_url=excluded.thumbnail_url,
      asset_ids_json=excluded.asset_ids_json,
      raw_json=excluded.raw_json,
      synced_at=CURRENT_TIMESTAMP
  `);
  const tx = db.transaction(() => {
    for (const r of rows) {
      const title = r.title || r.object_story_spec?.link_data?.title || r.name || null;
      const body = r.body || r.object_story_spec?.link_data?.message || r.object_story_spec?.link_data?.caption || null;
      const cta = r.call_to_action_type || r.object_story_spec?.link_data?.call_to_action?.type || null;
      const thumbnail = r.thumbnail_url || r.image_url || r.object_story_spec?.link_data?.picture || null;
      stmt.run(
        String(r.id),
        r.ad_id ? String(r.ad_id) : null,
        r.campaign_id ? String(r.campaign_id) : null,
        r.creative_type || (r.object_story_spec?.link_data ? 'link' : 'general'),
        title,
        body,
        cta,
        thumbnail,
        r.asset_feed_spec ? JSON.stringify(r.asset_feed_spec) : null,
        JSON.stringify(r)
      );
    }
  });
  tx();
  return rows.length;
}

export function getCreatives(opts?: { campaignId?: string; adId?: string; limit?: number; offset?: number }) {
  const db = getDb();
  let sql = 'SELECT * FROM meta_creatives WHERE 1=1';
  const params: any[] = [];
  if (opts?.campaignId) { sql += ' AND campaign_id = ?'; params.push(opts.campaignId); }
  if (opts?.adId) { sql += ' AND ad_id = ?'; params.push(opts.adId); }
  sql += ' ORDER BY synced_at DESC';
  if (opts?.limit) { sql += ' LIMIT ?'; params.push(opts.limit); }
  if (opts?.offset) { sql += ' OFFSET ?'; params.push(opts.offset); }
  return db.prepare(sql).all(...params);
}

function createDimensionsHash(obj: any): string {
  if (!obj || typeof obj !== 'object' || Object.keys(obj).length === 0) return '';
  const sortedKeys = Object.keys(obj).sort();
  const str = sortedKeys.map(k => `${k}:${obj[k]}`).join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export interface InsightInput {
  date_start?: string;
  date_stop?: string;
  date_record?: string;
  level?: 'account' | 'campaign' | 'adset' | 'ad';
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  spend?: string | number;
  impressions?: string | number;
  clicks?: string | number;
  inline_link_clicks?: string | number;
  reach?: string | number;
  frequency?: string | number;
  cpc?: string | number;
  cpm?: string | number;
  ctr?: string | number;
  cpp?: string | number;
  results?: any;
  cost_per_result?: string | number;
  actions?: any[];
  action_values?: any[];
  video_p25_watched_actions?: any[];
  video_p50_watched_actions?: any[];
  video_p75_watched_actions?: any[];
  video_p100_watched_actions?: any[];
  purchase_roas?: any[];
  dimensions?: Record<string, any>;
  breakdown_type?: string;
  breakdown_value?: string;
  request_id?: string;
  [k: string]: any;
}

function normalizeInsightExtended(r: InsightInput, syncRunId?: number) {
  const dateRecord = r.date_start || r.date_record || '';
  if (!dateRecord) return null;

  let level = r.level;
  if (!level) {
    if (r.ad_id) level = 'ad';
    else if (r.adset_id) level = 'adset';
    else if (r.campaign_id) level = 'campaign';
    else level = 'account';
  }

  const spend = parseFloat(String(r.spend || '0'));
  const impressions = parseInt(String(r.impressions || '0'));
  const clicks = parseInt(String(r.clicks || '0'));
  const inlineClicks = parseInt(String(r.inline_link_clicks || r.clicks || '0'));
  const reach = parseInt(String(r.reach || '0'));
  const frequency = parseFloat(String(r.frequency || '0'));
  const cpc = parseFloat(String(r.cpc || '0'));
  const cpm = parseFloat(String(r.cpm || '0'));
  const ctr = parseFloat(String(r.ctr || '0'));
  const cpp = parseFloat(String(r.cpp || '0'));

  let resultsVal = 0;
  if (r.results) {
    if (Array.isArray(r.results)) {
      resultsVal = parseInt(String(r.results[0]?.value || '0'));
    } else {
      resultsVal = parseInt(String(r.results || '0'));
    }
  }
  const costPerResult = parseFloat(String(r.cost_per_result || '0'));

  let actionsStr: string | null = null;
  if (r.actions) actionsStr = typeof r.actions === 'string' ? r.actions : JSON.stringify(r.actions);

  let actionValuesStr: string | null = null;
  if (r.action_values) actionValuesStr = typeof r.action_values === 'string' ? r.action_values : JSON.stringify(r.action_values);

  let videoViews = 0;
  if (r.actions && Array.isArray(r.actions)) {
    const vv = r.actions.find((a: any) => a.action_type === 'video_view');
    videoViews = vv ? parseInt(String(vv.value || '0')) : 0;
  }

  const videoMetrics = {
    p25: r.video_p25_watched_actions || [],
    p50: r.video_p50_watched_actions || [],
    p75: r.video_p75_watched_actions || [],
    p100: r.video_p100_watched_actions || [],
  };

  const dimsHash = createDimensionsHash(r.dimensions || {});

  return {
    date_record: dateRecord,
    level,
    date_start: r.date_start || dateRecord,
    date_stop: r.date_stop || dateRecord,
    campaign_id: r.campaign_id || '',
    adset_id: r.adset_id || '',
    ad_id: r.ad_id || '',
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
    breakdown_type: r.breakdown_type || '',
    breakdown_value: r.breakdown_value || '',
    dimensions_json: r.dimensions ? JSON.stringify(r.dimensions) : null,
    dimensions_json_hash: dimsHash,
    purchase_roas_json: r.purchase_roas ? JSON.stringify(r.purchase_roas) : null,
    video_metrics_json: JSON.stringify(videoMetrics),
    request_id: r.request_id || null,
    sync_run_id: syncRunId || null,
    raw_json: JSON.stringify(r),
    raw_actions: r.actions,
    raw_action_values: r.action_values,
  };
}

export function upsertInsightsBatch(rows: InsightInput[], syncRunId?: number): number {
  const db = getDb();
  if (rows.length === 0) return 0;
  const normalized = rows.map(r => normalizeInsightExtended(r, syncRunId)).filter((r): r is NonNullable<typeof r> => r !== null);
  if (normalized.length === 0) return 0;

  const insertStmt = db.prepare(`
    INSERT INTO meta_insights_daily
    (date_record, level, date_start, date_stop, campaign_id, adset_id, ad_id, spend, impressions, clicks, inline_link_clicks, reach, frequency, cpc, cpm, ctr, cpp, results, cost_per_result, actions, action_values, video_views, breakdown_type, breakdown_value, dimensions_json, dimensions_json_hash, purchase_roas_json, video_metrics_json, request_id, sync_run_id, raw_json, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(date_record, campaign_id, adset_id, ad_id, breakdown_type, breakdown_value) DO UPDATE SET
      level=excluded.level,
      date_start=excluded.date_start,
      date_stop=excluded.date_stop,
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
      dimensions_json=excluded.dimensions_json,
      dimensions_json_hash=excluded.dimensions_json_hash,
      purchase_roas_json=excluded.purchase_roas_json,
      video_metrics_json=excluded.video_metrics_json,
      request_id=excluded.request_id,
      sync_run_id=excluded.sync_run_id,
      raw_json=excluded.raw_json,
      updated_at=CURRENT_TIMESTAMP
  `);

  const selectInsightIdStmt = db.prepare(`
    SELECT id FROM meta_insights_daily
    WHERE date_record = ? AND campaign_id = ? AND adset_id = ? AND ad_id = ? AND breakdown_type = ? AND breakdown_value = ?
    LIMIT 1
  `);

  const actionStmt = db.prepare(`
    INSERT INTO meta_insight_actions (insight_id, action_type, value, action_attribution_window, raw_json)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(insight_id, action_type, action_attribution_window) DO UPDATE SET
      value=excluded.value,
      raw_json=excluded.raw_json
  `);

  let count = 0;
  const tx = db.transaction(() => {
    for (const item of normalized) {
      insertStmt.run(
        item.date_record,
        item.level,
        item.date_start,
        item.date_stop,
        item.campaign_id,
        item.adset_id,
        item.ad_id,
        item.spend,
        item.impressions,
        item.clicks,
        item.inline_link_clicks,
        item.reach,
        item.frequency,
        item.cpc,
        item.cpm,
        item.ctr,
        item.cpp,
        item.results,
        item.cost_per_result,
        item.actions,
        item.action_values,
        item.video_views,
        item.breakdown_type,
        item.breakdown_value,
        item.dimensions_json,
        item.dimensions_json_hash,
        item.purchase_roas_json,
        item.video_metrics_json,
        item.request_id,
        item.sync_run_id,
        item.raw_json
      );

      count++;

      // Save normalized actions if present
      if (Array.isArray(item.raw_actions) && item.raw_actions.length > 0) {
        const row = selectInsightIdStmt.get(
          item.date_record,
          item.campaign_id,
          item.adset_id,
          item.ad_id,
          item.breakdown_type,
          item.breakdown_value
        ) as { id: number } | undefined;

        if (row?.id) {
          for (const act of item.raw_actions) {
            if (!act || !act.action_type) continue;
            actionStmt.run(
              row.id,
              String(act.action_type),
              parseFloat(String(act.value || '0')),
              act._window || '',
              JSON.stringify(act)
            );
          }
        }
      }
    }
  });

  tx();
  return count;
}

// Capability Management
export function upsertCapabilities(accountId: string, apiVersion: string, caps: Array<{ key: string; supported: boolean; errorCode?: string; errorMessage?: string }>) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO meta_capabilities (account_id, api_version, capability_key, supported, last_checked_at, error_code, error_message)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
    ON CONFLICT(account_id, api_version, capability_key) DO UPDATE SET
      supported=excluded.supported,
      last_checked_at=CURRENT_TIMESTAMP,
      error_code=excluded.error_code,
      error_message=excluded.error_message
  `);
  const tx = db.transaction(() => {
    for (const c of caps) {
      stmt.run(
        accountId,
        apiVersion,
        c.key,
        c.supported ? 1 : 0,
        c.errorCode || null,
        c.errorMessage || null
      );
    }
  });
  tx();
}

export function getCapabilities(accountId: string): MetaCapabilityRow[] {
  const db = getDb();
  return db.prepare('SELECT * FROM meta_capabilities WHERE account_id = ? ORDER BY capability_key ASC').all(accountId) as MetaCapabilityRow[];
}

// Sync Run & Sync Error Management
export function createSyncRun(scope: string, since?: string, until?: string): number {
  const db = getDb();
  const res = db.prepare(`
    INSERT INTO meta_sync_runs (scope, since, until, status, started_at)
    VALUES (?, ?, ?, 'running', CURRENT_TIMESTAMP)
  `).run(scope, since || null, until || null);
  return Number(res.lastInsertRowid);
}

export function finishSyncRun(id: number, status: 'success' | 'failed' | 'partial', recordsSynced: number, requestCount: number, rateLimitCount: number, errorJson?: any) {
  const db = getDb();
  db.prepare(`
    UPDATE meta_sync_runs
    SET status = ?, records_synced = ?, request_count = ?, rate_limit_count = ?, finished_at = CURRENT_TIMESTAMP, error_json = ?
    WHERE id = ?
  `).run(status, recordsSynced, requestCount, rateLimitCount, errorJson ? JSON.stringify(errorJson) : null, id);
}

export function logSyncError(runId: number, endpoint: string, fieldSet: string, status: number, errCode: string, errMsg: string, retryable = false) {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO meta_sync_errors (sync_run_id, endpoint, field_set, http_status, error_code, error_message, retryable)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(runId, endpoint, fieldSet, status, errCode, errMsg, retryable ? 1 : 0);
  } catch {}
}

export function getSyncRuns(limit = 20): MetaSyncRunRow[] {
  const db = getDb();
  return db.prepare('SELECT * FROM meta_sync_runs ORDER BY started_at DESC LIMIT ?').all(limit) as MetaSyncRunRow[];
}

export function getSyncErrors(runId?: number, limit = 50): MetaSyncErrorRow[] {
  const db = getDb();
  if (runId) {
    return db.prepare('SELECT * FROM meta_sync_errors WHERE sync_run_id = ? ORDER BY created_at DESC LIMIT ?').all(runId, limit) as MetaSyncErrorRow[];
  }
  return db.prepare('SELECT * FROM meta_sync_errors ORDER BY created_at DESC LIMIT ?').all(limit) as MetaSyncErrorRow[];
}

// Object History Management
export function logObjectHistory(objectType: string, objectId: string, status?: string, budget?: number, source = 'system', rawJson?: any) {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO meta_object_history (object_type, object_id, status, budget, source, raw_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(objectType, objectId, status || null, budget || null, source, rawJson ? JSON.stringify(rawJson) : null);
  } catch {}
}

export function getObjectHistory(objectType: string, objectId: string) {
  const db = getDb();
  return db.prepare('SELECT * FROM meta_object_history WHERE object_type = ? AND object_id = ? ORDER BY effective_from DESC').all(objectType, objectId);
}

// Data Explorer Query Functions
export function getExplorerObjects(type: 'account' | 'campaign' | 'adset' | 'ad' | 'creative', params: { search?: string; status?: string; campaignId?: string; adsetId?: string; limit?: number; offset?: number }) {
  const db = getDb();
  const limit = params.limit || 50;
  const offset = params.offset || 0;
  const queryParams: any[] = [];

  let sql = '';
  if (type === 'account') {
    sql = 'SELECT * FROM meta_accounts WHERE 1=1';
    if (params.search) { sql += ' AND (id LIKE ? OR name LIKE ?)'; queryParams.push(`%${params.search}%`, `%${params.search}%`); }
    sql += ' ORDER BY synced_at DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);
  } else if (type === 'campaign') {
    sql = 'SELECT * FROM meta_campaigns WHERE 1=1';
    if (params.search) { sql += ' AND (id LIKE ? OR name LIKE ?)'; queryParams.push(`%${params.search}%`, `%${params.search}%`); }
    if (params.status) { sql += ' AND status = ?'; queryParams.push(params.status); }
    sql += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);
  } else if (type === 'adset') {
    sql = 'SELECT * FROM meta_adsets WHERE 1=1';
    if (params.search) { sql += ' AND (id LIKE ? OR name LIKE ?)'; queryParams.push(`%${params.search}%`, `%${params.search}%`); }
    if (params.status) { sql += ' AND status = ?'; queryParams.push(params.status); }
    if (params.campaignId) { sql += ' AND campaign_id = ?'; queryParams.push(params.campaignId); }
    sql += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);
  } else if (type === 'ad') {
    sql = 'SELECT * FROM meta_ads WHERE 1=1';
    if (params.search) { sql += ' AND (id LIKE ? OR name LIKE ?)'; queryParams.push(`%${params.search}%`, `%${params.search}%`); }
    if (params.status) { sql += ' AND status = ?'; queryParams.push(params.status); }
    if (params.campaignId) { sql += ' AND campaign_id = ?'; queryParams.push(params.campaignId); }
    if (params.adsetId) { sql += ' AND adset_id = ?'; queryParams.push(params.adsetId); }
    sql += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);
  } else if (type === 'creative') {
    sql = 'SELECT * FROM meta_creatives WHERE 1=1';
    if (params.search) { sql += ' AND (id LIKE ? OR title LIKE ? OR body LIKE ?)'; queryParams.push(`%${params.search}%`, `%${params.search}%`, `%${params.search}%`); }
    if (params.campaignId) { sql += ' AND campaign_id = ?'; queryParams.push(params.campaignId); }
    sql += ' ORDER BY synced_at DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);
  }

  const rows = db.prepare(sql).all(...queryParams);
  return { type, data: rows, limit, offset };
}

export function getExplorerInsights(params: { level?: string; campaignId?: string; adsetId?: string; adId?: string; startDate?: string; endDate?: string; breakdownType?: string; search?: string; limit?: number; offset?: number }) {
  const db = getDb();
  const limit = params.limit || 50;
  const offset = params.offset || 0;
  const queryParams: any[] = [];

  let sql = 'SELECT * FROM meta_insights_daily WHERE 1=1';
  if (params.level) {
    sql += ' AND level = ?';
    queryParams.push(params.level);
  }
  if (params.campaignId) { sql += ' AND campaign_id = ?'; queryParams.push(params.campaignId); }
  if (params.adsetId) { sql += ' AND adset_id = ?'; queryParams.push(params.adsetId); }
  if (params.adId) { sql += ' AND ad_id = ?'; queryParams.push(params.adId); }
  if (params.startDate) { sql += ' AND date_record >= ?'; queryParams.push(params.startDate); }
  if (params.endDate) { sql += ' AND date_record <= ?'; queryParams.push(params.endDate); }
  if (params.breakdownType !== undefined) {
    if (params.breakdownType === '') {
      sql += ' AND breakdown_type = ""';
    } else {
      sql += ' AND breakdown_type = ?';
      queryParams.push(params.breakdownType);
    }
  }
  if (params.search) {
    sql += ' AND (campaign_id LIKE ? OR adset_id LIKE ? OR ad_id LIKE ? OR breakdown_value LIKE ?)';
    queryParams.push(`%${params.search}%`, `%${params.search}%`, `%${params.search}%`, `%${params.search}%`);
  }

  sql += ' ORDER BY date_record DESC, spend DESC LIMIT ? OFFSET ?';
  queryParams.push(limit, offset);

  const rows = db.prepare(sql).all(...queryParams);
  return { data: rows, limit, offset };
}

export function getExplorerActions(params: { startDate?: string; endDate?: string; actionType?: string; limit?: number; offset?: number }) {
  const db = getDb();
  const limit = params.limit || 50;
  const offset = params.offset || 0;
  const queryParams: any[] = [];

  let sql = `
    SELECT act.*, i.date_record, i.level, i.campaign_id, i.adset_id, i.ad_id
    FROM meta_insight_actions act
    JOIN meta_insights_daily i ON act.insight_id = i.id
    WHERE 1=1
  `;

  if (params.startDate) { sql += ' AND i.date_record >= ?'; queryParams.push(params.startDate); }
  if (params.endDate) { sql += ' AND i.date_record <= ?'; queryParams.push(params.endDate); }
  if (params.actionType) { sql += ' AND act.action_type = ?'; queryParams.push(params.actionType); }

  sql += ' ORDER BY i.date_record DESC, act.value DESC LIMIT ? OFFSET ?';
  queryParams.push(limit, offset);

  const rows = db.prepare(sql).all(...queryParams);
  return { data: rows, limit, offset };
}

export function getExplorerBreakdowns(params: { breakdownType?: string; startDate?: string; endDate?: string; limit?: number; offset?: number }) {
  const db = getDb();
  const limit = params.limit || 50;
  const offset = params.offset || 0;
  const queryParams: any[] = [];

  let sql = `
    SELECT breakdown_type, breakdown_value, dimensions_json,
      COALESCE(SUM(spend), 0) as total_spend,
      COALESCE(SUM(impressions), 0) as total_impressions,
      COALESCE(SUM(inline_link_clicks), 0) as total_clicks,
      COALESCE(AVG(cpc), 0) as avg_cpc,
      COALESCE(AVG(ctr), 0) as avg_ctr,
      COUNT(*) as row_count
    FROM meta_insights_daily
    WHERE breakdown_type != ""
  `;

  if (params.breakdownType) { sql += ' AND breakdown_type = ?'; queryParams.push(params.breakdownType); }
  if (params.startDate) { sql += ' AND date_record >= ?'; queryParams.push(params.startDate); }
  if (params.endDate) { sql += ' AND date_record <= ?'; queryParams.push(params.endDate); }

  sql += ' GROUP BY breakdown_type, breakdown_value ORDER BY total_spend DESC LIMIT ? OFFSET ?';
  queryParams.push(limit, offset);

  const rows = db.prepare(sql).all(...queryParams);
  return { data: rows, limit, offset };
}

export function getRawPayload(objectType: 'account' | 'campaign' | 'adset' | 'ad' | 'creative' | 'insight', id: string) {
  const db = getDb();
  let row: any = null;
  if (objectType === 'account') {
    row = db.prepare('SELECT id, raw_json, synced_at FROM meta_accounts WHERE id = ?').get(id);
  } else if (objectType === 'campaign') {
    row = db.prepare('SELECT id, name, raw_json, synced_at FROM meta_campaigns WHERE id = ?').get(id);
  } else if (objectType === 'adset') {
    row = db.prepare('SELECT id, name, raw_json, synced_at FROM meta_adsets WHERE id = ?').get(id);
  } else if (objectType === 'ad') {
    row = db.prepare('SELECT id, name, raw_json, synced_at FROM meta_ads WHERE id = ?').get(id);
  } else if (objectType === 'creative') {
    row = db.prepare('SELECT id, title, raw_json, synced_at FROM meta_creatives WHERE id = ?').get(id);
  } else if (objectType === 'insight') {
    row = db.prepare('SELECT id, date_record, level, campaign_id, ad_id, raw_json, updated_at FROM meta_insights_daily WHERE id = ?').get(id);
  }

  if (!row) return null;
  let parsed = null;
  try {
    parsed = row.raw_json ? JSON.parse(row.raw_json) : null;
  } catch {}
  return { ...row, raw_parsed: parsed };
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
      WHERE COALESCE(campaign_id, '') != ''
        AND COALESCE(adset_id, '') = ''
        AND COALESCE(ad_id, '') = ''
        AND COALESCE(breakdown_type, '') = ''
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
        let sql = `SELECT COALESCE(SUM(spend),0) as spend, COALESCE(SUM(impressions),0) as impressions, COALESCE(SUM(inline_link_clicks),0) as clicks FROM meta_insights_daily WHERE campaign_id = ? AND COALESCE(adset_id, '') = '' AND COALESCE(ad_id, '') = '' AND COALESCE(breakdown_type, '') = ''`;
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

