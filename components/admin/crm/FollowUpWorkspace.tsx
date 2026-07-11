'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MessageCircle,
  Phone,
  ExternalLink,
  Copy,
  Check,
  Clock,
  AlertTriangle,
  Users,
  RefreshCw,
  Search,
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────────

interface FollowUpDraft {
  leadId: string;
  leadName: string;
  whatsapp: string;
  status: string;
  source: string;
  interest: string[];
  daysSinceContact: number | null;
  daysOverdue: number | null;
  draftMessage: string;
  templateLabel: string;
  waLink: string;
  leadScore: {
    total: number;
    label: 'Hot' | 'Warm' | 'Cold';
    color: string;
  };
}

interface FollowUpSummary {
  total: number;
  newLeads: number;
  overdueFollowUp: number;
  longSilence: number;
}

interface FollowUpResponse {
  drafts: FollowUpDraft[];
  summary: FollowUpSummary;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 70) return 'bg-red-100 text-red-700 border-red-200';
  if (score >= 40) return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

function sourceIcon(source: string): string {
  const map: Record<string, string> = {
    'Meta Ads': '📱',
    Instagram: '📸',
    WhatsApp: '💬',
    Organic: '🌱',
    Referral: '👥',
    'Website Form': '🌐',
    'Phone Call': '📞',
  };
  return map[source] ?? '📝';
}

function daysLabel(days: number | null, suffix: string): string {
  if (days === null) return '-';
  if (days === 0) return 'hari ini';
  return `${days}${suffix}`;
}

type ScoreFilter = 'all' | 'hot' | 'warm' | 'cold';

// ── Component ───────────────────────────────────────────────────────────────

