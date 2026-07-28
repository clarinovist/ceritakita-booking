'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Target,
  TrendingUp,
  Users,
  DollarSign,
  AlertCircle,
  Play,
  Pause,
  RefreshCcw,
  BarChart3,
  Zap,
  Sparkles,
  PieChart,
  Activity,
  Layers,
  Download,
  FileJson,
} from 'lucide-react';
import ExplorerRawInspectorModal from './ExplorerRawInspectorModal';
import ExplorerSyncCenterTab from './ExplorerSyncCenterTab';
import ExplorerCreativesTab from './ExplorerCreativesTab';
import ExplorerBreakdownsTab from './ExplorerBreakdownsTab';
import ExplorerActionsTab from './ExplorerActionsTab';

interface Campaign {
  id: string;
  name: string;
  status: string;
  objective?: string;
  daily_budget?: number;
  total_spend: number;
  total_impressions: number;
  total_clicks: number;
  total_reach: number;
  avg_cpc: number;
  avg_ctr: number;
  leads_count: number;
  bookings_count: number;
  revenue: number;
  cpl: number;
  cpb: number;
  roas: number;
  roi: number;
}

interface FunnelData {
  totals: { spend: number; impressions: number; clicks: number; reach: number; waClicks: number; leads: number; bookings: number; revenue: number };
  waBySource: { source: string; cnt: number }[];
  leadsBySource: { source: string; cnt: number }[];
  byCampaign: any[];
}

interface Props {
  dateRange: { start: string; end: string };
  bookings?: any[];
}

