/**
 * Follow-Up Draft Generator
 *
 * Generates contextual WhatsApp draft messages for leads that need follow-up.
 * Used by the assisted follow-up feature (A2) — CS reviews, edits, then sends.
 *
 * NON-GOAL: Auto-send. All drafts are manual-approve only.
 */

import { Lead } from '@/lib/types/leads';
import { generateWhatsAppLink, normalizePhoneNumber } from '@/lib/whatsapp-template';
import { calculateLeadScore, type LeadScore } from '@/lib/lead-scoring';

// ── Draft templates by context ──────────────────────────────────────────────

interface DraftTemplate {
  /** Short label for the template */
  label: string;
  /** The message body — uses simple {{var}} placeholders */
  body: string;
}

/**
 * Templates organized by lead context.
 * Key = scenario identifier, value = template with placeholders.
 */
const TEMPLATES = {
  // ── New leads ────────────────────────────────────────────────────────
  new_meta_ads: {
    label: 'Sapa Baru (Meta Ads)',
    body: 'Halo {{name}} 👋\n\nTerima kasih sudah tertarik dengan CeritaKita Studio! 📸\n\nApakah ada yang bisa kami bantu? Misalnya info paket, jadwal, atau lokasi studio?\n\nKami siap bantu temukan sesi foto yang tepat ✨',
  },
  new_instagram: {
    label: 'Sapa Baru (Instagram)',
    body: 'Halo {{name}} 👋\n\nMakasih sudah DM kami di Instagram! 📸\n\nMau tanya tentang paket foto atau jadwal ya? Kami bantu semuanya 😊',
  },
  new_organic: {
    label: 'Sapa Baru (Organic)',
    body: 'Halo {{name}} 👋\n\nSelamat datang di CeritaKita Studio! 📸\n\nAda yang bisa kami bantu? Info paket, jadwal, atau lokasi — kami ready banget ✨',
  },
  new_default: {
    label: 'Sapa Baru (Default)',
    body: 'Halo {{name}} 👋\n\nTerima kasih sudah menghubungi CeritaKita Studio! 📸\n\nAda yang bisa kami bantu hari ini?',
  },

  // ── Follow-up (overdue) ──────────────────────────────────────────────
  followup_gentle: {
    label: 'Follow-Up Lembut',
    body: 'Halo {{name}} 😊\n\nKami ingin menanyakan, apakah masih tertarik dengan sesi foto di CeritaKita Studio?\n\nKalau ada pertanyaan atau butuh info paket, kami siap bantu kapan saja 📸✨',
  },
  followup_with_interest: {
    label: 'Follow-Up + Minat',
    body: 'Halo {{name}} 😊\n\nKami ingat kamu tertarik dengan {{interest}}. Apakah sudah ada keputusan, atau butuh info lebih lanjut?\n\nKami bisa bantu tentukan paket yang paling cocok 📸',
  },

  // ── Re-engagement ────────────────────────────────────────────────────
  reengage_long: {
    label: 'Re-engage (Lama)',
    body: 'Halo {{name}} 👋\n\nLama tidak dengar kabar! Semoga sehat selalu ya 😊\n\nKalau butuh sesi foto lagi (wisuda, keluarga, atau moment spesial lainnya), CeritaKita siap bantu 📸✨',
  },
} as const satisfies Record<string, DraftTemplate>;

// ── Draft generation logic ──────────────────────────────────────────────────

export interface FollowUpDraft {
  /** Lead data */
  leadId: string;
  leadName: string;
  whatsapp: string;
  status: Lead['status'];
  source: Lead['source'];
  interest: string[];
  /** Days since last contact (null if never contacted) */
  daysSinceContact: number | null;
  /** Days overdue for follow-up (null if no next_follow_up set) */
  daysOverdue: number | null;
  /** Generated draft message */
  draftMessage: string;
  /** Template label used */
  templateLabel: string;
  /** WhatsApp deep link with pre-filled message */
  waLink: string;
  /** Real lead score from scoring algorithm */
  leadScore: LeadScore;
}

