import 'server-only';
import { getDb } from '@/lib/db';
import { logger } from '@/lib/logger';
import { AdsData } from '@/lib/types';
import crypto from 'crypto';

/**
 * Database row interface for ads_performance_log table (DEPRECATED - kept for backward compat)
 * New code should use meta_insights_daily via lib/repositories/meta-ads
 */
interface AdsLogRow {
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
  date_record: string;
  updated_at: string;
}

/**
 * @deprecated Use meta_insights_daily via lib/repositories/meta-ads instead.
 * This function now reads from meta_insights_daily and aggregates by date.
 * Kept for backward compat for any external callers.
 */
export function getAdsLog(
  dateRecord?: string,
  startDate?: string,
  endDate?: string,
  limit: number = 30
): AdsData[] {
  try {
    const db = getDb();

    // Try new table first
    try {
      const { getInsightsRange } = require('@/lib/repositories/meta-ads');
      const rows = getInsightsRange({ startDate, endDate, limit: limit * 5 }) as any[];
      const grouped = new Map<string, AdsData>();
      for (const r of rows) {
        const key = r.date_record;
        const existing = grouped.get(key);
        if (existing) {
          existing.spend += r.spend || 0;
          existing.impressions += r.impressions || 0;
          existing.inlineLinkClicks += r.inline_link_clicks || 0;
          existing.reach += r.reach || 0;
        } else {
          grouped.set(key, {
            spend: r.spend || 0,
            impressions: r.impressions || 0,
            inlineLinkClicks: r.inline_link_clicks || 0,
            reach: r.reach || 0,
            date_start: r.date_record,
            date_end: r.date_record,
            updated_at: r.updated_at,
          });
        }
      }
      let result = Array.from(grouped.values()).sort((a, b) => (b.date_start || '').localeCompare(a.date_start || ''));
      if (dateRecord) result = result.filter(r => r.date_start === dateRecord);
      return result.slice(0, limit);
    } catch {}

    // Fallback to legacy table
    const mapRowToAdsData = (row: AdsLogRow): AdsData => ({
      spend: row.spend,
      impressions: row.impressions,
      inlineLinkClicks: row.clicks,
      reach: row.reach,
      date_start: row.date_record,
      date_end: row.date_record,
      updated_at: row.updated_at
    });

    if (dateRecord) {
      const stmt = db.prepare(`
        SELECT spend, impressions, clicks, reach, date_record, updated_at
        FROM ads_performance_log
        WHERE date_record = ?
        ORDER BY updated_at DESC
        LIMIT 1
      `);
      const rows = stmt.all(dateRecord) as AdsLogRow[];
      return rows.map(mapRowToAdsData);
    } else if (startDate && endDate) {
      const stmt = db.prepare(`
        SELECT spend, impressions, clicks, reach, date_record, updated_at
        FROM ads_performance_log
        WHERE date_record >= ? AND date_record <= ?
        ORDER BY date_record ASC
      `);
      const rows = stmt.all(startDate, endDate) as AdsLogRow[];
      return rows.map(mapRowToAdsData);
    } else {
      const stmt = db.prepare(`
        SELECT spend, impressions, clicks, reach, date_record, updated_at
        FROM ads_performance_log
        ORDER BY date_record DESC
        LIMIT ?
      `);
      const rows = stmt.all(limit) as AdsLogRow[];
      return rows.map(mapRowToAdsData);
    }
  } catch (error) {
    logger.error('Failed to retrieve ads performance log', {
      error: error instanceof Error ? error.message : String(error),
      dateRecord,
      startDate,
      endDate,
      limit
    });
    return [];
  }
}

// --- Deprecated stubs kept to avoid breaking imports, no-ops now ---

/**
 * @deprecated No longer writes to legacy table. Use upsertInsightsBatch instead.
 */
export function saveAdsLog(_data: AdsData): void {
  logger.warn('saveAdsLog is deprecated, use upsertInsightsBatch from meta-ads repo');
}

/**
 * @deprecated No longer writes to legacy table.
 */
export function saveAdsLogBatch(_dataList: AdsData[]): void {
  logger.warn('saveAdsLogBatch is deprecated, use upsertInsightsBatch');
}

/**
 * @deprecated Use syncAll from meta-ads-service.ts
 */
