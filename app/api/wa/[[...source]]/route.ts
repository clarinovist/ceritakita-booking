import { NextRequest, NextResponse } from 'next/server';
import { saveWaClick } from '@/lib/repositories/analytics';
import { sendWaClickEvent } from '@/lib/meta-capi';
import { logger } from '@/lib/logger';
import { isBotRequest, createRateLimiter } from '@/lib/bot-filter';

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

const WA_NUMBER = '6282324021938';

// Fallback config literal to satisfy TS strictness
const FALLBACK_CONFIG = { text: 'Halo CeritaKita Studio, saya tertarik info paket foto', pkg: 'General' };

// IP-based rate limiter: max 3 clicks per IP per 5 minutes
const waRateLimiter = createRateLimiter({ windowMs: 5 * 60 * 1000, maxHits: 3 });

/**
 * GET /api/wa/[source]
 * Logs click then 302-redirects to wa.me with pre-filled text
 * Filters bot/crawler traffic and rate-limits to prevent inflation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { source: string[] } }
): Promise<NextResponse> {
  try {
    // Extract source from catch-all params
    const source = params.source?.[0] ?? 'unknown';
    const config = (AD_CONFIG[source] ?? FALLBACK_CONFIG) as typeof FALLBACK_CONFIG;

    // Extract UTM / query params for enrichment
    const { searchParams } = request.nextUrl;
    const utmCampaign = searchParams.get('utm_campaign') ?? undefined;
    const utmMedium = searchParams.get('utm_medium') ?? undefined;
    const utmContent = searchParams.get('utm_content') ?? undefined;

    // Meta Click ID & browser ID untuk attribution
    const fbclid = searchParams.get('fbclid');
    const fbp = request.cookies.get('_fbp')?.value;

    // Client hints
    const userAgent = request.headers.get('user-agent') ?? undefined;
    const referrer = request.headers.get('referer') ?? undefined;
    // Use x-forwarded-for for real IP behind proxy
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown';

    // ── Bot/crawler filter ──
    // Meta ad crawlers, AWS bots, Docker internal, and known bot IPs
    // still redirect (so Meta link validation passes) but skip DB/CAPI logging
    const botResult = isBotRequest(ip, userAgent);
    if (botResult.isBot) {
      logger.info('WA click filtered (bot/crawler)', {
        source,
        ip,
        reason: botResult.reason,
      });
      // Still redirect — Meta validates ad links by crawling them,
      // and we don't want to break ad delivery by returning errors
      const waText = encodeURIComponent(config.text);
      const redirectUrl = `https://wa.me/${WA_NUMBER}?text=${waText}`;
      return NextResponse.redirect(redirectUrl, 302);
    }

    // ── Rate limit per IP ──
    // Prevent repeat clicks from same IP inflating metrics
    const rateResult = waRateLimiter(ip);
    if (!rateResult.allowed) {
      logger.info('WA click rate-limited', {
        source,
        ip,
        hits: rateResult.hits,
      });
      // Still redirect user — don't punish real users who click twice
      const waText = encodeURIComponent(config.text);
      const redirectUrl = `https://wa.me/${WA_NUMBER}?text=${waText}`;
      return NextResponse.redirect(redirectUrl, 302);
    }

    // Log to database (fire-and-forget, don't block redirect on error)
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
      });
    } catch (logErr) {
      logger.warn('WaClick log failed (non-blocking)', {
        error: logErr instanceof Error ? logErr.message : String(logErr),
        source,
      });
    }

    // P2: Fire CAPI event (Contact) saat user klik WA link — non-blocking
    sendWaClickEvent(ip, userAgent ?? '', source, fbclid, fbp ?? null).catch((err) => {
      logger.warn('Meta CAPI WA click event failed (non-blocking)', {
        error: err instanceof Error ? err.message : String(err),
        source,
      });
    });

    // Build wa.me URL with pre-filled text
    const waText = encodeURIComponent(config.text);
    const redirectUrl = `https://wa.me/${WA_NUMBER}?text=${waText}`;

    // 302 redirect
    return NextResponse.redirect(redirectUrl, 302);
  } catch (err) {
    logger.error('Wa redirect handler error', {
      error: err instanceof Error ? err.message : String(err),
    });
    // Fallback redirect even on error
    return NextResponse.redirect(`https://wa.me/${WA_NUMBER}`, 302);
  }
}
