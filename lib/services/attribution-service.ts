import 'server-only';
import { getDb } from '@/lib/db';
import { logger } from '@/lib/logger';

function normalizePhone(p: string): string {
  if (!p) return '';
  const digits = p.replace(/\D/g, '');
  // keep last 10-12 digits for matching Indonesia numbers
  return digits.slice(-11);
}

export interface BackfillResult {
  bookingsLinked: number;
  bookingsSkipped: number;
  leadsLinkedByUtm: number;
  leadsLinkedByCampaignParam: number;
  leadsLinkedByPackage: number;
  waClicksMatched: number;
  waClicksMatchedByParam: number;
  errors: string[];
}

/**
 * Link existing bookings without lead_id to leads via whatsapp phone matching
 * Strategy: for each booking without lead_id, find most recent lead with same whatsapp (last 11 digits) created within 90 days before booking
 */
export function linkBookingsToLeads(): { linked: number; skipped: number; errors: string[] } {
  const db = getDb();
  const errors: string[] = [];
  let linked = 0;
  let skipped = 0;

  try {
    const bookings = db.prepare(`SELECT id, customer_whatsapp, created_at FROM bookings WHERE lead_id IS NULL`).all() as { id: string; customer_whatsapp: string; created_at: string }[];
    const leads = db.prepare(`SELECT id, whatsapp, created_at FROM leads ORDER BY created_at DESC`).all() as { id: string; whatsapp: string; created_at: string }[];

    // build map normalized phone -> leads sorted by date desc
    const leadsByPhone = new Map<string, typeof leads>();
    for (const lead of leads) {
      const norm = normalizePhone(lead.whatsapp);
      if (!norm) continue;
      if (!leadsByPhone.has(norm)) leadsByPhone.set(norm, []);
      leadsByPhone.get(norm)!.push(lead);
    }

    const updateStmt = db.prepare(`UPDATE bookings SET lead_id = ? WHERE id = ?`);

    for (const booking of bookings) {
      const normPhone = normalizePhone(booking.customer_whatsapp);
      if (!normPhone) {
        skipped++;
        continue;
      }
      const candidates = leadsByPhone.get(normPhone) || [];
      if (candidates.length === 0) {
        // try last 10 digits fallback
        const alt = normPhone.slice(-10);
        let found = false;
        for (const [phone, list] of leadsByPhone.entries()) {
          if (phone.endsWith(alt) || alt.endsWith(phone)) {
            const candidate = list.find(l => new Date(l.created_at) <= new Date(booking.created_at) && new Date(l.created_at) >= new Date(new Date(booking.created_at).getTime() - 90 * 24 * 60 * 60 * 1000));
            if (candidate) {
              try {
                updateStmt.run(candidate.id, booking.id);
                linked++;
              } catch (e: any) {
                errors.push(`booking ${booking.id}: ${e.message}`);
              }
              found = true;
              break;
            }
          }
        }
        if (!found) skipped++;
        continue;
      }

      const bookingDate = new Date(booking.created_at);
      // find most recent lead before or within 7 days after booking (some leads created after booking)
      const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
      const candidate = candidates.find(l => {
        const leadDate = new Date(l.created_at);
        const diff = bookingDate.getTime() - leadDate.getTime();
        return diff >= -7 * 24 * 60 * 60 * 1000 && diff <= ninetyDaysMs;
      });

      if (candidate) {
        try {
          updateStmt.run(candidate.id, booking.id);
          linked++;
        } catch (e: any) {
          errors.push(`booking ${booking.id}: ${e.message}`);
        }
      } else {
        skipped++;
      }
    }
  } catch (e: any) {
    errors.push(`linkBookingsToLeads fatal: ${e.message}`);
  }

  return { linked, skipped, errors };
}

/**
 * Link leads without meta_campaign_id via utm_campaign, campaign_id_param, or package heuristic
 */
