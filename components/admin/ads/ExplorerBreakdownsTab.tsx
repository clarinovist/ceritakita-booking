'use client';

import { useState, useEffect } from 'react';
import { PieChart, AlertTriangle, Users, Monitor, MapPin, Globe, RefreshCcw, TrendingUp, Search, Award, Sparkles } from 'lucide-react';

interface Props {
  dateRange: { start: string; end: string };
}

export default function ExplorerBreakdownsTab({ dateRange }: Props) {
  const [breakdownType, setBreakdownType] = useState<'demographic' | 'placement' | 'device' | 'geographic'>('demographic');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadBreakdowns() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ type: breakdownType });
        if (dateRange.start) params.set('start', dateRange.start);
        if (dateRange.end) params.set('end', dateRange.end);

        const res = await fetch(`/api/meta/breakdowns?${params.toString()}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (e) {
        console.error('Failed loading breakdown data', e);
      } finally {
        setLoading(false);
      }
    }
    loadBreakdowns();
  }, [breakdownType, dateRange]);

  const filteredData = data.filter((item) =>
    (item.breakdown_value || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalBreakdownSpend = data.reduce((acc, r) => acc + (r.total_spend || 0), 0);
  const totalBreakdownImpressions = data.reduce((acc, r) => acc + (r.total_impressions || 0), 0);
  const totalBreakdownClicks = data.reduce((acc, r) => acc + (r.total_clicks || 0), 0);

  const topPerformer = [...data].sort((a, b) => b.total_spend - a.total_spend)[0];
  const topCtrPerformer = [...data].sort((a, b) => b.avg_ctr - a.avg_ctr)[0];

  return (
    <div className="space-y-6">
      {/* Warning banner against double counting */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 text-xs text-amber-800">
        <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Penting — Aturan Agregasi Breakdown</p>
          <p className="mt-0.5 leading-relaxed">
            Data breakdown (age, gender, placement, device, geographic) diambil per dimensi terpisah. Total spend di tabel breakdown ini (Rp {totalBreakdownSpend.toLocaleString('id-ID')}) adalah **sum of slice rows**, dan **TIDAK boleh dijumlahkan** ke total overview dashboard utama agar tidak terjadi double counting.
          </p>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 flex items-center justify-between">
            Total Slice Spend <PieChart size={16} className="text-purple-600" />
          </p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            Rp {totalBreakdownSpend.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">{data.length} unique segments</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 flex items-center justify-between">
            Top Segment (Spend) <Award size={16} className="text-amber-500" />
          </p>
          <p className="text-sm font-bold text-purple-600 truncate mt-1" title={topPerformer?.breakdown_value}>
            {topPerformer?.breakdown_value || '-'}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            Rp {(topPerformer?.total_spend || 0).toLocaleString('id-ID')} ({totalBreakdownSpend > 0 ? ((topPerformer?.total_spend / totalBreakdownSpend) * 100).toFixed(1) : 0}%)
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 flex items-center justify-between">
            Highest CTR Segment <TrendingUp size={16} className="text-green-600" />
          </p>
          <p className="text-sm font-bold text-green-600 truncate mt-1" title={topCtrPerformer?.breakdown_value}>
            {topCtrPerformer?.breakdown_value || '-'}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            {(topCtrPerformer?.avg_ctr || 0).toFixed(2)}% CTR
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 flex items-center justify-between">
            Total Slice Engagement <Sparkles size={16} className="text-blue-600" />
          </p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {totalBreakdownClicks.toLocaleString()} <span className="text-xs font-normal text-gray-400">clicks</span>
          </p>
          <p className="text-[11px] text-gray-400 mt-1">{totalBreakdownImpressions.toLocaleString()} impressions</p>
        </div>
      </div>

      {/* Header controls & Type selector */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <PieChart size={20} className="text-purple-600" /> Audience & Placement Breakdown
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Performance distribution sliced by demographic, placement, device, and geographic dimensions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search segment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 border rounded-xl text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 w-48"
            />
          </div>

          <div className="flex bg-gray-100 p-1.5 rounded-xl gap-1">
            {[
              { id: 'demographic', label: 'Age & Gender', icon: Users },
              { id: 'placement', label: 'Platform & Position', icon: MapPin },
              { id: 'device', label: 'Device Platform', icon: Monitor },
              { id: 'geographic', label: 'Geographic / Region', icon: Globe },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = breakdownType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setBreakdownType(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                    active ? 'bg-white shadow-sm text-purple-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon size={14} /> {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Visual Bar Distribution Card */}
      {!loading && filteredData.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500">Spend Share Distribution Visual</h4>
          <div className="space-y-3">
            {filteredData.slice(0, 8).map((row, idx) => {
              const pct = totalBreakdownSpend > 0 ? (row.total_spend / totalBreakdownSpend) * 100 : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gray-900">{row.breakdown_value || 'Unknown'}</span>
                    <span className="font-mono text-gray-500">Rp {(row.total_spend || 0).toLocaleString('id-ID')} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 1)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Breakdown Data Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400 animate-pulse flex items-center justify-center gap-2">
            <RefreshCcw size={16} className="animate-spin text-purple-600" /> Loading breakdown data...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b bg-gray-50 text-gray-500">
                  <th className="p-3">Dimension Slice Value</th>
                  <th className="p-3">Spend</th>
                  <th className="p-3">% of Slice Spend</th>
                  <th className="p-3">Impressions</th>
                  <th className="p-3">Clicks</th>
                  <th className="p-3">Avg CPC</th>
                  <th className="p-3">Avg CTR</th>
                  <th className="p-3">Recorded Rows</th>
                </tr>
              </thead>
              <tbody className="divide-y font-mono">
                {filteredData.map((row, idx) => {
                  const spendPct = totalBreakdownSpend > 0 ? ((row.total_spend / totalBreakdownSpend) * 100).toFixed(1) : '0';
                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-3 font-sans font-bold text-gray-900">{row.breakdown_value || 'Unknown'}</td>
                      <td className="p-3 font-bold text-purple-600">Rp {(row.total_spend || 0).toLocaleString('id-ID')}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div className="bg-purple-600 h-full rounded-full" style={{ width: `${spendPct}%` }} />
                          </div>
                          <span>{spendPct}%</span>
                        </div>
                      </td>
                      <td className="p-3 text-gray-600">{(row.total_impressions || 0).toLocaleString()}</td>
                      <td className="p-3 text-gray-600">{(row.total_clicks || 0).toLocaleString()}</td>
                      <td className="p-3 text-gray-600">Rp {Math.round(row.avg_cpc || 0).toLocaleString('id-ID')}</td>
                      <td className="p-3 text-gray-600">{(row.avg_ctr || 0).toFixed(2)}%</td>
                      <td className="p-3 text-gray-400">{row.row_count || 0}</td>
                    </tr>
                  );
                })}

                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400 font-sans">
                      No breakdown records for {breakdownType} in this date range. Go to Sync Center and trigger &quot;Breakdowns&quot; sync.
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