export async function backfillAdsHistory(
  _accessToken: string,
  _adAccountId: string,
  _days: number = 30,
  _apiVersion: string = 'v19.0'
): Promise<{ success: boolean; daysBackfilled: number; errors: string[] }> {
  logger.warn('backfillAdsHistory is deprecated, use syncAll from meta-ads-service');
  return { success: false, daysBackfilled: 0, errors: ['Deprecated, use /api/meta/sync'] };
}

// --- Website Traffic Analytics ---

export interface PageViewData {
  path: string;
  visitor_id: string;
  user_agent: string | null;
  device_type: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  referer: string | null;
}

export interface TrafficStats {
  date: string;
  views: number;
  visitors: number;
}

export interface TopPageData {
  path: string;
  views: number;
  visitors: number;
}

/**
 * Record a page view in the database
 */
export function recordPageView(data: PageViewData): void {
  const db = getDb();
  const id = crypto.randomUUID();

  try {
    const stmt = db.prepare(`
      INSERT INTO website_traffic (id, path, visitor_id, user_agent, device_type, referer, visited_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.run(
      id,
      data.path,
      data.visitor_id,
      data.user_agent,
      data.device_type,
      data.referer
    );
  } catch (error) {
    logger.error('Failed to record page view', { error });
    // Don't throw, just log. Analytics shouldn't break the app.
  }
}

/**
 * Get daily traffic stats (views and unique visitors)
 */
export function getTrafficStats(startDate?: string, endDate?: string): TrafficStats[] {
  const db = getDb();

  // Default to last 30 days if not specified
  const end = endDate || new Date().toISOString().split('T')[0];
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  try {
    // Generate a sequence of dates to ensure we have entries for days with zero traffic
    // Note: SQLite doesn't have a built-in generate_series, so we might have gaps if we group by date only.
    // However, for simplicity, we'll just query the data present and handle gaps in the UI if needed,
    // or we can handle it here by filling in the gaps. Let's fill gaps in JS.

    const stmt = db.prepare(`
      SELECT 
        date(visited_at) as date,
        COUNT(*) as views,
        COUNT(DISTINCT visitor_id) as visitors
      FROM website_traffic
      WHERE date(visited_at) >= ? AND date(visited_at) <= ?
      GROUP BY date(visited_at)
      ORDER BY date(visited_at) ASC
    `);

    const rows = stmt.all(start, end) as TrafficStats[];

    // Create a Map for O(1) lookups
    const rowsMap = new Map<string, TrafficStats>();
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row && row.date) {
        rowsMap.set(row.date, row);
      }
    }

    // Fill in missing dates with 0
    const results: TrafficStats[] = [];
    const currentDate = new Date(start as string);
    const lastDate = new Date(end as string);

    while (currentDate <= lastDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const found = dateStr ? rowsMap.get(dateStr) : undefined;

      if (found) {
        results.push(found);
      } else {
        results.push({ date: dateStr ?? '', views: 0, visitors: 0 });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return results;
  } catch (error) {
    logger.error('Failed to get traffic stats', { error });
    return [];
  }
}

/**
 * Get top visited pages
 */
export function getTopPages(startDate?: string, endDate?: string, limit: number = 10): TopPageData[] {
  const db = getDb();

  // Default to last 30 days
  const end = endDate || new Date().toISOString().split('T')[0];
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  try {
    const stmt = db.prepare(`
      SELECT 
        CASE 
          WHEN instr(path, '?') > 0 THEN substr(path, 1, instr(path, '?') - 1)
          ELSE path 
        END as path,
        COUNT(*) as views,
        COUNT(DISTINCT visitor_id) as visitors
      FROM website_traffic
      WHERE date(visited_at) >= ? AND date(visited_at) <= ?
      GROUP BY 
        CASE 
          WHEN instr(path, '?') > 0 THEN substr(path, 1, instr(path, '?') - 1)
          ELSE path 
        END
      ORDER BY views DESC
      LIMIT ?
    `);

    return stmt.all(start, end, limit) as TopPageData[];
  } catch (error) {
    logger.error('Failed to get top pages', { error });
    return [];
  }
}

/**
 * Get traffic sources (utm_source or referer)
 */
export function getTrafficSources(startDate?: string, endDate?: string): TrafficSourceData[] {
  const db = getDb();

  // Default to last 30 days
  const end = endDate || new Date().toISOString().split('T')[0];
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  try {
    // We need to fetch raw data to process the parsing in JS because SQLite text processing is limited
    // We fetch path and referer for all visits in the period
    const stmt = db.prepare(`
      SELECT path, referer, visitor_id
      FROM website_traffic
      WHERE date(visited_at) >= ? AND date(visited_at) <= ?
    `);

    const rows = stmt.all(start, end) as { path: string; referer: string | null; visitor_id: string }[];

    const sourceMap = new Map<string, Set<string>>(); // Source -> Set of Visitor IDs
    const totalVisitors = new Set(rows.map(r => r.visitor_id)).size;

    rows.forEach(row => {
      let source = 'Direct';

      // 1. Check UTM Source in Path
      if (row.path.includes('utm_source=')) {
        const match = row.path.match(/utm_source=([^&]+)/);
        if (match && match[1]) {
          source = match[1].charAt(0).toUpperCase() + match[1].slice(1);
        }
      }
      // 2. Check Referer if no UTM
      else if (row.referer) {
        try {
          const refUrl = new URL(row.referer);
          const hostname = refUrl.hostname.toLowerCase();

          if (hostname.includes('google')) source = 'Google';
          else if (hostname.includes('facebook') || hostname.includes('fb.com')) source = 'Facebook';
          else if (hostname.includes('instagram') || hostname.includes('ig.me')) source = 'Instagram';
          else if (hostname.includes('twitter') || hostname.includes('t.co') || hostname.includes('x.com')) source = 'Twitter/X';
          else if (hostname.includes('linkedin')) source = 'LinkedIn';
          else if (hostname.includes('youtube') || hostname.includes('youtu.be')) source = 'YouTube';
          else if (hostname.includes('tiktok')) source = 'TikTok';
          else if (hostname.includes('whatsapp') || hostname.includes('wa.me')) source = 'WhatsApp';
          else source = hostname; // Other referrals
        } catch {
          // Invalid URL, treat as Direct
        }
      }

      if (!sourceMap.has(source)) {
        sourceMap.set(source, new Set());
      }
      sourceMap.get(source)?.add(row.visitor_id);
    });

    const results: TrafficSourceData[] = [];
    sourceMap.forEach((visitors, source) => {
      results.push({
        source,
        visitors: visitors.size,
        percent: totalVisitors > 0 ? Math.round((visitors.size / totalVisitors) * 100) : 0
      });
    });

    return results.sort((a, b) => b.visitors - a.visitors);

  } catch (error) {
    logger.error('Failed to get traffic sources', { error });
    return [];
  }
}

export interface TrafficSourceData {
  source: string;
  visitors: number;
  percent: number;
  [key: string]: any;
}

// ─────────────────────────────────────────────────────────────
// WA Click Tracking (wa_clicks table)
// ─────────────────────────────────────────────────────────────

export interface WaClickData {
  source: string;
  package: string;
  utmCampaign?: string;
  utmMedium?: string;
  utmContent?: string;
  ip?: string;
  userAgent?: string;
  referrer?: string;
}

/**
 * Save a WhatsApp click redirect event to wa_clicks table
 */
export function saveWaClick(data: WaClickData): void {
  const db = getDb();

  try {
    const stmt = db.prepare(`
      INSERT INTO wa_clicks (
        source, package, utm_campaign, utm_medium, utm_content,
        ip, user_agent, referrer, clicked_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.run(
      data.source,
      data.package,
      data.utmCampaign ?? null,
      data.utmMedium ?? null,
      data.utmContent ?? null,
      data.ip ?? null,
      data.userAgent ?? null,
      data.referrer ?? null
    );

    logger.info('Saved WA click log', {
      source: data.source,
      package: data.package,
      ip: data.ip,
    });
  } catch (error) {
    logger.error('Failed to save WA click log', {
      error: error instanceof Error ? error.message : String(error),
      data,
    });
    throw error;
  }
}

export interface WaClickRow {
  id: number;
  source: string;
  package: string;
  utm_campaign: string | null;
  utm_medium: string | null;
  utm_content: string | null;
  ip: string | null;
  user_agent: string | null;
  referrer: string | null;
  clicked_at: string;
}

/**
 * SQL fragment to exclude known bot/crawler IPs from WA click queries.
 * These IPs inflate metrics by 47%+ (Meta crawlers, AWS bots, Docker internal).
 * Kept in sync with lib/bot-filter.ts BOT_IP_PATTERNS.
 */
const BOT_IP_EXCLUDE_SQL = `(
  ip NOT LIKE '2a03:2880:%'
  AND ip NOT LIKE '31.13.%'
  AND ip NOT LIKE '157.240.%'
  AND ip NOT LIKE '69.63.%'
  AND ip NOT LIKE '35.%'
  AND ip NOT LIKE '47.%'
  AND ip NOT LIKE '52.%'
  AND ip NOT LIKE '54.%'
  AND ip NOT LIKE '158.140.%'
  AND ip NOT LIKE '172.17.%'
  AND ip NOT LIKE '172.18.%'
  AND ip NOT LIKE '172.19.%'
  AND ip NOT LIKE '172.2%'
  AND ip NOT LIKE '172.30.%'
  AND ip NOT LIKE '172.31.%'
  AND ip NOT LIKE '192.168.%'
  AND ip NOT LIKE '10.%'
  AND ip != '127.0.0.1'
  AND ip != '::1'
  AND ip != 'unknown'
)`;

/**
 * Get WA click statistics grouped by source and day (excludes bot traffic)
 */
export function getWaClicksByDay(since?: string, until?: string): WaClickRow[] {
  const db = getDb();

  let sql = `
    SELECT
      source,
      package,
      DATE(clicked_at) as day,
      COUNT(*) as clicks
    FROM wa_clicks
    WHERE ${BOT_IP_EXCLUDE_SQL}
  `;

  const params: (string | null)[] = [];

  if (since || until) {
    if (since) {
      sql += ' AND DATE(clicked_at) >= ?';
      params.push(since);
    }
    if (until) {
      sql += ' AND DATE(clicked_at) <= ?';
      params.push(until);
    }
  }

  sql += ' GROUP BY source, package, DATE(clicked_at) ORDER BY day DESC, clicks DESC';

  try {
    const stmt = db.prepare(sql);
    return stmt.all(...params) as WaClickRow[];
  } catch (error) {
    logger.error('Failed to get WA click stats by day', { error });
    return [];
  }
}

/**
 * Get total WA clicks count for a date range (excludes bot traffic)
 */
export function getWaClicksCount(since?: string, until?: string): number {
  const db = getDb();

  let sql = `SELECT COUNT(*) as count FROM wa_clicks WHERE ${BOT_IP_EXCLUDE_SQL}`;
  const params: (string | null)[] = [];

  if (since || until) {
    if (since) {
      sql += ' AND DATE(clicked_at) >= ?';
      params.push(since);
    }
    if (until) {
      sql += ' AND DATE(clicked_at) <= ?';
      params.push(until);
    }
  }

  try {
    const stmt = db.prepare(sql);
    const result = stmt.get(...params) as { count: number } | undefined;
    return result?.count ?? 0;
  } catch (error) {
    logger.error('Failed to get WA click count', { error });
    return 0;
  }
}

export interface LeadAgentStat {
  username: string | null;
  assigned_to: string | null;
  total: number;
  won: number;
}

export function getLeadAnalyticsStats(startDateStr: string, endDateStr: string): {
  totalLeads: number;
  totalWon: number;
  agentStats: LeadAgentStat[];
} {
  const db = getDb();

  const totalLeadsResult = db.prepare(`
    SELECT COUNT(*) as count 
    FROM leads 
    WHERE created_at >= ? AND created_at <= ?
  `).get(startDateStr, endDateStr) as { count: number };

  const totalWonResult = db.prepare(`
    SELECT COUNT(*) as count 
    FROM leads 
    WHERE status IN ('Won', 'Converted') 
    AND created_at >= ? AND created_at <= ?
  `).get(startDateStr, endDateStr) as { count: number };

  const agentStats = db.prepare(`
    SELECT 
      u.username,
      l.assigned_to,
      COUNT(*) as total,
      SUM(CASE WHEN l.status IN ('Won', 'Converted') THEN 1 ELSE 0 END) as won
    FROM leads l
    LEFT JOIN users u ON l.assigned_to = u.id
    WHERE l.created_at >= ? AND l.created_at <= ?
    GROUP BY l.assigned_to
    ORDER BY total DESC
  `).all(startDateStr, endDateStr) as LeadAgentStat[];

  return {
    totalLeads: totalLeadsResult.count,
    totalWon: totalWonResult.count,
    agentStats
  };
}
