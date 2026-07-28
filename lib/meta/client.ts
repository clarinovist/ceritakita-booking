import 'server-only';
import { logger } from '@/lib/logger';

export interface MetaConfig {
  accessToken: string;
  adAccountId: string;
  pixelId?: string;
  apiVersion: string;
}

export interface MetaApiError {
  message: string;
  code?: number;
  subcode?: number;
  type?: string;
  fbtrace_id?: string;
}

export class MetaApiException extends Error {
  code?: number;
  subcode?: number;
  status: number;
  constructor(message: string, status: number, code?: number, subcode?: number) {
    super(message);
    this.name = 'MetaApiException';
    this.status = status;
    this.code = code;
    this.subcode = subcode;
  }
}

export function getMetaConfig(): MetaConfig {
  const accessToken = process.env.META_ACCESS_TOKEN_CK || process.env.META_ACCESS_TOKEN || '';
  const adAccountId = process.env.META_AD_ACCOUNT_ID || process.env.META_CAMPAIGN_ID?.startsWith('act_') ? process.env.META_CAMPAIGN_ID! : '';
  const pixelId = process.env.META_PIXEL_ID || '';
  const apiVersion = process.env.META_API_VERSION || 'v19.0';
  // adAccountId may be stored with act_ prefix already
  const normalizedAccountId = process.env.META_AD_ACCOUNT_ID || '';
  return {
    accessToken,
    adAccountId: normalizedAccountId || adAccountId,
    pixelId,
    apiVersion,
  };
}

export function requireMetaConfig(): MetaConfig {
  const cfg = getMetaConfig();
  if (!cfg.accessToken) throw new Error('META_ACCESS_TOKEN missing');
  if (!cfg.adAccountId) throw new Error('META_AD_ACCOUNT_ID missing');
  return cfg;
}

const RATE_LIMIT_CODES = new Set([4, 17, 80004, 80005]);

export async function metaGraphFetch<T = any>(
  path: string,
  params: Record<string, any> = {},
  method: 'GET' | 'POST' = 'GET',
  retries = 2
): Promise<{ data: T; headers: Headers; raw: any }> {
  const cfg = requireMetaConfig();
  const base = `https://graph.facebook.com/${cfg.apiVersion}/${path.replace(/^\//, '')}`;

  const buildUrl = () => {
    const url = new URL(base);
    const qp = new URLSearchParams();
    qp.set('access_token', cfg.accessToken);
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      if (typeof v === 'object') qp.set(k, JSON.stringify(v));
      else qp.set(k, String(v));
    }
    // only append query for GET
    if (method === 'GET') url.search = qp.toString();
    return { url: url.toString(), qp };
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { url, qp } = buildUrl();
      const fetchUrl = method === 'GET' ? url : base;
      const fetchOpts: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (method === 'POST') {
        const body: Record<string, any> = {};
        qp.forEach((v: string, k: string) => { body[k] = v; });
        for (const [k, v] of Object.entries(params)) {
          if (v === undefined) continue;
          body[k] = typeof v === 'object' ? JSON.stringify(v) : v;
        }
        fetchOpts.body = JSON.stringify(body);
      }

      const res = await fetch(fetchUrl, fetchOpts);

      const raw = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errObj = (raw as any)?.error || {};
        const msg = errObj.message || `Meta API error ${res.status}`;
        const code = errObj.code;
        const subcode = errObj.error_subcode;
        if (RATE_LIMIT_CODES.has(code) && attempt < retries) {
          const backoff = 1000 * Math.pow(2, attempt) + Math.random() * 500;
          logger.warn('Meta API rate limited, retrying', { code, attempt, backoffMs: Math.round(backoff) });
          await new Promise((r) => setTimeout(r, backoff));
          continue;
        }
        throw new MetaApiException(msg, res.status, code, subcode);
      }
      return { data: (raw as any).data ?? raw, headers: res.headers, raw };
    } catch (e) {
      if (e instanceof MetaApiException) throw e;
      if (attempt === retries) throw e;
      const backoff = 500 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw new Error('metaGraphFetch exhausted retries');
}

export interface MetaPaging {
  cursors?: { before: string; after: string };
  next?: string;
  previous?: string;
}

export async function metaGraphFetchAll<T = any>(path: string, params: Record<string, any> = {}, limit = 500): Promise<T[]> {
  const all: T[] = [];
  let after: string | undefined;
  const perPage = params.limit || 100;
  do {
    const p: Record<string, any> = { ...params, limit: perPage };
    if (after) p.after = after;
    try {
      const { raw } = await metaGraphFetch(path, p, 'GET', 1);
      const chunk = (raw as any).data;
      if (Array.isArray(chunk)) all.push(...chunk);
      else if (chunk) all.push(chunk);
      const paging: MetaPaging | undefined = (raw as any).paging;
      after = paging?.cursors?.after;
      if (!paging?.next) after = undefined;
      if (all.length >= limit) break;
    } catch (e) {
      // if first page fails, throw; otherwise return what we have
      if (all.length === 0) throw e;
      break;
    }
  } while (after);
  return all;
}