export default function FollowUpWorkspace() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<FollowUpDraft[]>([]);
  const [summary, setSummary] = useState<FollowUpSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterScore, setFilterScore] = useState<ScoreFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loggedIds, setLoggedIds] = useState<Set<string>>(new Set());

  const fetchDrafts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/leads/follow-up?limit=30');
      if (!res.ok) throw new Error('Gagal memuat data follow-up');
      const data: FollowUpResponse = await res.json();
      setDrafts(data.drafts);
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const handleCopy = async (draft: FollowUpDraft) => {
    await navigator.clipboard.writeText(draft.draftMessage);
    setCopiedId(draft.leadId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // P1: Auto-log interaction after "Buka WA" is clicked
  const handleOpenWA = async (draft: FollowUpDraft) => {
    // Log interaction (fire-and-forget, don't block navigation)
    if (!loggedIds.has(draft.leadId)) {
      fetch(`/api/leads/${draft.leadId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interaction_type: 'WhatsApp',
          interaction_content: `[Auto] Follow-up via ${draft.templateLabel}`,
          send_to_meta: false,
        }),
      }).catch(() => {
        // Non-blocking — if logging fails, CS can still log manually
      });

      // Update last_contacted_at (fire-and-forget)
      fetch(`/api/leads/${draft.leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ last_contacted_at: new Date().toISOString() }),
      }).catch(() => {
        // Non-blocking
      });

      setLoggedIds(prev => new Set(prev).add(draft.leadId));
    }
  };

  // ── Filter logic (P0: use leadScore.total, not legacy priority) ──────
  const filteredDrafts = React.useMemo(() => {
    let result = drafts;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        d =>
          d.leadName.toLowerCase().includes(q) ||
          d.whatsapp.includes(q) ||
          d.source.toLowerCase().includes(q)
      );
    }

    // Filter by real lead score labels: Hot ≥70, Warm 40–69, Cold <40
    if (filterScore === 'hot') result = result.filter(d => d.leadScore.total >= 70);
    else if (filterScore === 'warm') result = result.filter(d => d.leadScore.total >= 40 && d.leadScore.total < 70);
    else if (filterScore === 'cold') result = result.filter(d => d.leadScore.total < 40);

    return result;
  }, [drafts, searchQuery, filterScore]);

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-800">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.push('/admin')}
            className="group flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <div className="p-1.5 rounded-full bg-white border border-slate-200 group-hover:border-slate-400 transition-colors">
              <ArrowLeft size={14} />
            </div>
            Kembali
          </button>
          <button
            onClick={fetchDrafts}
            disabled={isLoading}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <MessageCircle size={24} className="text-blue-500" />
              Follow-Up Assisted
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Shortlist lead + draft WA. Edit, lalu kirim manual via WhatsApp.
            </p>
          </div>

          {/* Summary badges */}
          {summary && (
            <div className="hidden lg:flex items-center gap-3 bg-slate-100/50 px-4 py-2 rounded-2xl border border-slate-200/50">
              <div className="text-center px-3 border-r border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
                <p className="text-xs font-bold text-slate-700">{summary.total}</p>
              </div>
              <div className="text-center px-3 border-r border-slate-200">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Baru</p>
                <p className="text-xs font-bold text-blue-600">{summary.newLeads}</p>
              </div>
              <div className="text-center px-3 border-r border-slate-200">
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Overdue</p>
                <p className="text-xs font-bold text-amber-600">{summary.overdueFollowUp}</p>
              </div>
              <div className="text-center px-3">
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Dingin</p>
                <p className="text-xs font-bold text-red-600">{summary.longSilence}</p>
              </div>
            </div>
          )}
        </div>

        {/* Search + Filter (P0: Hot/Warm/Cold labels matching score) */}
        <div className="flex items-center gap-3 mt-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, WA, atau sumber..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 shadow-sm"
            />
          </div>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            {(['all', 'hot', 'warm', 'cold'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterScore(f)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  filterScore === f
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {f === 'all' ? 'Semua' : f === 'hot' ? '🔴 Hot' : f === 'warm' ? '🟡 Warm' : '⚪ Cold'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium">Memuat follow-up drafts...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-red-400">
            <AlertTriangle size={32} className="mb-3" />
            <p className="text-sm font-medium">{error}</p>
            <button
              onClick={fetchDrafts}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Coba lagi
            </button>
          </div>
        ) : filteredDrafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Users size={32} className="mb-3" />
            <p className="text-sm font-medium">
              {drafts.length === 0
                ? 'Tidak ada lead yang perlu di-follow up saat ini'
                : 'Tidak ada hasil yang cocok dengan filter'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-w-3xl">
            {filteredDrafts.map(draft => (
              <div
                key={draft.leadId}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Lead info header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${scoreColor(draft.leadScore.total)}`}>
                      {draft.leadScore.label} {draft.leadScore.total}pts
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{draft.leadName}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Phone size={10} />
                          {draft.whatsapp}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">
                          {sourceIcon(draft.source)} {draft.source}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Time badges */}
                    {draft.daysOverdue !== null && draft.daysOverdue > 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                        <Clock size={10} />
                        {daysLabel(draft.daysOverdue, 'hr')} overdue
                      </span>
                    )}
                    {draft.daysSinceContact !== null && (
                      <span className="text-[10px] text-slate-400">
                        Kontak {daysLabel(draft.daysSinceContact, 'hr')} lalu
                      </span>
                    )}
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">
                      {draft.templateLabel}
                    </span>
                  </div>
                </div>

                {/* Draft preview / expanded */}
                <div className="border-t border-slate-100">
                  <button
                    onClick={() => setExpandedId(expandedId === draft.leadId ? null : draft.leadId)}
                    className="w-full text-left px-4 py-3 text-xs text-slate-500 hover:bg-slate-50 transition-colors flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5">
                      <MessageCircle size={12} />
                      {expandedId === draft.leadId ? 'Sembunyikan draft' : 'Lihat draft WA'}
                    </span>
                    <span className="text-slate-400">{expandedId === draft.leadId ? '▲' : '▼'}</span>
                  </button>

                  {expandedId === draft.leadId && (
                    <div className="px-4 pb-4">
                      {/* Draft message */}
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-3">
                        <pre className="text-sm text-emerald-900 whitespace-pre-wrap font-sans leading-relaxed">
                          {draft.draftMessage}
                        </pre>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(draft)}
                          className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors active:scale-[0.98]"
                        >
                          {copiedId === draft.leadId ? (
                            <>
                              <Check size={14} />
                              Tersalin!
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              Copy Draft
                            </>
                          )}
                        </button>
                        <a
                          href={draft.waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleOpenWA(draft)}
                          className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors active:scale-[0.98]"
                        >
                          <ExternalLink size={14} />
                          {loggedIds.has(draft.leadId) ? '✓ Terkirim' : 'Buka WhatsApp'}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
