import 'server-only';
import {
  getMetaConfig,
  requireMetaConfig,
  getAdAccount,
  listCampaigns,
  listAdSets,
  listAds,
  listCreatives,
  getInsights,
  probeCapabilities,
  DEFAULT_INSIGHT_FIELDS,
} from '@/lib/meta/client';
import * as metaRepo from '@/lib/repositories/meta-ads';
import { logger } from '@/lib/logger';

export interface SyncResult {
  syncId: number;
  syncRunId?: number;
  scopes: string[];
  account: boolean;
  campaigns: number;
  adsets: number;
  ads: number;
  creatives: number;
  insights: number;
  breakdownsCount: number;
  capabilitiesCount: number;
  errors: string[];
  durationMs: number;
}

function dateStr(d: Date): string {
  return d.toISOString().split('T')[0]!;
}

export async function syncCapabilitiesOnly(): Promise<number> {
  const cfg = requireMetaConfig();
  const caps = await probeCapabilities();
  metaRepo.upsertCapabilities(cfg.adAccountId, cfg.apiVersion, caps);
  return caps.length;
}

export async function syncAccountOnly(): Promise<boolean> {
  const acct = await getAdAccount();
  return metaRepo.upsertAccount(acct);
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

export async function syncCreativesOnly(): Promise<number> {
  const creatives = await listCreatives();
  return metaRepo.upsertCreatives(creatives);
}

export async function syncInsightsRange(
  since: string,
  until: string,
  level: 'account' | 'campaign' | 'adset' | 'ad' = 'campaign',
  syncRunId?: number
): Promise<number> {
  const rows = await getInsights({
    level,
    time_range: { since, until },
    time_increment: 1,
    fields: DEFAULT_INSIGHT_FIELDS,
    limit: 500,
  });
  return metaRepo.upsertInsightsBatch(rows, syncRunId);
}

export async function syncBreakdowns(since: string, until: string, breakdownType: string, syncRunId?: number): Promise<number> {
  const breakdownParams: Record<string, string[]> = {
    demographic: ['age', 'gender'],
    placement: ['publisher_platform', 'platform_position'],
    device: ['device_platform', 'impression_device'],
    geographic: ['country', 'region'],
  };

  const breakdowns = breakdownParams[breakdownType] || [breakdownType];
  const rows = await getInsights({
    level: 'campaign',
    time_range: { since, until },
    time_increment: 1,
    breakdowns,
    fields: DEFAULT_INSIGHT_FIELDS,
    limit: 500,
  });

  const formattedRows = rows.map((r) => {
    const dims: Record<string, any> = {};
    for (const b of breakdowns) {
      if (r[b] !== undefined) dims[b] = r[b];
    }
    return {
      ...r,
      breakdown_type: breakdownType,
      breakdown_value: Object.values(dims).join(' / '),
      dimensions: dims,
    };
  });

  return metaRepo.upsertInsightsBatch(formattedRows, syncRunId);
}

export async function syncAll(days = 30, full = false, requestedScopes?: string[]): Promise<SyncResult> {
  const start = Date.now();
  const cfg = requireMetaConfig();

  const activeScopes = requestedScopes?.length
    ? requestedScopes
    : full
    ? ['capabilities', 'account', 'objects', 'creatives', 'insights:campaign', 'insights:adset', 'insights:ad', 'breakdowns']
    : ['capabilities', 'account', 'objects', 'creatives', 'insights:campaign'];

  const now = new Date();
  const until = dateStr(now);
  const sinceDate = new Date(now);
  sinceDate.setDate(now.getDate() - (days - 1));
  const since = dateStr(sinceDate);

  const syncRunId = metaRepo.createSyncRun(activeScopes.join(','), since, until);
  const syncLogId = metaRepo.createSyncLog(full ? 'full' : 'incremental');

  const errors: string[] = [];
  let accountSynced = false;
  let campaignsCount = 0;
  let adsetsCount = 0;
  let adsCount = 0;
  let creativesCount = 0;
  let insightsCount = 0;
  let breakdownsCount = 0;
  let capabilitiesCount = 0;

  logger.info('Meta sync started', { syncRunId, syncLogId, days, since, until, full, scopes: activeScopes });

  try {
    // 0. Capabilities
    if (activeScopes.includes('capabilities') || activeScopes.includes('all')) {
      try {
        capabilitiesCount = await syncCapabilitiesOnly();
        logger.info('Synced capabilities', { count: capabilitiesCount });
      } catch (e: any) {
        errors.push(`capabilities: ${e.message}`);
        metaRepo.logSyncError(syncRunId, 'capabilities', 'matrix', 500, 'CAP_FAIL', e.message);
      }
    }

    // 1. Account
    if (activeScopes.includes('account') || activeScopes.includes('all')) {
      try {
        accountSynced = await syncAccountOnly();
        logger.info('Synced account details', { ok: accountSynced });
      } catch (e: any) {
        errors.push(`account: ${e.message}`);
        metaRepo.logSyncError(syncRunId, `${cfg.adAccountId}`, 'account', 500, 'ACCT_FAIL', e.message);
      }
    }

    // 2. Objects (campaigns, adsets, ads)
    if (activeScopes.includes('objects') || activeScopes.includes('all')) {
      try {
        const campaigns = await listCampaigns();
        campaignsCount = metaRepo.upsertCampaigns(campaigns, cfg.adAccountId);
        logger.info('Synced campaigns', { count: campaignsCount });
      } catch (e: any) {
        errors.push(`campaigns: ${e.message}`);
        metaRepo.logSyncError(syncRunId, 'campaigns', 'list', 500, 'CAMP_FAIL', e.message);
      }

      try {
        const adsets = await listAdSets();
        adsetsCount = metaRepo.upsertAdSets(adsets);
        logger.info('Synced adsets', { count: adsetsCount });
      } catch (e: any) {
        errors.push(`adsets: ${e.message}`);
        metaRepo.logSyncError(syncRunId, 'adsets', 'list', 500, 'ADSET_FAIL', e.message);
      }

      try {
        const ads = await listAds();
        adsCount = metaRepo.upsertAds(ads);
        logger.info('Synced ads', { count: adsCount });
      } catch (e: any) {
        errors.push(`ads: ${e.message}`);
        metaRepo.logSyncError(syncRunId, 'ads', 'list', 500, 'ADS_FAIL', e.message);
      }
    }

    // 3. Creatives
    if (activeScopes.includes('creatives') || activeScopes.includes('all')) {
      try {
        creativesCount = await syncCreativesOnly();
        logger.info('Synced creatives', { count: creativesCount });
      } catch (e: any) {
        errors.push(`creatives: ${e.message}`);
        metaRepo.logSyncError(syncRunId, 'adcreatives', 'list', 500, 'CREATIVE_FAIL', e.message);
      }
    }

    // 4. Insights Campaign Level
    if (activeScopes.includes('insights:campaign') || activeScopes.includes('insights') || activeScopes.includes('all')) {
      try {
        const c = await syncInsightsRange(since, until, 'campaign', syncRunId);
        insightsCount += c;
        logger.info('Synced campaign insights', { count: c, range: `${since}..${until}` });
      } catch (e: any) {
        errors.push(`insights campaign: ${e.message}`);
        metaRepo.logSyncError(syncRunId, 'insights', 'level=campaign', 500, 'INSIGHT_CAMP_FAIL', e.message);
      }
    }

    // 5. Insights Adset Level
    if (activeScopes.includes('insights:adset') || activeScopes.includes('all')) {
      try {
        const c = await syncInsightsRange(since, until, 'adset', syncRunId);
        insightsCount += c;
        logger.info('Synced adset insights', { count: c });
      } catch (e: any) {
        errors.push(`insights adset: ${e.message}`);
        metaRepo.logSyncError(syncRunId, 'insights', 'level=adset', 500, 'INSIGHT_ADSET_FAIL', e.message);
      }
    }

    // 6. Insights Ad Level
    if (activeScopes.includes('insights:ad') || activeScopes.includes('all')) {
      try {
        const c = await syncInsightsRange(since, until, 'ad', syncRunId);
        insightsCount += c;
        logger.info('Synced ad insights', { count: c });
      } catch (e: any) {
        errors.push(`insights ad: ${e.message}`);
        metaRepo.logSyncError(syncRunId, 'insights', 'level=ad', 500, 'INSIGHT_AD_FAIL', e.message);
      }
    }

    // 7. Breakdowns
    if (activeScopes.includes('breakdowns') || activeScopes.includes('all')) {
      for (const bType of ['demographic', 'placement', 'device', 'geographic']) {
        try {
          const c = await syncBreakdowns(since, until, bType, syncRunId);
          breakdownsCount += c;
          logger.info(`Synced breakdown ${bType}`, { count: c });
        } catch (e: any) {
          errors.push(`breakdown ${bType}: ${e.message}`);
          metaRepo.logSyncError(syncRunId, 'insights', `breakdowns=${bType}`, 500, 'BREAKDOWN_FAIL', e.message);
        }
      }
    }

    // 8. Auto backfill attribution links
    try {
      const { backfillAttribution } = await import('./attribution-service');
      const bf = backfillAttribution();
      logger.info('Post-sync attribution backfill', bf);
    } catch (e: any) {
      logger.warn('Post-sync attribution backfill failed (non-critical)', { error: e.message });
    }

    const totalRecords = campaignsCount + adsetsCount + adsCount + creativesCount + insightsCount + breakdownsCount;
    const finalStatus = errors.length === 0 ? 'success' : totalRecords > 0 ? 'partial' : 'failed';

    metaRepo.finishSyncRun(syncRunId, finalStatus, totalRecords, 1, 0, errors.length ? errors : undefined);
    metaRepo.finishSyncLog(syncLogId, finalStatus === 'failed' ? 'failed' : 'success', totalRecords, errors.length ? errors.join('; ') : undefined);

    logger.info('Meta sync completed', {
      syncRunId,
      status: finalStatus,
      campaigns: campaignsCount,
      adsets: adsetsCount,
      ads: adsCount,
      creatives: creativesCount,
      insights: insightsCount,
      breakdowns: breakdownsCount,
      errorsCount: errors.length,
    });

    return {
      syncId: syncLogId,
      syncRunId,
      scopes: activeScopes,
      account: accountSynced,
      campaigns: campaignsCount,
      adsets: adsetsCount,
      ads: adsCount,
      creatives: creativesCount,
      insights: insightsCount,
      breakdownsCount,
      capabilitiesCount,
      errors,
      durationMs: Date.now() - start,
    };
  } catch (e: any) {
    metaRepo.finishSyncRun(syncRunId, 'failed', 0, 1, 0, { message: e.message });
    metaRepo.finishSyncLog(syncLogId, 'failed', 0, e.message);
    logger.error('Meta sync fatal error', {}, e);
    throw e;
  }
}

export async function checkTokenHealth() {
  const cfg = getMetaConfig();
  if (!cfg.accessToken) return { valid: false, error: 'META_ACCESS_TOKEN missing' };
  try {
    const base = `https://graph.facebook.com/${cfg.apiVersion}/me`;
    const url = `${base}?access_token=${encodeURIComponent(cfg.accessToken)}&fields=id,name`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) {
      return { valid: false, error: data?.error?.message || `HTTP ${res.status}`, code: data?.error?.code };
    }
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
