'use client';

import { useState, useEffect } from 'react';
import { Activity, RefreshCcw, Filter, Search, MessageSquare, UserCheck, Play, MousePointer } from 'lucide-react';

interface Props {
  dateRange: { start: string; end: string };
}

export default function ExplorerActionsTab({ dateRange }: Props) {
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    async function loadActions() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (dateRange.start) params.set('start', dateRange.start);
        if (dateRange.end) params.set('end', dateRange.end);
        if (actionTypeFilter) params.set('action_type', actionTypeFilter);
        params.set('limit', '150');

        const res = await fetch(`/api/meta/actions?${params.toString()}`);
        const json = await res.json();
        if (json.success) {
          setActions(json.data);
        }
      } catch (e) {
        console.error('Failed loading actions', e);
      } finally {
        setLoading(false);
      }
    }
    loadActions();
  }, [dateRange, actionTypeFilter]);

  const filteredActions = actions.filter((act) =>
    (act.action_type || '').toLowerCase().includes(search.toLowerCase()) ||
    (act.campaign_id || '').toLowerCase().includes(search.toLowerCase()) ||
    (act.ad_id || '').toLowerCase().includes(search.toLowerCase())
  );

  // Group by action type for visual breakdown
  const actionSummary: Record<string, number> = {};
  for (const act of actions) {
    const key = act.action_type || 'other';
    actionSummary[key] = (actionSummary[key] || 0) + (act.value || 0);
  }

  const sortedSummary = Object.entries(actionSummary).sort((a, b) => b[1] - a[1]);
  const totalActionsCount = Object.values(actionSummary).reduce((a, b) => a + b, 0);

  const messagingCount = actionSummary['onsite_conversion.messaging_conversation_started_7d'] || actionSummary['messaging_started'] || 0;
  const leadsCount = actionSummary['lead'] || 0;
  const videoViewsCount = actionSummary['video_view'] || 0;
  const linkClicksCount = actionSummary['link_click'] || 0;

  return (
    <div className="space-y-6">
      {/* Visual KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <p className="text-xs text-gray-500 flex items-center justify-between">
            WA Messaging Starts <MessageSquare size={16} className="text-emerald-500" />
          </p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {messagingCount.toLocaleString()}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Messaging Conversation Started (7d)</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <p className="text-xs text-gray-500 flex items-center justify-between">
            Meta Form Leads <UserCheck size={16} className="text-blue-500" />
          </p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {leadsCount.toLocaleString()}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Direct Lead Ads Submissions</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <p className="text-xs text-gray-500 flex items-center justify-between">
            Video Views <Play size={16} className="text-purple-500" />
          </p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {videoViewsCount.toLocaleString()}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Video View Engagements</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <p className="text-xs text-gray-500 flex items-center justify-between">
            Link Clicks <MousePointer size={16} className="text-orange-500" />
          </p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
            {linkClicksCount.toLocaleString()}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Outbound & In-Feed Link Clicks</p>
        </div>
      </div>

      {/* Action Volume Distribution Chart Card */}
      {!loading && sortedSummary.length > 0 && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500">Action Type Volume Breakdown</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedSummary.slice(0, 6).map(([type, val]) => {
              const pct = totalActionsCount > 0 ? (val / totalActionsCount) * 100 : 0;
              return (
                <div key={type} className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl space-y-1.5 border border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-900 dark:text-gray-100 truncate max-w-[240px]" title={type}>{type}</span>
                    <span className="font-mono text-purple-600">{val.toLocaleString()} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-purple-600 h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(pct, 1)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Header controls */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Activity size={20} className="text-purple-600" /> Actions & Conversion Events Explorer ({filteredActions.length})
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Normalized Meta actions breakdown (message starts, leads, video views, custom conversions).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search action or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border dark:border-gray-800 rounded-xl text-xs bg-gray-50 dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-purple-500 w-48"
            />
          </div>

          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-2 border dark:border-gray-700 rounded-xl text-xs">
            <Filter size={14} className="text-gray-400" />
            <select
              value={actionTypeFilter}
              onChange={(e) => setActionTypeFilter(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer font-medium"
            >
              <option value="">All Action Types</option>
              <option value="video_view">video_view</option>
              <option value="link_click">link_click</option>
              <option value="post_engagement">post_engagement</option>
              <option value="page_engagement">page_engagement</option>
              <option value="onsite_conversion.messaging_conversation_started_7d">Messaging Conversation Started (7d)</option>
              <option value="lead">lead</option>
              <option value="purchase">purchase</option>
            </select>
          </div>
        </div>
      </div>

      {/* Actions Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400 animate-pulse flex items-center justify-center gap-2">
            <RefreshCcw size={16} className="animate-spin text-purple-600" /> Loading normalized actions...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-500">
                  <th className="p-3">Date</th>
                  <th className="p-3">Action Type</th>
                  <th className="p-3">Count / Value</th>
                  <th className="p-3">Level</th>
                  <th className="p-3">Campaign ID</th>
                  <th className="p-3">Ad ID</th>
                  <th className="p-3">Attribution Window</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-800 font-mono">
                {filteredActions.map((act) => (
                  <tr key={act.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="p-3 font-sans font-medium">{act.date_record}</td>
                    <td className="p-3 font-bold text-purple-600 font-sans">{act.action_type}</td>
                    <td className="p-3 font-bold text-gray-900 dark:text-gray-100">{Number(act.value || 0).toLocaleString()}</td>
                    <td className="p-3 uppercase text-[10px] font-bold text-gray-500">{act.level || 'campaign'}</td>
                    <td className="p-3 text-gray-500">{act.campaign_id || '-'}</td>
                    <td className="p-3 text-gray-500">{act.ad_id || '-'}</td>
                    <td className="p-3 text-gray-400 text-[10px]">{act.action_attribution_window || 'default'}</td>
                  </tr>
                ))}

                {filteredActions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400 font-sans">
                      No action records found. Sync insights to populate normalized action events.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