export function linkLeadsToCampaigns(): { byUtm: number; byParam: number; byPackage: number; errors: string[] } {
  const db = getDb();
  const errors: string[] = [];
  let byUtm = 0;
  let byParam = 0;
  let byPackage = 0;

  try {
    // 1. Link via utm_campaign exact or LIKE match to meta_campaigns.name
    const resUtm = db.prepare(`
      UPDATE leads
      SET meta_campaign_id = (
        SELECT c.id FROM meta_campaigns c
        WHERE LOWER(c.name) = LOWER(leads.utm_campaign)
           OR LOWER(c.name) LIKE '%' || LOWER(leads.utm_campaign) || '%'
           OR LOWER(leads.utm_campaign) LIKE '%' || LOWER(c.name) || '%'
        LIMIT 1
      )
      WHERE meta_campaign_id IS NULL AND utm_campaign IS NOT NULL AND TRIM(utm_campaign) != ''
    `).run();
    byUtm = resUtm.changes;

    // 2. Link via campaign_id_param if we ever stored it in utm or direct column (some future leads may have it in notes)
    // Check if leads have fbclid that could contain campaign? No. But check matched via wa_clicks campaign_id_param column
    // We'll also try to match leads created shortly after wa_clicks with same utm_campaign

    // For leads that have no campaign but have meta_ad_id or meta_adset_id, derive campaign via ad tables
    try {
      db.prepare(`
        UPDATE leads
        SET meta_campaign_id = (
          SELECT ad.campaign_id FROM meta_ads ad WHERE ad.id = leads.meta_ad_id LIMIT 1
        )
        WHERE meta_campaign_id IS NULL AND meta_ad_id IS NOT NULL
      `).run();
    } catch {}

    try {
      db.prepare(`
        UPDATE leads
        SET meta_campaign_id = (
          SELECT a.campaign_id FROM meta_adsets a WHERE a.id = leads.meta_adset_id LIMIT 1
        )
        WHERE meta_campaign_id IS NULL AND meta_adset_id IS NOT NULL
      `).run();
    } catch {}

    // 3. Heuristic: if lead interest contains "Self Photo" or "Family" map to best campaign with similar name
    // This is best-effort for old leads without utm
    try {
      const leadsWithoutCamp = db.prepare(`SELECT id, interest FROM leads WHERE meta_campaign_id IS NULL AND source = 'Meta Ads'`).all() as { id: string; interest: string | null }[];
      const campaigns = db.prepare(`SELECT id, name FROM meta_campaigns`).all() as { id: string; name: string }[];

      const updateStmt = db.prepare(`UPDATE leads SET meta_campaign_id = ? WHERE id = ?`);

      for (const lead of leadsWithoutCamp) {
        const interest = (lead.interest || '').toLowerCase();
        let matched: string | null = null;

        if (interest.includes('self photo') || interest.includes('self')) {
          const c = campaigns.find(x => x.name.toLowerCase().includes('self foto') || x.name.toLowerCase().includes('self'))?.id;
          if (c) matched = c;
        } else if (interest.includes('keluarga') || interest.includes('family')) {
          const c = campaigns.find(x => x.name.toLowerCase().includes('keluarga') || x.name.toLowerCase().includes('family'))?.id;
          if (c) matched = c;
          else matched = campaigns.find(x => x.name.toLowerCase().includes('ctwa'))?.id || null;
        } else if (interest.includes('birthday')) {
          matched = campaigns.find(x => x.name.toLowerCase().includes('birthday'))?.id || null;
        }

        // Fallback: if only one active campaign recently, assign to it? Skip to avoid wrong attribution
        // Instead, check if lead created date falls within campaign active period with spend
        if (!matched) {
          // pick campaign with most spend in last 30d as fallback for old Meta Ads leads without interest
          const recentCamp = campaigns.find(c => c.name.toLowerCase().includes('self foto'))?.id || campaigns[0]?.id;
          // Only auto-assign if campaigns exist and lead is old? We'll skip auto-assign to keep accurate
          continue;
        }

        if (matched) {
          try {
            updateStmt.run(matched, lead.id);
            byPackage++;
          } catch (e: any) {
            errors.push(`lead ${lead.id} package link: ${e.message}`);
          }
        }
      }
    } catch (e: any) {
      errors.push(`package heuristic: ${e.message}`);
    }

  } catch (e: any) {
    errors.push(`linkLeadsToCampaigns fatal: ${e.message}`);
  }

  return { byUtm, byParam, byPackage, errors };
}