// Typed helpers
export interface AccountRow {
  id: string;
  name: string;
  account_status?: number | string;
  currency?: string;
  timezone_name?: string;
  timezone_offset_hours_utc?: number;
  business?: any;
  spend_cap?: number | string;
  amount_spent?: number | string;
  balance?: number | string;
  [k: string]: any;
}

export interface CreativeRow {
  id: string;
  name?: string;
  title?: string;
  body?: string;
  call_to_action_type?: string;
  thumbnail_url?: string;
  image_url?: string;
  object_story_spec?: any;
  asset_feed_spec?: any;
  [k: string]: any;
}

export interface CampaignRow {
  id: string;
  name: string;
  status: string;
  objective?: string;
  daily_budget?: string | number;
  lifetime_budget?: string | number;
  bid_strategy?: string;
  created_time?: string;
  updated_time?: string;
  [k: string]: any;
}

export interface AdSetRow {
  id: string;
  campaign_id: string;
  name: string;
  status: string;
  daily_budget?: string | number;
  lifetime_budget?: string | number;
  bid_amount?: string | number;
  targeting?: any;
  optimization_goal?: string;
  billing_event?: string;
  created_time?: string;
  updated_time?: string;
  [k: string]: any;
}

export interface AdRow {
  id: string;
  adset_id: string;
  campaign_id: string;
  name: string;
  status: string;
  creative?: { id: string; [k: string]: any };
  tracking_specs?: any;
  created_time?: string;
  updated_time?: string;
  [k: string]: any;
}

export async function getAdAccount(fields?: string[]): Promise<AccountRow> {
  const cfg = requireMetaConfig();
  const f = fields || ['id', 'name', 'account_status', 'currency', 'timezone_name', 'timezone_offset_hours_utc', 'business', 'spend_cap', 'amount_spent', 'balance', 'created_time'];
  const { data } = await metaGraphFetch<AccountRow>(cfg.adAccountId, { fields: f.join(',') }, 'GET');
  return data;
}

export async function listCampaigns(fields?: string[]): Promise<CampaignRow[]> {
  const cfg = requireMetaConfig();
  const f = fields || ['id', 'name', 'status', 'objective', 'daily_budget', 'lifetime_budget', 'bid_strategy', 'buying_type', 'special_ad_categories', 'created_time', 'updated_time'];
  const path = `${cfg.adAccountId}/campaigns`;
  return metaGraphFetchAll<CampaignRow>(path, { fields: f.join(','), limit: 100 }, 1000);
}

export async function listAdSets(campaignId?: string, fields?: string[]): Promise<AdSetRow[]> {
  const cfg = requireMetaConfig();
  const f = fields || ['id', 'campaign_id', 'name', 'status', 'daily_budget', 'lifetime_budget', 'bid_amount', 'targeting', 'optimization_goal', 'billing_event', 'created_time', 'updated_time'];
  const path = campaignId ? `${campaignId}/adsets` : `${cfg.adAccountId}/adsets`;
  return metaGraphFetchAll<AdSetRow>(path, { fields: f.join(','), limit: 100 }, 2000);
}

export async function listAds(adsetId?: string, campaignId?: string, fields?: string[]): Promise<AdRow[]> {
  const cfg = requireMetaConfig();
  const f = fields || ['id', 'adset_id', 'campaign_id', 'name', 'status', 'creative', 'tracking_specs', 'created_time', 'updated_time'];
  let path: string;
  if (adsetId) path = `${adsetId}/ads`;
  else if (campaignId) path = `${campaignId}/ads`;
  else path = `${cfg.adAccountId}/ads`;
  return metaGraphFetchAll<AdRow>(path, { fields: f.join(','), limit: 100 }, 5000);
}

export async function listCreatives(fields?: string[]): Promise<CreativeRow[]> {
  const cfg = requireMetaConfig();
  const f = fields || ['id', 'name', 'title', 'body', 'call_to_action_type', 'thumbnail_url', 'image_url', 'object_story_spec', 'asset_feed_spec', 'status'];
  const path = `${cfg.adAccountId}/adcreatives`;
  try {
    return await metaGraphFetchAll<CreativeRow>(path, { fields: f.join(','), limit: 100 }, 2000);
  } catch (e) {
    logger.warn('listCreatives failed (non-critical)', { error: (e as Error).message });
    return [];
  }
}

