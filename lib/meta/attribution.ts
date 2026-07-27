import 'server-only';

/**
 * Parse fbclid into fbc format: fb.1.{timestamp}.{fbclid}
 */
export function parseFbclidToFbc(fbclid: string, ts?: number): string {
  const timestamp = ts ?? Math.floor(Date.now() / 1000);
  return `fb.1.${timestamp}.${fbclid}`;
}

/**
 * Extract fbc value – prefer existing _fbc cookie, else build from fbclid
 */
export function resolveFbc(fbclid?: string | null, fbcCookie?: string | null): string | undefined {
  if (fbcCookie && fbcCookie.startsWith('fb.')) return fbcCookie;
  if (fbclid) return parseFbclidToFbc(fbclid);
  return undefined;
}

/**
 * Try to match campaign/adset/ad from URL params.
 * Ads should be configured with ?campaign_id={{campaign.id}}&adset_id={{adset.id}}&ad_id={{ad.id}}
 */
export interface AttributionParams {
  campaign_id?: string;
  campaignId?: string;
  adset_id?: string;
  adsetId?: string;
  ad_id?: string;
  adId?: string;
  adset_name?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  utm_medium?: string;
  utm_source?: string;
  fbclid?: string;
  fbc?: string;
  fbp?: string;
}

export function extractAttribution(searchParams: URLSearchParams, cookies?: { _fbc?: string; _fbp?: string; fbc?: string; fbp?: string }): {
  meta_campaign_id?: string;
  meta_adset_id?: string;
  meta_ad_id?: string;
  fbclid?: string;
  fbc?: string;
  fbp?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  utm_medium?: string;
  utm_source?: string;
} {
  const get = (k: string) => searchParams.get(k) || undefined;
  const rawCampaignId = get('campaign_id') || get('campaignId');
  const rawAdsetId = get('adset_id') || get('adsetId');
  const rawAdId = get('ad_id') || get('adId');
  const fbclid = get('fbclid') || undefined;

  const fbc = resolveFbc(fbclid, searchParams.get('fbc') || cookies?._fbc || cookies?.fbc || null);
  const fbp = searchParams.get('fbp') || cookies?._fbp || cookies?.fbp || undefined;

  return {
    meta_campaign_id: rawCampaignId,
    meta_adset_id: rawAdsetId,
    meta_ad_id: rawAdId,
    fbclid,
    fbc,
    fbp,
    utm_campaign: get('utm_campaign'),
    utm_content: get('utm_content'),
    utm_term: get('utm_term'),
    utm_medium: get('utm_medium'),
    utm_source: get('utm_source'),
  };
}

/**
 * Build recommended ad URL template for full attribution
 */
export function buildRecommendedAdUrlTemplate(baseUrl: string): string {
  // {{ }} are Meta dynamic params, fbclid is appended by FB automatically but we keep explicit
  const params = [
    'utm_source=facebook',
    'utm_medium=cpc',
    'utm_campaign={{campaign.name}}',
    'utm_content={{ad.name}}',
    'campaign_id={{campaign.id}}',
    'adset_id={{adset.id}}',
    'ad_id={{ad.id}}',
  ].join('&');
  const sep = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${sep}${params}`;
}