/**
 * Link wa_clicks to campaigns via utm_campaign name match or explicit campaign_id_param
 */
export function linkWaClicksToCampaigns(): { matched: number; matchedByParam: number; errors: string[] } {
  const db = getDb();
  const errors: string[] = [];
  let matched = 0;
  let matchedByParam = 0;

  try {
    // By explicit campaign_id_param if present
    const resParam = db.prepare(`
      UPDATE wa_clicks
      SET matched_campaign_id = campaign_id_param
      WHERE (matched_campaign_id IS NULL OR matched_campaign_id = '')
        AND campaign_id_param IS NOT NULL AND campaign_id_param != ''
        AND EXISTS (SELECT 1 FROM meta_campaigns c WHERE c.id = wa_clicks.campaign_id_param)
    `).run();
    matchedByParam = resParam.changes;

    // By utm_campaign name match
    const resUtm = db.prepare(`
      UPDATE wa_clicks
      SET matched_campaign_id = (
        SELECT c.id FROM meta_campaigns c
        WHERE LOWER(c.name) = LOWER(wa_clicks.utm_campaign)
           OR LOWER(c.name) LIKE '%' || LOWER(wa_clicks.utm_campaign) || '%'
           OR LOWER(wa_clicks.utm_campaign) LIKE '%' || LOWER(c.name) || '%'
        LIMIT 1
      )
      WHERE (matched_campaign_id IS NULL OR matched_campaign_id = '')
        AND utm_campaign IS NOT NULL AND TRIM(utm_campaign) != ''
    `).run();
    matched = resUtm.changes;

    // Also match by ad_id_param
    try {
      db.prepare(`
        UPDATE wa_clicks
        SET matched_ad_id = ad_id_param,
            matched_campaign_id = COALESCE(matched_campaign_id, campaign_id_param, (
              SELECT ad.campaign_id FROM meta_ads ad WHERE ad.id = wa_clicks.ad_id_param LIMIT 1
            )),
            matched_adset_id = COALESCE(matched_adset_id, adset_id_param, (
              SELECT ad.adset_id FROM meta_ads ad WHERE ad.id = wa_clicks.ad_id_param LIMIT 1
            ))
        WHERE ad_id_param IS NOT NULL AND ad_id_param != ''
          AND (matched_ad_id IS NULL OR matched_ad_id = '')
      `).run();
    } catch (e: any) {
      errors.push(`ad_id_param match: ${e.message}`);
    }

  } catch (e: any) {
    errors.push(`linkWaClicks fatal: ${e.message}`);
  }

  return { matched, matchedByParam, errors };
}

export function backfillAttribution(): BackfillResult {
  const errors: string[] = [];
  logger.info('Starting backfillAttribution');

  const bookings = linkBookingsToLeads();
  errors.push(...bookings.errors);

  const waClicks = linkWaClicksToCampaigns();
  errors.push(...waClicks.errors);

  const leads = linkLeadsToCampaigns();
  errors.push(...leads.errors);

  logger.info('Backfill attribution completed', {
    bookingsLinked: bookings.linked,
    waMatched: waClicks.matched,
    leadsByUtm: leads.byUtm,
  });

  return {
    bookingsLinked: bookings.linked,
    bookingsSkipped: bookings.skipped,
    leadsLinkedByUtm: leads.byUtm,
    leadsLinkedByCampaignParam: leads.byParam,
    leadsLinkedByPackage: leads.byPackage,
    waClicksMatched: waClicks.matched,
    waClicksMatchedByParam: waClicks.matchedByParam,
    errors,
  };
}