export async function getAccountActivities(limit = 100): Promise<any[]> {
  const cfg = requireMetaConfig();
  const path = `${cfg.adAccountId}/activities`;
  try {
    return await metaGraphFetchAll(path, { fields: 'event_time,event_type,extra_data,object_id,object_name', limit }, limit);
  } catch (e) {
    logger.warn('getAccountActivities failed', { error: (e as Error).message });
    return [];
  }
}

export interface InsightsParams {
  level?: 'account' | 'campaign' | 'adset' | 'ad';
  time_range?: { since: string; until: string };
  date_preset?: string;
  time_increment?: number | string;
  breakdowns?: string[];
  fields?: string[];
  filtering?: any[];
  limit?: number;
}

// default fields covering all useful metrics
export const DEFAULT_INSIGHT_FIELDS = [
  'campaign_id', 'campaign_name',
  'adset_id', 'adset_name',
  'ad_id', 'ad_name',
  'spend', 'impressions', 'clicks', 'inline_link_clicks', 'reach', 'frequency',
  'cpc', 'cpm', 'ctr', 'cpp',
  'results', 'cost_per_result',
  'actions', 'action_values',
  'video_p25_watched_actions', 'video_p50_watched_actions', 'video_p75_watched_actions', 'video_p100_watched_actions',
  'purchase_roas',
  'date_start', 'date_stop',
];

export async function getInsights(params: InsightsParams): Promise<any[]> {
  const cfg = requireMetaConfig();
  const p: Record<string, any> = {
    level: params.level || 'campaign',
    fields: (params.fields || DEFAULT_INSIGHT_FIELDS).join(','),
    limit: params.limit || 500,
  };
  if (params.time_range) p.time_range = params.time_range;
  if (params.date_preset) p.date_preset = params.date_preset;
  if (params.time_increment) p.time_increment = params.time_increment;
  if (params.breakdowns?.length) p.breakdowns = params.breakdowns.join(',');
  if (params.filtering) p.filtering = params.filtering;

  const path = `${cfg.adAccountId}/insights`;
  return metaGraphFetchAll(path, p, 5000);
}

export interface CapabilityCheckResult {
  key: string;
  supported: boolean;
  errorCode?: string;
  errorMessage?: string;
}

export async function probeCapabilities(): Promise<CapabilityCheckResult[]> {
  const cfg = requireMetaConfig();
  const checks: Array<{ key: string; fn: () => Promise<any> }> = [
    { key: 'account_read', fn: () => getAdAccount(['id', 'name']) },
    { key: 'campaigns_read', fn: () => metaGraphFetch(`${cfg.adAccountId}/campaigns`, { limit: 1 }) },
    { key: 'adsets_read', fn: () => metaGraphFetch(`${cfg.adAccountId}/adsets`, { limit: 1 }) },
    { key: 'ads_read', fn: () => metaGraphFetch(`${cfg.adAccountId}/ads`, { limit: 1 }) },
    { key: 'creatives_read', fn: () => metaGraphFetch(`${cfg.adAccountId}/adcreatives`, { limit: 1 }) },
    { key: 'insights_read', fn: () => metaGraphFetch(`${cfg.adAccountId}/insights`, { level: 'campaign', date_preset: 'today', limit: 1 }) },
    { key: 'insights_breakdown_demographic', fn: () => metaGraphFetch(`${cfg.adAccountId}/insights`, { level: 'campaign', breakdowns: 'age,gender', date_preset: 'today', limit: 1 }) },
    { key: 'insights_breakdown_placement', fn: () => metaGraphFetch(`${cfg.adAccountId}/insights`, { level: 'campaign', breakdowns: 'publisher_platform,platform_position', date_preset: 'today', limit: 1 }) },
    { key: 'insights_breakdown_geographic', fn: () => metaGraphFetch(`${cfg.adAccountId}/insights`, { level: 'campaign', breakdowns: 'country,region', date_preset: 'today', limit: 1 }) },
    { key: 'activities_read', fn: () => metaGraphFetch(`${cfg.adAccountId}/activities`, { limit: 1 }) },
  ];

  const results: CapabilityCheckResult[] = [];
  for (const check of checks) {
    try {
      await check.fn();
      results.push({ key: check.key, supported: true });
    } catch (e: any) {
      results.push({
        key: check.key,
        supported: false,
        errorCode: String(e.code || e.status || 'ERROR'),
        errorMessage: e.message || String(e),
      });
    }
  }
  return results;
}

// Management (write)
export async function updateCampaign(id: string, payload: Record<string, any>): Promise<any> {
  const { raw } = await metaGraphFetch(id, payload, 'POST');
  return raw;
}
export async function updateAdSet(id: string, payload: Record<string, any>): Promise<any> {
  const { raw } = await metaGraphFetch(id, payload, 'POST');
  return raw;
}
export async function updateAd(id: string, payload: Record<string, any>): Promise<any> {
  const { raw } = await metaGraphFetch(id, payload, 'POST');
  return raw;
}

