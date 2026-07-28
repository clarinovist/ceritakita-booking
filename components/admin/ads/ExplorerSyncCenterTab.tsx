'use client';

import { useState, useEffect } from 'react';
import { RefreshCcw, Zap, AlertCircle, CheckCircle2, ShieldCheck, Database, Layers, Clock, ShieldAlert } from 'lucide-react';

interface Props {
  onSyncTriggered?: () => void;
}

export default function ExplorerSyncCenterTab({ onSyncTriggered }: Props) {
  const [capabilities, setCapabilities] = useState<any[]>([]);
  const [syncRuns, setSyncRuns] = useState<any[]>([]);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState<any>(null);
  const [selectedDays, setSelectedDays] = useState(30);

  const fetchSyncCenterData = async () => {
    try {
      const [capRes, runRes] = await Promise.all([
        fetch('/api/meta/capabilities'),
        fetch('/api/meta/sync?limit=15'),
      ]);
      const capData = await capRes.json();
      const runData = await runRes.json();

      if (capData.success) setCapabilities(capData.data);
      if (runData.success) setSyncRuns(runData.data);
    } catch (e: any) {
      console.error('Failed loading Sync Center data', e);
    }
  };

  useEffect(() => {
    fetchSyncCenterData();
  }, []);

  const triggerScopedSync = async (scope: string) => {
    setSyncing(scope);
    try {
      const res = await fetch(`/api/meta/sync?scope=${encodeURIComponent(scope)}&days=${selectedDays}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success || data.synced) {
        await fetchSyncCenterData();
        if (onSyncTriggered) onSyncTriggered();
      } else {
        alert(data.error || 'Sync failed');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSyncing(null);
    }
  };

  const triggerReconciliation = async () => {
    setReconciling(true);
    setReconcileResult(null);
    try {
      const res = await fetch('/api/meta/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: selectedDays }),
      });
      const data = await res.json();
      setReconcileResult(data);
      await fetchSyncCenterData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setReconciling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sync Control & Days Selector Bar */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Zap size={20} className="text-purple-600" /> Scoped Sync Controls & Reconciliation Center
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Trigger granular background ingestion scopes and verify database consistency against live Graph API.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 border border-gray-200 rounded-xl text-xs">
            <Clock size={14} className="text-gray-400" />
            <span className="text-gray-500 font-medium">Sync Window:</span>
            <select
              value={selectedDays}
              onChange={(e) => setSelectedDays(Number(e.target.value))}
              className="bg-transparent font-bold focus:outline-none cursor-pointer text-gray-800"
            >
              <option value={7}>7 Days</option>
              <option value={14}>14 Days</option>
              <option value={30}>30 Days</option>
              <option value={90}>90 Days</option>
            </select>
          </div>

          <button
            onClick={triggerReconciliation}
            disabled={reconciling}
            className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-xl text-xs flex items-center gap-1.5 hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm"
          >
            {reconciling ? 'Reconciling...' : <><ShieldCheck size={14} /> Live Reconciliation Check</>}
          </button>
        </div>
      </div>

      {/* Reconciliation Result Card */}
      {reconcileResult && (
        <div className={`p-5 rounded-2xl border ${reconcileResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-bold text-sm flex items-center gap-2">
                {reconcileResult.success ? <CheckCircle2 size={18} className="text-emerald-600" /> : <AlertCircle size={18} className="text-red-600" />}
                Reconciliation Audit Results ({reconcileResult.days} Days)
              </h4>
              <p className="text-xs mt-1 leading-relaxed">
                Graph API Live Spend: <strong>Rp {Number(reconcileResult.graphApiTotalSpend || 0).toLocaleString('id-ID')}</strong> | Local Database Spend: <strong>Rp {Number(reconcileResult.dbTotalSpend || 0).toLocaleString('id-ID')}</strong>
              </p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${reconcileResult.status === 'MATCH' ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'}`}>
              {reconcileResult.status || 'CHECKED'}
            </span>
          </div>
        </div>
      )}

      {/* Scoped Sync Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { scope: 'capabilities', title: 'Capabilities Matrix', desc: 'Probe Meta Graph API token permissions & endpoints.', icon: ShieldAlert },
          { scope: 'account', title: 'Account Metadata', desc: 'Sync currency, timezone, spend cap, balance.', icon: Database },
          { scope: 'objects', title: 'Objects & Hierarchy', desc: 'Fetch all Campaigns, AdSets, and Ads.', icon: Layers },
          { scope: 'creatives', title: 'Ad Creatives', desc: 'Fetch Headlines, Body Copy, CTAs & Thumbnails.', icon: Zap },
          { scope: 'insights:campaign', title: 'Campaign Insights', desc: 'Daily canonical facts at campaign level.', icon: RefreshCcw },
          { scope: 'insights:adset', title: 'AdSet Insights', desc: 'Daily facts sliced at adset level.', icon: RefreshCcw },
          { scope: 'insights:ad', title: 'Ad Level Insights', desc: 'Daily facts sliced at ad level.', icon: RefreshCcw },
          { scope: 'breakdowns', title: 'Audience Breakdowns', desc: 'Sync Age, Gender, Placement, Device, Region.', icon: RefreshCcw },
        ].map((item) => {
          const Icon = item.icon;
          const isBusy = syncing === item.scope;
          return (
            <div key={item.scope} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                    <Icon size={18} />
                  </div>
                  <span className="text-[10px] font-mono font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {item.scope}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-gray-900">{item.title}</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
              </div>

              <button
                onClick={() => triggerScopedSync(item.scope)}
                disabled={isBusy}
                className="w-full py-2 bg-gray-50 hover:bg-purple-50 text-purple-600 font-semibold rounded-xl text-xs border border-purple-100 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isBusy ? (
                  <>
                    <RefreshCcw size={12} className="animate-spin" /> Ingesting...
                  </>
                ) : (
                  <>
                    <Zap size={12} /> Sync Scope
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Capability Matrix Section */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck size={18} className="text-purple-600" /> Active Token Capabilities Matrix ({capabilities.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
          {capabilities.map((cap) => (
            <div
              key={cap.capability_key}
              className={`p-3 rounded-xl border flex items-center justify-between ${
                cap.supported ? 'bg-green-50/50 border-green-200 text-green-900' : 'bg-red-50/50 border-red-200 text-red-900'
              }`}
            >
              <span className="font-semibold text-xs truncate mr-2" title={cap.capability_key}>
                {cap.capability_key}
              </span>
              {cap.supported ? (
                <span className="text-[10px] bg-green-200 text-green-800 font-bold px-2 py-0.5 rounded-full">Active</span>
              ) : (
                <span className="text-[10px] bg-red-200 text-red-800 font-bold px-2 py-0.5 rounded-full" title={cap.error_message}>
                  Error
                </span>
              )}
            </div>
          ))}

          {capabilities.length === 0 && (
            <div className="col-span-full p-4 text-center text-gray-400 font-sans text-xs">
              No capability checks logged yet. Click &quot;Capabilities Matrix&quot; scope sync above.
            </div>
          )}
        </div>
      </div>

      {/* Sync Execution Runs Log Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm space-y-3 p-6">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Clock size={18} className="text-purple-600" /> Recent Sync Execution History
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b bg-gray-50 text-gray-500">
                <th className="p-2.5">Run ID</th>
                <th className="p-2.5">Scope</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5">Trigger</th>
                <th className="p-2.5">Records Ingested</th>
                <th className="p-2.5">Duration</th>
                <th className="p-2.5">Start Time</th>
              </tr>
            </thead>
            <tbody className="divide-y font-mono">
              {syncRuns.map((run) => (
                <tr key={run.id} className="hover:bg-gray-50">
                  <td className="p-2.5 font-bold text-purple-600">#{run.id}</td>
                  <td className="p-2.5 font-sans font-semibold">{run.scope}</td>
                  <td className="p-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        run.status === 'SUCCESS'
                          ? 'bg-green-100 text-green-700'
                          : run.status === 'RUNNING'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {run.status}
                    </span>
                  </td>
                  <td className="p-2.5 text-gray-500">{run.triggered_by}</td>
                  <td className="p-2.5 font-bold">{run.records_count || 0}</td>
                  <td className="p-2.5 text-gray-500">{run.duration_ms ? `${run.duration_ms}ms` : '-'}</td>
                  <td className="p-2.5 text-gray-400 text-[10px]">{run.started_at ? new Date(run.started_at).toLocaleString() : '-'}</td>
                </tr>
              ))}

              {syncRuns.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-400 font-sans">
                    No sync run history recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
