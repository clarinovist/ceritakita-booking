import { NextRequest, NextResponse } from 'next/server';
import { saveWaClick } from '@/lib/repositories/analytics';
import { sendWaClickEvent } from '@/lib/meta-capi';
import { extractAttribution } from '@/lib/meta/attribution';
import { logger } from '@/lib/logger';
import { isBotRequest, createRateLimiter } from '@/lib/bot-filter';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Mapping ad source → WA text + target package
const AD_CONFIG: Record<string, { text: string; pkg: string }> = {
  meta1: {
    text: 'Halo CeritaKita Studio, saya tertarik paket foto keluarga',
    pkg: 'Keluarga',
  },
  meta2: {
    text: 'Halo CeritaKita Studio, saya tertarik paket Self Photo 150k',
    pkg: 'Self Photo',
  },
  meta3: {
    text: 'Halo CeritaKita Studio, saya tertarik paket foto Birthday',
    pkg: 'Birthday',
  },
  // Fallback generic
  wa: {
    text: 'Halo CeritaKita Studio, saya tertarik info paket foto',
    pkg: 'General',
  },
};

const WA_NUMBER = process.env.WA_NUMBER || '6285190832058';
const FALLBACK_CONFIG = { text: 'Halo CeritaKita Studio, saya tertarik info paket foto', pkg: 'General' };
const waRateLimiter = createRateLimiter({ windowMs: 5 * 60 * 1000, maxHits: 3 });

