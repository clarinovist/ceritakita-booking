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
    const bookings = db.prepare(`SELECT id, customer_whatsapp, created_at FROM bookings WHERE lead_id IS NULL OR lead_id = ''`).all() as { id: string; customer_whatsapp: string; created_at: string }[];
    const leads = db.prepare(`SELECT id, whatsapp, created_at FROM leads ORDER BY created_at DESC`).all() as { id: string; whatsapp: string; created_at: string }[];

    // Precompute normalized suffix map for quick fallback
    const leadsByPhone = new Map<string, typeof leads>();
    const suffixMap = new Map<string, typeof leads>(); // 10-digit suffix -> leads

    for (const lead of leads) {
      const norm = normalizePhone(lead.whatsapp);
      if (!norm) continue;
      if (!leadsByPhone.has(norm)) leadsByPhone.set(norm, []);
      leadsByPhone.get(norm)!.push(lead);

      const suffix = norm.slice(-10);
      if (suffix) {
        if (!suffixMap.has(suffix)) suffixMap.set(suffix, []);
        suffixMap.get(suffix)!.push(lead);
      }
    }

    const updateStmt = db.prepare(`UPDATE bookings SET lead_id = ? WHERE id = ?`);
    const updateLeadStmt = db.prepare(`UPDATE leads SET booking_id = ?, status = COALESCE(CASE WHEN status IN ('Won','Converted') THEN status ELSE 'Won' END, 'Won'), converted_at = ? WHERE id = ?`);

    for (const booking of bookings) {
      const normPhone = normalizePhone(booking.customer_whatsapp);
      if (!normPhone) {
        skipped++;
        continue;
      }
      const suffix = normPhone.slice(-10);
      let candidates: typeof leads = leadsByPhone.get(normPhone) || suffixMap.get(suffix) || [];

      // Additional fallback: try to find any lead whose normalized phone ends with suffix
      if (candidates.length === 0) {
        for (const [phone, list] of Array.from(leadsByPhone.entries())) {
          if (phone.endsWith(suffix) || suffix.endsWith(phone.slice(-10))) {
            candidates = candidates.concat(list);
          }
        }
      }

      if (candidates.length === 0) {
        skipped++;
        continue;
      }

      const bookingDate = new Date(booking.created_at);
      const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

      // Sort candidates by closest date to booking (prefer lead before booking)
      candidates.sort((a, b) => {
        const da = Math.abs(bookingDate.getTime() - new Date(a.created_at).getTime());
        const dbt = Math.abs(bookingDate.getTime() - new Date(b.created_at).getTime());
        return da - dbt;
      });

      const candidate = candidates.find(l => {
        const leadDate = new Date(l.created_at);
        const diff = bookingDate.getTime() - leadDate.getTime();
        return diff >= -sevenDaysMs && diff <= ninetyDaysMs;
      });

      if (candidate) {
        try {
          updateStmt.run(candidate.id, booking.id);
          try {
            updateLeadStmt.run(booking.id, new Date().toISOString(), candidate.id);
          } catch {}
          linked++;
        } catch (e: any) {
          errors.push(`booking ${booking.id}: ${e.message}`);
        }
      } else {
        // If still not found, take closest regardless of date proximity (better than 0)
        const closest = candidates[0];
        if (closest) {
          try {
            updateStmt.run(closest.id, booking.id);
            try {
              updateLeadStmt.run(booking.id, new Date().toISOString(), closest.id);
            } catch {}
            linked++;
          } catch (e: any) {
            errors.push(`booking ${booking.id}: ${e.message}`);
            skipped++;
          }
        } else {
          skipped++;
        }
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
      WHERE (meta_campaign_id IS NULL OR meta_campaign_id = '') AND utm_campaign IS NOT NULL AND TRIM(utm_campaign) != ''
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
        WHERE (meta_campaign_id IS NULL OR meta_campaign_id = '') AND meta_ad_id IS NOT NULL AND meta_ad_id != ''
      `).run();
    } catch {}

    try {
      db.prepare(`
        UPDATE leads
        SET meta_campaign_id = (
          SELECT a.campaign_id FROM meta_adsets a WHERE a.id = leads.meta_adset_id LIMIT 1
        )
        WHERE (meta_campaign_id IS NULL OR meta_campaign_id = '') AND meta_adset_id IS NOT NULL AND meta_adset_id != ''
      `).run();
    } catch {}

    // 3. Heuristic: interest + date-based fallback for remaining leads without campaign
    try {
      const leadsWithoutCamp = db.prepare(`SELECT id, interest, created_at FROM leads WHERE (meta_campaign_id IS NULL OR meta_campaign_id = '') AND source = 'Meta Ads'`).all() as { id: string; interest: string | null; created_at: string }[];
      const campaigns = db.prepare(`SELECT id, name, created_time FROM meta_campaigns ORDER BY created_time ASC`).all() as { id: string; name: string; created_time: string | null }[];

      const updateStmt = db.prepare(`UPDATE leads SET meta_campaign_id = ? WHERE id = ?`);

      const monthKeywords: Record<number, string[]> = {
        0: ['januari', 'jan', 'january'],
        1: ['februari', 'feb'],
        2: ['maret', 'mar', 'march'],
        3: ['april', 'apr'],
        4: ['mei', 'may'],
        5: ['juni', 'jun', 'june'],
        6: ['juli', 'jul', 'july'],
        7: ['agustus', 'agu', 'august', 'aug'],
        8: ['september', 'sep'],
        9: ['oktober', 'oct', 'october'],
        10: ['november', 'nov'],
        11: ['desember', 'dec', 'december'],
      };

      for (const lead of leadsWithoutCamp) {
        const interest = (lead.interest || '').toLowerCase();
        const leadDate = new Date(lead.created_at);
        const leadMonth = leadDate.getMonth();
        let matched: string | null = null;

        if (interest.includes('self photo') || interest.includes('self') || interest.includes('self foto')) {
          matched = campaigns.find(x => x.name.toLowerCase().includes('self foto') || x.name.toLowerCase().includes('self'))?.id || null;
          if (matched) {
            if (leadMonth === 6) {
              const juli = campaigns.find(x => x.name.toLowerCase().includes('juli'))?.id;
              if (juli) matched = juli;
            } else if (leadMonth === 7) {
              const agust = campaigns.find(x => x.name.toLowerCase().includes('agustus') || x.name.toLowerCase().includes('august'))?.id;
              if (agust) matched = agust;
            }
          }
        } else if (interest.includes('keluarga') || interest.includes('family')) {
          matched = campaigns.find(x => x.name.toLowerCase().includes('keluarga') || x.name.toLowerCase().includes('family') || x.name.toLowerCase().includes('ctwa'))?.id || null;
        } else if (interest.includes('birthday')) {
          matched = campaigns.find(x => x.name.toLowerCase().includes('birthday'))?.id || null;
        }

        if (!matched) {
          const keywords = monthKeywords[leadMonth] || [];
          for (const camp of campaigns) {
            const nameLower = camp.name.toLowerCase();
            if (keywords.some(k => nameLower.includes(k))) {
              matched = camp.id;
              break;
            }
          }
          if (!matched) {
            // Last campaign created before lead
            const candidates = campaigns.filter(c => c.created_time && new Date(c.created_time) <= leadDate).sort((a, b) => new Date(b.created_time || '').getTime() - new Date(a.created_time || '').getTime());
            if (candidates.length > 0) matched = candidates[0]!.id;
            else if (campaigns.length > 0) matched = campaigns[0]!.id;
          }
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