function daysBetween(dateStr: string, now: Date): number {
  const d = new Date(dateStr);
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function pickTemplate(lead: Lead, daysSinceContact: number | null): { key: string; template: DraftTemplate } {
  const source = lead.source || 'Other';

  // New leads — never contacted
  if (!lead.last_contacted_at && lead.status === 'New') {
    if (source === 'Meta Ads') return { key: 'new_meta_ads', template: TEMPLATES.new_meta_ads };
    if (source === 'Instagram') return { key: 'new_instagram', template: TEMPLATES.new_instagram };
    if (source === 'Organic') return { key: 'new_organic', template: TEMPLATES.new_organic };
    return { key: 'new_default', template: TEMPLATES.new_default };
  }

  // Follow-up with known interest
  if (lead.interest && lead.interest.length > 0 && daysSinceContact !== null && daysSinceContact > 3) {
    return { key: 'followup_with_interest', template: TEMPLATES.followup_with_interest };
  }

  // Long silence — re-engage
  if (daysSinceContact !== null && daysSinceContact > 14) {
    return { key: 'reengage_long', template: TEMPLATES.reengage_long };
  }

  // Default follow-up
  return { key: 'followup_gentle', template: TEMPLATES.followup_gentle };
}

function renderDraft(template: DraftTemplate, lead: Lead, now: Date): string {
  const monthName = now.toLocaleDateString('id-ID', { month: 'long' });
  const interestStr = (lead.interest || []).join(', ') || 'foto';

  return template.body
    .replace(/\{\{name\}\}/g, lead.name)
    .replace(/\{\{interest\}\}/g, interestStr)
    .replace(/\{\{month\}\}/g, monthName);
}

/**
 * Generate follow-up drafts for leads that need attention.
 *
 * @param leads - All leads to evaluate
 * @param options.maxResults - Max drafts to return (default 20)
 * @returns Sorted list of drafts (highest priority first)
 */
export function generateFollowUpDrafts(
  leads: Lead[],
  options: { maxResults?: number } = {}
): FollowUpDraft[] {
  const { maxResults = 20 } = options;
  const now = new Date();
  const todayParts = now.toISOString().split('T');
  const today = todayParts[0] ?? '';

  const ELIGIBLE_STATUSES = new Set(['New', 'Contacted', 'Follow Up']);

  const drafts: FollowUpDraft[] = [];

  for (const lead of leads) {
    // Skip ineligible statuses
    if (!ELIGIBLE_STATUSES.has(lead.status)) continue;

    // Calculate time metrics
    const daysSinceContact = lead.last_contacted_at
      ? daysBetween(lead.last_contacted_at, now)
      : null;

    let daysOverdue: number | null = null;
    if (lead.next_follow_up) {
      const fuParts = lead.next_follow_up.split('T');
      const fuDate = fuParts[0] ?? '';
      if (fuDate <= today) {
        daysOverdue = daysBetween(lead.next_follow_up, now);
        // If negative, it means follow-up is in the future — not overdue
        if (daysOverdue < 0) daysOverdue = null;
      }
    }

    // Skip if follow-up is not yet due and lead was contacted recently
    if (daysOverdue === null && daysSinceContact !== null && daysSinceContact <= 2) {
      continue;
    }

    // Pick template and render
    const { template } = pickTemplate(lead, daysSinceContact);
    const draftMessage = renderDraft(template, lead, now);

    // Build WA link
    const normalizedPhone = normalizePhoneNumber(lead.whatsapp);
    const waLink = generateWhatsAppLink(normalizedPhone, draftMessage);

    // Calculate real lead score
    const leadScore = calculateLeadScore(lead, now);

    drafts.push({
      leadId: lead.id,
      leadName: lead.name,
      whatsapp: lead.whatsapp,
      status: lead.status,
      source: lead.source,
      interest: lead.interest || [],
      daysSinceContact,
      daysOverdue,
      draftMessage,
      templateLabel: template.label,
      waLink,
      leadScore,
    });
  }

  // Sort by real lead score descending, then by daysOverdue descending
  drafts.sort((a, b) => {
    if (b.leadScore.total !== a.leadScore.total) return b.leadScore.total - a.leadScore.total;
    const aOverdue = a.daysOverdue ?? 0;
    const bOverdue = b.daysOverdue ?? 0;
    return bOverdue - aOverdue;
  });

  return drafts.slice(0, maxResults);
}
