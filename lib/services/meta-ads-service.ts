import 'server-only';
import { getMetaConfig, requireMetaConfig, listCampaigns, listAdSets, listAds, getInsights, DEFAULT_INSIGHT_FIELDS } from '@/lib/meta/client';
import * as metaRepo from '@/lib/repositories/meta-ads';
import { logger } from '@/lib/logger';

export interface SyncResult {
  syncId: number;
  campaigns: number;
  adsets: number;
  ads: number;
  insights: number;
  errors: string[];
  durationMs: number;
}

function dateStr(d: Date): string {
  return d.toISOString().split('T')[0]!;
}

export async function syncCampaignsOnly(): Promise<number> {
  const cfg = requireMetaConfig();
  const campaigns = await listCampaigns();
  return metaRepo.upsertCampaigns(campaigns, cfg.adAccountId);
}

export async function syncAdSetsOnly(campaignId?: string): Promise<number> {
  const adsets = await listAdSets(campaignId);
  return metaRepo.upsertAdSets(adsets);
}

export async function syncAdsOnly(opts?: { campaignId?: string; adsetId?: string }): Promise<number> {
  const ads = await listAds(opts?.adsetId, opts?.campaignId);
  return metaRepo.upsertAds(ads);
}

export async function syncInsightsRange(since: string, until: string, level: 'account' | 'campaign' | 'adset' | 'ad' = 'campaign'): Promise<number> {
  // single request with time_increment=1 for daily granularity
  const rows = await getInsights({
    level,
    time_range: { since, until },
    time_increment: 1,
    fields: DEFAULT_INSIGHT_FIELDS,
    limit: 500,
  });
  // rows is array of insight objects
  return metaRepo.upsertInsightsBatch(rows);
}

export async function syncAll(days = 30, full = false): Promise<SyncResult> {
  const start = Date.now();
  const cfg = requireMetaConfig();
  const syncId = metaRepo.createSyncLog(full ? 'full' : 'incremental');
  const errors: string[] = [];
  let campaignsCount = 0, adsetsCount = 0, adsCount = 0, insightsCount = 0;

  const now = new Date();
  const until = dateStr(now);
  const sinceDate = new Date(now);
  sinceDate.setDate(now.getDate() - (days - 1));
  const since = dateStr(sinceDate);

  try {
    logger.info('Meta sync started', { syncId, days, since, until, full });

    // 1. campaigns
    try {
      const campaigns = await listCampaigns();
      campaignsCount = metaRepo.upsertCampaigns(campaigns, cfg.adAccountId);
      logger.info('Synced campaigns', { count: campaignsCount });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`campaigns: ${msg}`);
      logger.error('Failed sync campaigns', {}, e as Error);
    }

    // 2. adsets
    try {
      const adsets = await listAdSets();
      adsetsCount = metaRepo.upsertAdSets(adsets);
      logger.info('Synced adsets', { count: adsetsCount });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`adsets: ${msg}`);
      logger.error('Failed sync adsets', {}, e as Error);
    }

    // 3. ads
    try {
      const ads = await listAds();
      adsCount = metaRepo.upsertAds(ads);
      logger.info('Synced ads', { count: adsCount });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`ads: ${msg}`);
      logger.error('Failed sync ads', {}, e as Error);
    }

    // 4. insights campaign level (daily)
    try {
      const rows = await getInsights({
        level: 'campaign',
        time_range: { since, until },
        time_increment: 1,
        fields: DEFAULT_INSIGHT_FIELDS,
        limit: 500,
      });
      const c = metaRepo.upsertInsightsBatch(rows);
      insightsCount += c;
      logger.info('Synced insights campaign level', { count: c, range: `${since}..${until}` });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`insights campaign: ${msg}`);
      logger.error('Failed sync insights campaign', {}, e as Error);
    }

    // 5. insights ad level only if full or ad count reasonable (<200) to avoid rate limit
    if (full || adsCount < 200) {
      try {
        // only active ads for ad-level insights to reduce calls – but our client fetches all days in 1 call, so it's still 1 call
        const rowsAd = await getInsights({
          level: 'ad',
          time_range: { since, until },
          time_increment: 1,
          fields: DEFAULT_INSIGHT_FIELDS,
          limit: 500,
        });
        const c2 = metaRepo.upsertInsightsBatch(rowsAd);
        insightsCount += c2;
        logger.info('Synced insights ad level', { count: c2 });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        // ad level errors are non-fatal
        errors.push(`insights ad: ${msg}`);
        logger.warn('Failed sync insights ad level (non-fatal)', { error: msg });
      }
    }

    // 6. Auto backfill attribution links (non-blocking)
    try {
      const { backfillAttribution } = await import('./attribution-service');
      const bf = backfillAttribution();
      logger.info('Post-sync attribution backfill', bf);
    } catch (e: any) {
      logger.warn('Post-sync attribution backfill failed (non-critical)', { error: e.message });
    }

    const total = campaignsCount + adsetsCount + adsCount + insightsCount;
    metaRepo.finishSyncLog(syncId, errors.length === 0 ? 'success' : 'success', total, errors.length ? errors.join('; ') : undefined);
    logger.info('Meta sync completed', { syncId, campaigns: campaignsCount, adsets: adsetsCount, ads: adsCount, insights: insightsCount, errors: errors.length });

    return { syncId, campaigns: campaignsCount, adsets: adsetsCount, ads: adsCount, insights: insightsCount, errors, durationMs: Date.now() - start };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    metaRepo.finishSyncLog(syncId, 'failed', 0, msg);
    logger.error('Meta sync fatal error', {}, e as Error);
    throw e;
  }
}

export async function checkTokenHealth() {
  const cfg = getMetaConfig();
  if (!cfg.accessToken) return { valid: false, error: 'META_ACCESS_TOKEN missing' };
  try {
    // hit /me and /debug_token equivalent via /me/permissions
    const base = `https://graph.facebook.com/${cfg.apiVersion}/me`;
    const url = `${base}?access_token=${encodeURIComponent(cfg.accessToken)}&fields=id,name`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) {
      return { valid: false, error: data?.error?.message || `HTTP ${res.status}`, code: data?.error?.code };
    }
    // try account readable
    let accountOk = false;
    let accountError: string | undefined;
    if (cfg.adAccountId) {
      try {
        const acctUrl = `https://graph.facebook.com/${cfg.apiVersion}/${cfg.adAccountId}?access_token=${encodeURIComponent(cfg.accessToken)}&fields=id,name,account_status`;
        const acctRes = await fetch(acctUrl);
        const acctData = await acctRes.json();
        if (acctRes.ok) accountOk = true;
        else accountError = acctData?.error?.message;
      } catch {
        accountError = 'account check failed';
      }
    }

    return {
      valid: true,
      user: data,
      accountOk,
      accountError,
      tokenPreview: cfg.accessToken.slice(-10),
      adAccountId: cfg.adAccountId,
    };
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : String(e) };
  }
}
