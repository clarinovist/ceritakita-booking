'use client';

import { useCallback, useEffect, useState } from 'react';
import { Target, TrendingUp, Users, DollarSign, AlertCircle, Play, Pause, RefreshCcw, BarChart3, Zap, ExternalLink } from 'lucide-react';

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
  bookings: any[];
}

export default function MetaAdsDashboard({ dateRange }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<any>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (dateRange.start) params.set('start', dateRange.start);
      if (dateRange.end) params.set('end', dateRange.end);

      const [campRes, funnelRes, insightsRes, healthRes] = await Promise.all([
        fetch(`/api/meta/campaigns?${params.toString()}`),
        fetch(`/api/meta/attribution?${params.toString()}`),
        fetch(`/api/meta/insights-db?${params.toString()}&limit=60`),
        fetch('/api/meta/health').catch(() => null),
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

  const totals = funnel?.totals;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 /> Meta Ads Manager
            {health && !health.valid && <span className="text-sm bg-red-100 text-red-700 px-2 py-1 rounded">Token invalid: {health.error}</span>}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Source: DB lokal (synced from Meta). Full attribution: Ads → WA → Leads → Bookings → Revenue.
            {health?.valid && <span className="ml-2 text-green-600">Token OK ({health.tokenPreview})</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchAll()}
            className="px-3 py-2 bg-white border rounded-lg text-sm flex items-center gap-1 hover:bg-gray-50"
          >
            <RefreshCcw size={14} /> Refresh DB
          </button>
          <button
            onClick={() => triggerSync(false)}
            disabled={syncing}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-purple-700 disabled:opacity-50"
          >
            {syncing ? 'Syncing...' : <><Zap size={14} /> Sync 7d</>}
          </button>
          <button
            onClick={() => triggerSync(true)}
            disabled={syncing}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            Full Sync
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
          <AlertCircle size={20} className="text-red-600" />
          <div>
            <p className="font-semibold text-red-800">Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Funnel totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl shadow border">
              <div className="flex justify-between mb-2">
                <Target size={20} className="text-purple-600" />
                <span className="text-xs text-gray-400">{dateRange.start} → {dateRange.end}</span>
              </div>
              <p className="text-sm text-gray-500">Spend</p>
              <p className="text-2xl font-bold text-purple-700">Rp {(totals?.spend || 0).toLocaleString('id-ID')}</p>
              <p className="text-xs text-gray-400 mt-1">{totals?.impressions?.toLocaleString()} impr · {totals?.reach?.toLocaleString()} reach</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow border">
              <div className="flex justify-between mb-2">
                <TrendingUp size={20} className="text-orange-600" />
              </div>
              <p className="text-sm text-gray-500">WA Clicks</p>
              <p className="text-2xl font-bold text-orange-700">{totals?.waClicks || 0}</p>
              <p className="text-xs text-gray-400 mt-1">{totals?.clicks ? `${((totals.waClicks / totals.clicks) * 100).toFixed(1)}% from ad clicks` : '-'}</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow border">
              <div className="flex justify-between mb-2">
                <Users size={20} className="text-blue-600" />
              </div>
              <p className="text-sm text-gray-500">Leads / Bookings</p>
              <p className="text-2xl font-bold text-blue-700">{totals?.leads || 0} / {totals?.bookings || 0}</p>
              <p className="text-xs text-gray-400 mt-1">Leads total · bookings converted</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow border">
              <div className="flex justify-between mb-2">
                <DollarSign size={20} className="text-green-600" />
              </div>
              <p className="text-sm text-gray-500">Revenue / ROAS</p>
              <p className="text-2xl font-bold text-green-700">Rp {(totals?.revenue || 0).toLocaleString('id-ID')}</p>
              <p className="text-xs text-gray-400 mt-1">{totals?.spend ? `${(totals.revenue / totals.spend).toFixed(2)}x ROAS` : 'No spend'}</p>
            </div>
          </div>

          {/* Funnel visual */}
          <div className="bg-white p-6 rounded-xl shadow border">
            <h3 className="font-bold mb-4">Attribution Funnel</h3>
            <div className="flex flex-wrap items-center gap-2 text-sm">
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
                  <div className="bg-gray-100 px-3 py-2 rounded-lg border">
                    <p className="text-xs text-gray-500">{step.label}</p>
                    <p className="font-semibold">{step.value}</p>
                  </div>
                  {i < 6 && <div className="text-gray-400">→</div>}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <p className="text-sm font-semibold mb-2">WA Clicks by source</p>
                <div className="space-y-1">
                  {funnel?.waBySource?.slice(0, 10).map((r: any) => (
                    <div key={r.source} className="flex justify-between text-sm bg-gray-50 px-2 py-1 rounded">
                      <span>{r.source}</span>
                      <span className="font-medium">{r.cnt}</span>
                    </div>
                  ))}
                  {(!funnel?.waBySource || funnel.waBySource.length === 0) && <p className="text-xs text-gray-400">No data</p>}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">Leads by source</p>
                <div className="space-y-1">
                  {funnel?.leadsBySource?.slice(0, 10).map((r: any) => (
                    <div key={r.source} className="flex justify-between text-sm bg-gray-50 px-2 py-1 rounded">
                      <span>{r.source}</span>
                      <span className="font-medium">{r.cnt}</span>
                    </div>
                  ))}
                  {(!funnel?.leadsBySource || funnel.leadsBySource.length === 0) && <p className="text-xs text-gray-400">No data</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Insights daily chart simple */}
          <div className="bg-white p-6 rounded-xl shadow border">
            <h3 className="font-bold mb-3">Daily Insights (DB)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="p-2">Date</th>
                    <th className="p-2">Campaign</th>
                    <th className="p-2">Ad</th>
                    <th className="p-2">Spend</th>
                    <th className="p-2">Impr</th>
                    <th className="p-2">Clicks</th>
                    <th className="p-2">CTR</th>
                    <th className="p-2">CPC</th>
                  </tr>
                </thead>
                <tbody>
                  {insights.slice(0, 20).map((row: any, i: number) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="p-2">{row.date_record}</td>
                      <td className="p-2 truncate max-w-[150px]">{row.campaign_id}</td>
                      <td className="p-2 truncate max-w-[120px]">{row.ad_id || '-'}</td>
                      <td className="p-2">{Number(row.spend).toLocaleString('id-ID')}</td>
                      <td className="p-2">{row.impressions}</td>
                      <td className="p-2">{row.inline_link_clicks}</td>
                      <td className="p-2">{row.ctr?.toFixed ? row.ctr.toFixed(2) : row.ctr}%</td>
                      <td className="p-2">{Number(row.cpc || 0).toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                  {insights.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-gray-400">
                        No insights yet. Trigger Sync.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Campaigns table */}
          <div className="bg-white p-6 rounded-xl shadow border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Campaigns</h3>
              <span className="text-xs text-gray-500">{campaigns.length} campaigns</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="p-2">Name</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Budget</th>
                    <th className="p-2">Spend</th>
                    <th className="p-2">Imp</th>
                    <th className="p-2">Clicks</th>
                    <th className="p-2">Leads</th>
                    <th className="p-2">Bookings</th>
                    <th className="p-2">Rev</th>
                    <th className="p-2">ROAS</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id} className={`border-b hover:bg-gray-50 ${selectedCampaign === c.id ? 'bg-purple-50' : ''}`}>
                      <td className="p-2">
                        <div className="max-w-[200px]">
                          <p className="font-medium truncate" title={c.name}>
                            {c.name}
                          </p>
                          <p className="text-xs text-gray-400">{c.id}</p>
                        </div>
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{c.status}</span>
                      </td>
                      <td className="p-2">{c.daily_budget ? `Rp ${c.daily_budget.toLocaleString('id-ID')}` : '-'}</td>
                      <td className="p-2">Rp {c.total_spend.toLocaleString('id-ID')}</td>
                      <td className="p-2">{c.total_impressions.toLocaleString()}</td>
                      <td className="p-2">{c.total_clicks.toLocaleString()}</td>
                      <td className="p-2">{c.leads_count}</td>
                      <td className="p-2">{c.bookings_count}</td>
                      <td className="p-2">Rp {c.revenue.toLocaleString('id-ID')}</td>
                      <td className="p-2">
                        <span className={c.roas >= 2 ? 'text-green-600 font-bold' : c.roas >= 1 ? 'text-amber-600' : 'text-red-600'}>{c.roas.toFixed(2)}x</span>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          {c.status === 'ACTIVE' ? (
                            <button onClick={() => handleManage('campaign', c.id, 'pause')} className="p-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200" title="Pause">
                              <Pause size={14} />
                            </button>
                          ) : (
                            <button onClick={() => handleManage('campaign', c.id, 'resume')} className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200" title="Resume">
                              <Play size={14} />
                            </button>
                          )}
                          <button onClick={() => setSelectedCampaign(selectedCampaign === c.id ? null : c.id)} className="px-2 py-1 bg-gray-100 rounded text-xs">
                            Detail
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {campaigns.length === 0 && (
                    <tr>
                      <td colSpan={11} className="p-4 text-center text-gray-400">
                        No campaigns. Sync to populate.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {selectedCampaign && (
              <SelectedCampaignDetail campaignId={selectedCampaign} dateRange={dateRange} onManage={handleManage} />
            )}
          </div>

          {/* Recommended URL template */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
            <h4 className="font-semibold text-blue-800 flex items-center gap-2">
              <ExternalLink size={16} /> Rekomendasi URL Template Iklan
            </h4>
            <p className="text-sm text-blue-700 mt-1">
              Agar attribution 100% akurat (campaign_id/ad_id masuk), set di Meta Ads Manager → Ad → Website URL:
            </p>
            <code className="block bg-white p-2 rounded mt-2 text-xs break-all border">
              {'https://ceritakitastudio.site/?utm_source=facebook&utm_medium=cpc&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&campaign_id={{campaign.id}}&adset_id={{adset.id}}&ad_id={{ad.id}}'}
            </code>
            <p className="text-xs text-blue-600 mt-2">WA redirect otomatis tangkap & match ke DB.</p>
          </div>
        </>
      )}
    </div>
  );
}

function SelectedCampaignDetail({ campaignId, dateRange, onManage }: { campaignId: string; dateRange: any; onManage: any }) {
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

  if (loading) return <div className="mt-4 text-sm text-gray-500">Loading adsets/ads...</div>;

  return (
    <div className="mt-6 space-y-4 border-t pt-4">
      <h4 className="font-semibold">AdSets for {campaignId}</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 border-b">
              <th className="p-2 text-left">Name</th>
              <th className="p-2">Status</th>
              <th className="p-2">Spend</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {adsets.map((a: any) => (
              <tr key={a.id} className="border-b">
                <td className="p-2">
                  <span title={a.name}>{a.name?.slice(0, 60)}</span>
                  <span className="text-gray-400 ml-1 text-[10px]">{a.id}</span>
                </td>
                <td className="p-2">{a.status}</td>
                <td className="p-2">Rp {(a.total_spend || 0).toLocaleString('id-ID')}</td>
                <td className="p-2 flex gap-1">
                  {a.status === 'ACTIVE' ? (
                    <button onClick={() => onManage('adset', a.id, 'pause')} className="px-2 py-1 bg-orange-100 rounded">
                      Pause
                    </button>
                  ) : (
                    <button onClick={() => onManage('adset', a.id, 'resume')} className="px-2 py-1 bg-green-100 rounded">
                      Resume
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h4 className="font-semibold mt-4">Ads for {campaignId}</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 border-b">
              <th className="p-2 text-left">Name</th>
              <th className="p-2">Status</th>
              <th className="p-2">Spend</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ads.map((ad: any) => (
              <tr key={ad.id} className="border-b">
                <td className="p-2">
                  {ad.name?.slice(0, 80)} <span className="text-gray-400 text-[10px]">{ad.id}</span>
                </td>
                <td className="p-2">{ad.status}</td>
                <td className="p-2">Rp {(ad.total_spend || 0).toLocaleString('id-ID')}</td>
                <td className="p-2 flex gap-1">
                  {ad.status === 'ACTIVE' ? (
                    <button onClick={() => onManage('ad', ad.id, 'pause')} className="px-2 py-1 bg-orange-100 rounded">
                      Pause
                    </button>
                  ) : (
                    <button onClick={() => onManage('ad', ad.id, 'resume')} className="px-2 py-1 bg-green-100 rounded">
                      Resume
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {ads.length === 0 && <tr><td colSpan={4} className="p-2 text-center text-gray-400">No ads</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
