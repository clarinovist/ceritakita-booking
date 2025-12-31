/**
 * Meta Ads Types
 * Centralized type definitions for Meta/Facebook Ads tracking
 */

export interface AdsData {
  /** Total ad spend */
  spend: number;
  
  /** Number of impressions */
  impressions: number;
  
  /** Number of clicks */
  clicks: number;
  
  /** Number of leads generated */
  leads: number;
  
  /** Cost per lead */
  cost_per_lead?: number;
  
  /** Date of the data */
  date?: string;
}

export interface AdsLogEntry {
  /** Unique identifier */
  id: number;
  
  /** Date of the log entry */
  date: string;
  
  /** Ads data */
  data: AdsData;
  
  /** When the entry was created */
  created_at: string;
}

export interface AdsInsights {
  /** Total spend across period */
  total_spend: number;
  
  /** Total impressions */
  total_impressions: number;
  
  /** Total clicks */
  total_clicks: number;
  
  /** Total leads */
  total_leads: number;
  
  /** Average cost per lead */
  avg_cost_per_lead: number;
  
  /** Start date of insights */
  start_date: string;
  
  /** End date of insights */
  end_date: string;
}