export default function MetaAdsDashboard({ dateRange }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'explorer' | 'creatives' | 'breakdowns' | 'actions' | 'sync'>('overview');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<any>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  // Raw Inspector modal state
  const [rawTarget, setRawTarget] = useState<{ type: 'account' | 'campaign' | 'adset' | 'ad' | 'creative' | 'insight'; id: string } | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (dateRange.start) params.set('start', dateRange.start);
      if (dateRange.end) params.set('end', dateRange.end);

      const [campRes, funnelRes, insightsRes, healthRes, acctRes] = await Promise.all([
        fetch(`/api/meta/campaigns?${params.toString()}`),
        fetch(`/api/meta/attribution?${params.toString()}`),
        fetch(`/api/meta/insights-db?${params.toString()}&level=campaign&limit=60`),
        fetch('/api/meta/health').catch(() => null),
        fetch('/api/meta/account').catch(() => null),
      ]);

      const campData = await campRes.json();
      if (campData.success) setCampaigns(campData.data);
      else setError(campData.error || 'Failed campaigns');

      const funnelData = await funnelRes.json();
      if (funnelData.success) setFunnel(funnelData.data);

      const insightsData = await insightsRes.json();
      if (insightsData.success) setInsights(insightsData.data);

      if (healthRes) {
        const h = await healthRes.json();
        if (h.success) setHealth(h.token);
      }

      if (acctRes) {
        const a = await acctRes.json();
        if (a.success) setAccount(a.data);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const triggerSync = async (full = false) => {
    setSyncing(true);
    try {
      const res = await fetch(`/api/meta/sync?days=7&full=${full ? '1' : '0'}`, { method: 'POST' });
      const data = await res.json();
      if (data.success || data.campaigns !== undefined) {
        await fetchAll();
      } else {
        alert(data.error || data.message || 'Sync failed');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleManage = async (entity: 'campaign' | 'adset' | 'ad', id: string, action: string, value?: any) => {
    if (!confirm(`${action} ${entity} ${id}?`)) return;
    try {
      const res = await fetch('/api/meta/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity, id, action, value }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Success: ${action}`);
        fetchAll();
      } else alert(data.error || 'Failed');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleExport = (type: 'insights' | 'campaigns', format: 'csv' | 'json') => {
    const params = new URLSearchParams({ type, format });
    if (dateRange.start) params.set('start', dateRange.start);
    if (dateRange.end) params.set('end', dateRange.end);
    window.open(`/api/meta/export?${params.toString()}`, '_blank');
  };

  const totals = funnel?.totals;

  return (
    <div className="space-y-6">
      {/* Top Bar with Account Badge & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="text-purple-600" /> Meta Ads Data Explorer
            {health && !health.valid && <span className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-normal">Token Invalid</span>}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
            <span>Source: Local Warehouse DB</span>
            {account && <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-mono font-medium">{account.name} ({account.currency || 'IDR'})</span>}
            {health?.valid && <span className="text-green-600 font-medium">Token Connected ({health.tokenPreview})</span>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => handleExport('insights', 'csv')}
              className="px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1"
              title="Export CSV"
            >
              <Download size={12} /> CSV
            </button>
            <button
              onClick={() => handleExport('insights', 'json')}
              className="px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1"
              title="Export JSON"
            >
              <FileJson size={12} /> JSON
            </button>
          </div>

          <button
            onClick={() => fetchAll()}
            className="px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium flex items-center gap-1.5 hover:bg-gray-50 transition"
          >
            <RefreshCcw size={14} /> Refresh
          </button>

          <button
            onClick={() => triggerSync(false)}
            disabled={syncing}
            className="px-4 py-2 bg-purple-600 text-white font-medium rounded-xl text-xs flex items-center gap-1.5 hover:bg-purple-700 disabled:opacity-50 transition shadow-sm"
          >
            {syncing ? 'Syncing...' : <><Zap size={14} /> Quick Sync</>}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3">
          <AlertCircle size={20} className="text-red-600 shrink-0" />
          <div>
            <p className="font-semibold text-red-800 text-sm">Meta Sync Warning</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto bg-white p-1.5 rounded-2xl border border-gray-200 gap-1">
        {[
          { id: 'overview', label: 'Overview & Funnel', icon: BarChart3 },
          { id: 'explorer', label: 'Hierarchy Explorer', icon: Layers },
          { id: 'creatives', label: 'Creatives Gallery', icon: Sparkles },
          { id: 'breakdowns', label: 'Audience Breakdowns', icon: PieChart },
          { id: 'actions', label: 'Actions & Conversions', icon: Activity },
          { id: 'sync', label: 'Sync Center & Capabilities', icon: Zap },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition whitespace-nowrap ${
                active
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : (
            <>
              {/* Funnel totals */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <Target size={20} className="text-purple-600" />
                    <span className="text-[10px] text-gray-400 font-mono">{dateRange.start || 'Start'} → {dateRange.end || 'End'}</span>
                  </div>
                  <p className="text-xs text-gray-500">Spend (Canonical Campaign)</p>
                  <p className="text-2xl font-bold text-purple-700">Rp {(totals?.spend || 0).toLocaleString('id-ID')}</p>
                  <p className="text-xs text-gray-400 mt-1">{totals?.impressions?.toLocaleString()} impr · {totals?.reach?.toLocaleString()} reach</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <TrendingUp size={20} className="text-orange-600" />
                  </div>
                  <p className="text-xs text-gray-500">WA Clicks</p>
                  <p className="text-2xl font-bold text-orange-700">{totals?.waClicks || 0}</p>
                  <p className="text-xs text-gray-400 mt-1">{totals?.clicks ? `${((totals.waClicks / totals.clicks) * 100).toFixed(1)}% from ad clicks` : '-'}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <Users size={20} className="text-blue-600" />
                  </div>
                  <p className="text-xs text-gray-500">Leads / Bookings</p>
                  <p className="text-2xl font-bold text-blue-700">{totals?.leads || 0} / {totals?.bookings || 0}</p>
                  <p className="text-xs text-gray-400 mt-1">Leads total · bookings converted</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <DollarSign size={20} className="text-green-600" />
                  </div>
                  <p className="text-xs text-gray-500">Revenue / ROAS</p>
                  <p className="text-2xl font-bold text-green-700">Rp {(totals?.revenue || 0).toLocaleString('id-ID')}</p>
                  <p className="text-xs text-gray-400 mt-1">{totals?.spend ? `${(totals.revenue / totals.spend).toFixed(2)}x ROAS` : 'No spend'}</p>
                </div>
              </div>

              {/* Visual Funnel Step */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
                <h3 className="font-bold text-sm text-gray-900">Attribution Funnel</h3>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {[
                    { label: 'Spend', value: `Rp ${(totals?.spend || 0).toLocaleString('id-ID')}` },
                    { label: 'Impr', value: totals?.impressions || 0 },
                    { label: 'Ad clicks', value: totals?.clicks || 0 },
                    { label: 'WA clicks', value: totals?.waClicks || 0 },
                    { label: 'Leads', value: totals?.leads || 0 },
                    { label: 'Bookings', value: totals?.bookings || 0 },
                    { label: 'Revenue', value: `Rp ${(totals?.revenue || 0).toLocaleString('id-ID')}` },
                  ].map((step, i) => (
                    <div key={step.label} className="flex items-center gap-2">
                      <div className="bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-200">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">{step.label}</p>
                        <p className="font-bold text-gray-900">{step.value}</p>
                      </div>
                      {i < 6 && <div className="text-gray-400 font-bold">→</div>}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t text-xs">
                  <div>
                    <p className="font-semibold mb-2 text-gray-700">WA Clicks by Source</p>
                    <div className="space-y-1 font-mono">
                      {funnel?.waBySource?.slice(0, 8).map((r: any) => (
                        <div key={r.source} className="flex justify-between bg-gray-50 px-3 py-1.5 rounded-lg">
                          <span>{r.source}</span>
                          <span className="font-bold">{r.cnt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold mb-2 text-gray-700">Leads by Source</p>
                    <div className="space-y-1 font-mono">
                      {funnel?.leadsBySource?.slice(0, 8).map((r: any) => (
                        <div key={r.source} className="flex justify-between bg-gray-50 px-3 py-1.5 rounded-lg">
                          <span>{r.source}</span>
                          <span className="font-bold">{r.cnt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Insights daily chart summary table */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">Daily Insights (DB · Campaign Level)</h3>
                    <p className="text-xs text-gray-500">Satu baris per campaign per hari. Metrik canonical.</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b text-gray-500 bg-gray-50">
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Campaign ID</th>
                        <th className="p-2.5">Spend</th>
                        <th className="p-2.5">Impr</th>
                        <th className="p-2.5">Clicks</th>
                        <th className="p-2.5">CTR</th>
                        <th className="p-2.5">CPC</th>
                        <th className="p-2.5">Raw</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-mono">
                      {insights.slice(0, 15).map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="p-2.5 font-sans font-medium">{row.date_record}</td>
                          <td className="p-2.5 truncate max-w-[160px] font-semibold text-purple-600">{row.campaign_id}</td>
                          <td className="p-2.5 font-bold">Rp {Number(row.spend).toLocaleString('id-ID')}</td>
                          <td className="p-2.5">{row.impressions}</td>
                          <td className="p-2.5">{row.inline_link_clicks}</td>
                          <td className="p-2.5">{row.ctr?.toFixed ? row.ctr.toFixed(2) : row.ctr}%</td>
                          <td className="p-2.5">Rp {Number(row.cpc || 0).toLocaleString('id-ID')}</td>
                          <td className="p-2.5">
                            <button
                              onClick={() => setRawTarget({ type: 'insight', id: String(row.id) })}
                              className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded flex items-center gap-1 text-[10px]"
                            >
                              <FileJson size={10} /> Inspector
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: HIERARCHY EXPLORER */}
      {activeTab === 'explorer' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-gray-900">Campaigns Hierarchy</h3>
              <p className="text-xs text-gray-500">{campaigns.length} campaigns ingested in local database</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b bg-gray-50 text-gray-500">
                  <th className="p-3">Campaign Name / ID</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Budget</th>
                  <th className="p-3">Spend</th>
                  <th className="p-3">Imp</th>
                  <th className="p-3">Clicks</th>
                  <th className="p-3">Leads</th>
                  <th className="p-3">Bookings</th>
                  <th className="p-3">Revenue</th>
                  <th className="p-3">ROAS</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y font-mono">
                {campaigns.map((c) => (
                  <tr key={c.id} className={`hover:bg-gray-50 ${selectedCampaign === c.id ? 'bg-purple-50' : ''}`}>
                    <td className="p-3 font-sans">
                      <div className="max-w-[220px]">
                        <p className="font-bold truncate text-gray-900" title={c.name}>{c.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{c.id}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3">{c.daily_budget ? `Rp ${c.daily_budget.toLocaleString('id-ID')}` : '-'}</td>
                    <td className="p-3 font-bold text-purple-600">Rp {c.total_spend.toLocaleString('id-ID')}</td>
                    <td className="p-3">{c.total_impressions.toLocaleString()}</td>
                    <td className="p-3">{c.total_clicks.toLocaleString()}</td>
                    <td className="p-3 font-bold">{c.leads_count}</td>
                    <td className="p-3 font-bold">{c.bookings_count}</td>
                    <td className="p-3 font-bold text-green-600">Rp {c.revenue.toLocaleString('id-ID')}</td>
                    <td className="p-3 font-bold">{c.roas.toFixed(2)}x</td>
                    <td className="p-3 font-sans">
                      <div className="flex gap-1.5">
                        {c.status === 'ACTIVE' ? (
                          <button onClick={() => handleManage('campaign', c.id, 'pause')} className="p-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200" title="Pause">
                            <Pause size={12} />
                          </button>
                        ) : (
                          <button onClick={() => handleManage('campaign', c.id, 'resume')} className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200" title="Resume">
                            <Play size={12} />
                          </button>
                        )}
                        <button onClick={() => setSelectedCampaign(selectedCampaign === c.id ? null : c.id)} className="px-2 py-1 bg-gray-100 rounded text-[11px] font-medium">
                          Detail
                        </button>
                        <button onClick={() => setRawTarget({ type: 'campaign', id: c.id })} className="p-1 bg-purple-50 text-purple-600 rounded" title="Raw Payload">
                          <FileJson size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedCampaign && (
            <SelectedCampaignDetail campaignId={selectedCampaign} dateRange={dateRange} onManage={handleManage} onInspectRaw={(type, id) => setRawTarget({ type, id })} />
          )}
        </div>
      )}

      {/* TAB 3: CREATIVES */}
      {activeTab === 'creatives' && (
        <ExplorerCreativesTab onInspectRaw={(type, id) => setRawTarget({ type, id })} />
      )}

      {/* TAB 4: BREAKDOWNS */}
      {activeTab === 'breakdowns' && (
        <ExplorerBreakdownsTab dateRange={dateRange} />
      )}

      {/* TAB 5: ACTIONS */}
      {activeTab === 'actions' && (
        <ExplorerActionsTab dateRange={dateRange} />
      )}

      {/* TAB 6: SYNC CENTER */}
      {activeTab === 'sync' && (
        <ExplorerSyncCenterTab onSyncTriggered={fetchAll} />
      )}

      {/* Raw Payload Inspector Modal */}
      {rawTarget && (
        <ExplorerRawInspectorModal
          objectType={rawTarget.type}
          objectId={rawTarget.id}
          onClose={() => setRawTarget(null)}
        />
      )}
    </div>
  );
}

function SelectedCampaignDetail({ campaignId, dateRange, onManage, onInspectRaw }: { campaignId: string; dateRange: any; onManage: any; onInspectRaw: (type: any, id: string) => void }) {
  const [adsets, setAdsets] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const params = new URLSearchParams({ campaign_id: campaignId });
      if (dateRange.start) params.set('start', dateRange.start);
      if (dateRange.end) params.set('end', dateRange.end);
      try {
        const [adsetRes, adRes] = await Promise.all([fetch(`/api/meta/adsets?${params.toString()}`), fetch(`/api/meta/ads?${params.toString()}`)]);
        const adsetData = await adsetRes.json();
        const adData = await adRes.json();
        if (adsetData.success) setAdsets(adsetData.data);
        if (adData.success) setAds(adData.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [campaignId, dateRange]);

  if (loading) return <div className="mt-4 text-xs text-gray-500 animate-pulse">Loading adsets and ads...</div>;

  return (
    <div className="mt-6 space-y-4 border-t pt-4">
      <h4 className="font-bold text-xs uppercase tracking-wider text-purple-600">AdSets for Campaign {campaignId}</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left font-mono">
          <thead>
            <tr className="text-gray-500 border-b">
              <th className="p-2">Name / ID</th>
              <th className="p-2">Status</th>
              <th className="p-2">Spend</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {adsets.map((a: any) => (
              <tr key={a.id} className="border-b">
                <td className="p-2 font-sans">
                  <span title={a.name} className="font-bold">{a.name}</span>
                  <span className="text-gray-400 font-mono ml-2 text-[10px]">{a.id}</span>
                </td>
                <td className="p-2">{a.status}</td>
                <td className="p-2 font-bold text-purple-600">Rp {(a.total_spend || 0).toLocaleString('id-ID')}</td>
                <td className="p-2 flex gap-1 font-sans">
                  {a.status === 'ACTIVE' ? (
                    <button onClick={() => onManage('adset', a.id, 'pause')} className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-[11px]">Pause</button>
                  ) : (
                    <button onClick={() => onManage('adset', a.id, 'resume')} className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[11px]">Resume</button>
                  )}
                  <button onClick={() => onInspectRaw('adset', a.id)} className="p-1 bg-purple-50 text-purple-600 rounded"><FileJson size={12} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h4 className="font-bold text-xs uppercase tracking-wider text-purple-600 mt-4">Ads for Campaign {campaignId}</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left font-mono">
          <thead>
            <tr className="text-gray-500 border-b">
              <th className="p-2">Name / ID</th>
              <th className="p-2">Status</th>
              <th className="p-2">Spend</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ads.map((ad: any) => (
              <tr key={ad.id} className="border-b">
                <td className="p-2 font-sans">
                  <span className="font-bold">{ad.name}</span> <span className="text-gray-400 font-mono text-[10px]">{ad.id}</span>
                </td>
                <td className="p-2">{ad.status}</td>
                <td className="p-2 font-bold text-purple-600">Rp {(ad.total_spend || 0).toLocaleString('id-ID')}</td>
                <td className="p-2 flex gap-1 font-sans">
                  {ad.status === 'ACTIVE' ? (
                    <button onClick={() => onManage('ad', ad.id, 'pause')} className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-[11px]">Pause</button>
                  ) : (
                    <button onClick={() => onManage('ad', ad.id, 'resume')} className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[11px]">Resume</button>
                  )}
                  <button onClick={() => onInspectRaw('ad', ad.id)} className="p-1 bg-purple-50 text-purple-600 rounded"><FileJson size={12} /></button>
                </td>
              </tr>
            ))}
            {ads.length === 0 && <tr><td colSpan={4} className="p-2 text-center text-gray-400 font-sans">No ads found for this campaign</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