/**
 * GET /api/wa/[source]
 * Full attribution capture: fbclid, fbc, fbp, campaign_id, adset_id, ad_id, utm_*
 * Saves to wa_clicks with matched ids when possible
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { source: string[] } }
): Promise<NextResponse> {
  try {
    const source = params.source?.[0] ?? 'unknown';
    const config = (AD_CONFIG[source] ?? FALLBACK_CONFIG) as typeof FALLBACK_CONFIG;

    const { searchParams } = request.nextUrl;

    // Attribution extraction using new util
    const cookies = {
      _fbc: request.cookies.get('_fbc')?.value,
      _fbp: request.cookies.get('_fbp')?.value,
      fbc: request.cookies.get('fbc')?.value,
      fbp: request.cookies.get('fbp')?.value,
    };
    const attr = extractAttribution(searchParams, cookies);

    const utmCampaign = attr.utm_campaign;
    const utmMedium = attr.utm_medium;
    const utmContent = attr.utm_content;
    const utmTerm = attr.utm_term;
    const utmSource = attr.utm_source;

    const fbclid = attr.fbclid;
    const fbc = attr.fbc;
    const fbp = attr.fbp;

    // Explicit ad params from template: campaign_id, adset_id, ad_id
    const campaignIdParam = attr.meta_campaign_id;
    const adsetIdParam = attr.meta_adset_id;
    const adIdParam = attr.meta_ad_id;

    const userAgent = request.headers.get('user-agent') ?? undefined;
    const referrer = request.headers.get('referer') ?? undefined;
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown';

    const botResult = isBotRequest(ip, userAgent);
    if (botResult.isBot) {
      logger.info('WA click filtered (bot/crawler)', { source, ip, reason: botResult.reason });
      const waText = encodeURIComponent(config.text);
      const redirectUrl = `https://wa.me/${WA_NUMBER}?text=${waText}`;
      return NextResponse.redirect(redirectUrl, 302);
    }

    const rateResult = waRateLimiter(ip);
    if (!rateResult.allowed) {
      logger.info('WA click rate-limited', { source, ip, hits: rateResult.hits });
      const waText = encodeURIComponent(config.text);
      const redirectUrl = `https://wa.me/${WA_NUMBER}?text=${waText}`;
      return NextResponse.redirect(redirectUrl, 302);
    }

    // Try to resolve matched campaign/ad from utm_campaign name if explicit ids not provided
    let matchedCampaignId: string | undefined = campaignIdParam;
    let matchedAdsetId: string | undefined = adsetIdParam;
    let matchedAdId: string | undefined = adIdParam;

    if (!matchedCampaignId && utmCampaign) {
      try {
        const db = getDb();
        // Exact or LIKE match on campaign name
        const row = db
          .prepare(`SELECT id FROM meta_campaigns WHERE LOWER(name) = LOWER(?) OR LOWER(name) LIKE '%' || LOWER(?) || '%' LIMIT 1`)
          .get(utmCampaign, utmCampaign) as { id: string } | undefined;
        if (row) matchedCampaignId = row.id;
      } catch {}
    }

    if (!matchedAdId && utmContent) {
      try {
        const db = getDb();
        const row = db
          .prepare(`SELECT id, campaign_id, adset_id FROM meta_ads WHERE LOWER(name) = LOWER(?) OR LOWER(name) LIKE '%' || LOWER(?) || '%' LIMIT 1`)
          .get(utmContent, utmContent) as { id: string; campaign_id: string; adset_id: string } | undefined;
        if (row) {
          matchedAdId = row.id;
          if (!matchedCampaignId) matchedCampaignId = row.campaign_id;
          if (!matchedAdsetId) matchedAdsetId = row.adset_id;
        }
      } catch {}
    }

    try {
      const db = getDb();
      // Try extended save – use saveWaClick if available plus direct update for extra fields
      // First, save base
      try {
        saveWaClick({
          source,
          package: config.pkg,
          utmCampaign,
          utmMedium,
          utmContent,
          ip,
          userAgent,
          referrer,
        } as any);
      } catch {}

      // Then update the latest row for this ip+source with extra attribution if columns exist
      try {
        const latest = db
          .prepare(`SELECT id FROM wa_clicks WHERE source = ? AND ip = ? ORDER BY clicked_at DESC LIMIT 1`)
          .get(source, ip) as { id: number } | undefined;
        if (latest) {
          db.prepare(
            `UPDATE wa_clicks SET 
              fbclid = COALESCE(?, fbclid),
              fbc = COALESCE(?, fbc),
              fbp = COALESCE(?, fbp),
              matched_campaign_id = COALESCE(?, matched_campaign_id),
              matched_adset_id = COALESCE(?, matched_adset_id),
              matched_ad_id = COALESCE(?, matched_ad_id),
              utm_term = COALESCE(?, utm_term),
              utm_source = COALESCE(?, utm_source),
              campaign_id_param = COALESCE(?, campaign_id_param),
              adset_id_param = COALESCE(?, adset_id_param),
              ad_id_param = COALESCE(?, ad_id_param)
            WHERE id = ?`
          ).run(
            fbclid || null,
            fbc || null,
            fbp || null,
            matchedCampaignId || null,
            matchedAdsetId || null,
            matchedAdId || null,
            utmTerm || null,
            utmSource || null,
            campaignIdParam || null,
            adsetIdParam || null,
            adIdParam || null,
            latest.id
          );
        }
      } catch {}
    } catch (logErr) {
      logger.warn('WaClick log failed (non-blocking)', {
        error: logErr instanceof Error ? logErr.message : String(logErr),
        source,
      });
    }

    // CAPI with fbc/fbp
    sendWaClickEvent(ip, userAgent ?? '', source, fbclid || null, fbp || null).catch((err) => {
      logger.warn('Meta CAPI WA click event failed (non-blocking)', {
        error: err instanceof Error ? err.message : String(err),
        source,
      });
    });

    const waText = encodeURIComponent(config.text);
    const redirectUrl = `https://wa.me/${WA_NUMBER}?text=${waText}`;

    return NextResponse.redirect(redirectUrl, 302);
  } catch (err) {
    logger.error('Wa redirect handler error', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.redirect(`https://wa.me/${WA_NUMBER}`, 302);
  }
}
