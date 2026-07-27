/**
 * Meta Ads Types
 * Centralized type definitions for Meta/Facebook Ads tracking
 * 
 * NOTE: Legacy types below (AdsData) kept for backward compat.
 * New code should use types from lib/repositories/meta-ads (MetaCampaignRow, MetaInsightRow etc)
 * or lib/meta/client (CampaignRow, AdSetRow, AdRow)
 */

/** @deprecated Use MetaInsightRow from lib/repositories/meta-ads */
export interface AdsData {
  spend: number;
  impressions: number;
  inlineLinkClicks: number;
  reach: number;
  date_start?: string;
  date_end?: string;
  updated_at?: string;
}

/** @deprecated Use MetaInsightRow */
export interface AdsLogEntry {
  id: number;
  date_record: string;
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
  updated_at: string;
}

/** @deprecated Use aggregated totals from getAttributionFunnel */
export interface AdsInsights {
  total_spend: number;
  total_impressions: number;
  total_clicks: number;
  total_reach: number;
  start_date: string;
  end_date: string;
}
