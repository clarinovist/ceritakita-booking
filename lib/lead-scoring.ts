/**
 * Lead Scoring Algorithm
 *
 * Scores leads 0-100 based on:
 * 1. Source value (Meta Ads = high, Organic = medium, etc.)
 * 2. Urgency (next_follow_up proximity)
 * 3. Responsiveness (last_contacted_at recency)
 * 4. Engagement (interest tags, notes present)
 * 5. Status (New > Follow Up > Contacted)
 *
 * Used by: FollowUpWorkspace, LeadsRecordsTable, daily digest
 */

import { Lead } from '@/lib/types/leads';

// ── Scoring weights ─────────────────────────────────────────────────────────

const WEIGHTS = {
  source: 25,
  urgency: 25,
  responsiveness: 25,
  engagement: 15,
  status: 10,
} as const;

// ── Source scoring ──────────────────────────────────────────────────────────

const SOURCE_SCORES: Record<string, number> = {
  'Meta Ads': 100,     // Paid lead — highest value
  Instagram: 80,       // Social media engagement
  WhatsApp: 70,        // Direct outreach
  'Website Form': 60,  // Inbound intent
  Referral: 55,        // Word of mouth
  Organic: 40,         // Free traffic
  'Phone Call': 50,    // Direct call
  Other: 30,           // Unknown source
};

// ── Status scoring ──────────────────────────────────────────────────────────

const STATUS_SCORES: Record<string, number> = {
  New: 100,           // Fresh lead — highest potential
  'Follow Up': 70,    // Actively being worked
  Contacted: 50,      // Initial contact made
  Won: 0,             // Already converted
  Converted: 0,       // Already converted
  Lost: 0,            // Dead lead
};

// ── Scoring functions ───────────────────────────────────────────────────────

function scoreSource(source: string): number {
  return SOURCE_SCORES[source] ?? 30;
}

function scoreUrgency(lead: Lead, now: Date): number {
  if (!lead.next_follow_up) return 30; // No deadline = neutral

  const fuDate = new Date(lead.next_follow_up);
  const diffMs = fuDate.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  // Overdue = highest urgency
  if (diffDays < 0) return 100;

  // Due today/tomorrow = very urgent
  if (diffDays <= 1) return 90;

  // Due within 3 days
  if (diffDays <= 3) return 70;

  // Due within a week
  if (diffDays <= 7) return 50;

  // Due later = lower urgency
  return 20;
}

function scoreResponsiveness(lead: Lead, now: Date): number {
  // Never contacted = high potential (fresh)
  if (!lead.last_contacted_at) return 80;

  const lastContact = new Date(lead.last_contacted_at);
  const diffDays = (now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24);

  // Contacted today = very responsive
  if (diffDays <= 1) return 100;

  // Contacted within 2 days
  if (diffDays <= 2) return 80;

  // Contacted within a week
  if (diffDays <= 7) return 50;

  // Contacted within 2 weeks
  if (diffDays <= 14) return 30;

  // Stale contact
  return 10;
}

function scoreEngagement(lead: Lead): number {
  let score = 0;

  // Has interest tags = engaged
  if (lead.interest && lead.interest.length > 0) {
    score += Math.min(lead.interest.length * 15, 50);
  }

  // Has notes = someone cared enough to document
  if (lead.notes) score += 30;

  // Has email = additional contact channel
  if (lead.email) score += 20;

  return Math.min(score, 100);
}

function scoreStatus(status: string): number {
  return STATUS_SCORES[status] ?? 30;
}

// ── Main scoring function ───────────────────────────────────────────────────

export interface LeadScore {
  /** Overall score 0-100 */
  total: number;
  /** Individual component scores */
  breakdown: {
    source: number;
    urgency: number;
    responsiveness: number;
    engagement: number;
    status: number;
  };
  /** Human-readable label */
  label: 'Hot' | 'Warm' | 'Cold';
  /** Color class for UI */
  color: string;
}

export function calculateLeadScore(lead: Lead, now: Date = new Date()): LeadScore {
  // Won/Lost/Converted = terminal states
  if (['Won', 'Converted'].includes(lead.status)) {
    return {
      total: 100,
      breakdown: { source: 100, urgency: 100, responsiveness: 100, engagement: 100, status: 100 },
      label: 'Hot',
      color: 'text-green-600',
    };
  }
  if (lead.status === 'Lost') {
    return {
      total: 0,
      breakdown: { source: 0, urgency: 0, responsiveness: 0, engagement: 0, status: 0 },
      label: 'Cold',
      color: 'text-slate-400',
    };
  }

  const components = {
    source: scoreSource(lead.source),
    urgency: scoreUrgency(lead, now),
    responsiveness: scoreResponsiveness(lead, now),
    engagement: scoreEngagement(lead),
    status: scoreStatus(lead.status),
  };

  // Weighted sum
  const total = Math.round(
    (components.source * WEIGHTS.source +
      components.urgency * WEIGHTS.urgency +
      components.responsiveness * WEIGHTS.responsiveness +
      components.engagement * WEIGHTS.engagement +
      components.status * WEIGHTS.status) /
    100
  );

  // Clamp to 0-100
  const clamped = Math.max(0, Math.min(100, total));

  // Label
  let label: LeadScore['label'];
  let color: string;
  if (clamped >= 70) {
    label = 'Hot';
    color = 'text-red-500';
  } else if (clamped >= 40) {
    label = 'Warm';
    color = 'text-amber-500';
  } else {
    label = 'Cold';
    color = 'text-slate-400';
  }

  return { total: clamped, breakdown: components, label, color };
}

/**
 * Score multiple leads and return sorted by score descending.
 */
export function scoreLeads(leads: Lead[]): Array<Lead & { score: LeadScore }> {
  const now = new Date();
  return leads
    .map(lead => ({ ...lead, score: calculateLeadScore(lead, now) }))
    .sort((a, b) => b.score.total - a.score.total);
}
