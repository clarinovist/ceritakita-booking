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

  const triggerScopedSync = async (scope: string, days = selectedDays, full = false) => {
    setSyncing(scope);
    try {
      const res = await fetch(`/api/meta/sync?days=${days}&full=${full ? '1' : '0'}&scope=${scope}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        alert(`Sync scope '${scope}' finished: ${data.insights || 0} insights, ${data.campaigns || 0} campaigns synced.`);
        fetchSyncCenterData();
        onSyncTriggered?.();
      } else {
        alert(`Sync error: ${data.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      alert(`Sync failed: ${e.message}`);
    } finally {
      setSyncing(null);
    }
  };

  const handleReconcile = async () => {
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
    } catch (e: any) {
      alert(`Reconcile failed: ${e.message}`);
    } finally {
      setReconciling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Zap className="text-purple-600" size={20} /> Sync Center & Capability Matrix
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Execute scoped ingestion pipelines, inspect API token permissions, and reconcile local DB facts against live Meta Graph API.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-xl text-xs">
            <Clock size={14} className="text-gray-500" /> Range:
            <select
              value={selectedDays}
              onChange={(e) => setSelectedDays(Number(e.target.value))}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              <option value={7}>7 Days</option>
              <option value={14}>14 Days</option>
              <option value={30}>30 Days</option>
              <option value={60}>60 Days</option>
              <option value={90}>90 Days</option>
            </select>
          </div>

          <button
            onClick={handleReconcile}
            disabled={reconciling}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl flex items-center gap-2 transition disabled:opacity-50"
          >
            <ShieldCheck size={14} />
            {reconciling ? 'Reconciling...' : 'Run Live Reconciliation'}
          </button>
        </div>
      </div>

      {/* Reconciliation result alert */}
      {reconcileResult && (
        <div className={`p-5 rounded-2xl border ${reconcileResult.reconciled ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900' : 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900'} space-y-2`}>
          <div className="flex items-center justify-between">
            <h4 className={`font-bold text-sm flex items-center gap-2 ${reconcileResult.reconciled ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'}`}>
              {reconcileResult.reconciled ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              Reconciliation Result ({reconcileResult.range?.since} → {reconcileResult.range?.until})
            </h4>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white/50 dark:bg-black/30">
              {reconcileResult.reconciled ? 'RECONCILED 100%' : 'VARIANCE DETECTED'}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-2">
            <div className="bg-white/60 dark:bg-gray-900/60 p-3 rounded-xl">
              <p className="text-gray-500">Live Meta Spend</p>
              <p className="font-bold text-sm">Rp {(reconcileResult.metaLive?.spend || 0).toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-white/60 dark:bg-gray-900/60 p-3 rounded-xl">
              <p className="text-gray-500">Local DB Spend</p>
              <p className="font-bold text-sm">Rp {(reconcileResult.dbLocal?.spend || 0).toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-white/60 dark:bg-gray-900/60 p-3 rounded-xl">
              <p className="text-gray-500">Difference</p>
              <p className="font-bold text-sm">Rp {(reconcileResult.difference?.spendDiff || 0).toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-white/60 dark:bg-gray-900/60 p-3 rounded-xl">
              <p className="text-gray-500">Status</p>
              <p className="font-bold text-sm">{reconcileResult.reconciled ? 'Accurate' : 'Sync recommended'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Scoped Sync Controls */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2 text-sm">
          <Layers size={16} className="text-purple-600" /> Scoped Ingestion Actions
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { scope: 'capabilities', label: 'Capability Probe', desc: 'Verify Token Scopes' },
            { scope: 'account', label: 'Account Info', desc: 'Sync Balance & Currency' },
            { scope: 'objects', label: 'Campaigns/Sets/Ads', desc: 'Sync Hierarchy Objects' },
            { scope: 'creatives', label: 'Ad Creatives', desc: 'Sync Assets & Copy' },
            { scope: 'insights:campaign', label: 'Campaign Insights', desc: 'Daily Campaign Facts' },
            { scope: 'insights:adset', label: 'Adset Insights', desc: 'Daily Adset Facts' },
            { scope: 'insights:ad', label: 'Ad Insights', desc: 'Daily Ad Facts' },
            { scope: 'breakdowns', label: 'Breakdowns', desc: 'Age/Gender/Placement' },
          ].map((item) => (
            <button
              key={item.scope}
              onClick={() => triggerScopedSync(item.scope)}
              disabled={syncing !== null}
              className="p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-purple-50 dark:hover:bg-purple-950/30 border border-gray-200 dark:border-gray-700/60 rounded-xl text-left transition group disabled:opacity-50"
            >
              <p className="font-bold text-xs text-gray-900 dark:text-gray-100 group-hover:text-purple-600 flex justify-between items-center">
                {item.label}
                {syncing === item.scope ? <RefreshCcw size={12} className="animate-spin text-purple-600" /> : <Zap size={12} className="text-gray-400 group-hover:text-purple-600" />}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">{item.desc}</p>
            </button>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t dark:border-gray-800 flex justify-between items-center">
          <p className="text-xs text-gray-500">Need full backfill across all data domains?</p>
          <button
            onClick={() => triggerScopedSync('all', selectedDays, true)}
            disabled={syncing !== null}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-xl flex items-center gap-2 shadow-sm transition disabled:opacity-50"
          >
            <Database size={14} /> Full Deep Backfill ({selectedDays} Days)
          </button>
        </div>
      </div>

      {/* Two column layout: Capabilities & Sync History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Capability Matrix */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <ShieldCheck size={16} className="text-green-600" /> Capability Matrix ({capabilities.length})
            </h4>
            <button
              onClick={() => triggerScopedSync('capabilities')}
              className="text-xs text-purple-600 hover:underline flex items-center gap-1"
            >
              <RefreshCcw size={12} /> Probe
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b dark:border-gray-800 text-gray-500">
                  <th className="py-2">Capability</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Last Checked</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-800">
                {capabilities.map((cap) => (
                  <tr key={cap.capability_key} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="py-2 font-mono text-[11px] font-medium text-gray-800 dark:text-gray-200">{cap.capability_key}</td>
                    <td className="py-2">
                      {cap.supported ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 rounded-full text-[10px] font-semibold flex items-center gap-1 w-fit">
                          <CheckCircle2 size={10} /> Supported
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 rounded-full text-[10px] font-semibold flex items-center gap-1 w-fit" title={cap.error_message}>
                          <ShieldAlert size={10} /> Restricted
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-gray-500 font-mono text-[10px]">{cap.last_checked_at ? new Date(cap.last_checked_at).toLocaleTimeString() : 'N/A'}</td>
                  </tr>
                ))}
                {capabilities.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-gray-400">
                      No capabilities recorded. Click Probe to discover token permissions.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sync Runs History */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Clock size={16} className="text-blue-600" /> Recent Sync Runs
            </h4>
            <button onClick={fetchSyncCenterData} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <RefreshCcw size={12} /> Refresh Logs
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b dark:border-gray-800 text-gray-500">
                  <th className="py-2">ID / Scope</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Records</th>
                  <th className="py-2">Started</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-800">
                {syncRuns.map((run) => (
                  <tr key={run.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="py-2 font-mono text-[11px]">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">#{run.id}</div>
                      <div className="text-[10px] text-gray-400 truncate max-w-[140px]" title={run.scope}>{run.scope}</div>
                    </td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        run.status === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' :
                        run.status === 'partial' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                        'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                      }`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="py-2 font-mono font-medium">{run.records_synced || 0}</td>
                    <td className="py-2 text-gray-500 font-mono text-[10px]">
                      {run.started_at ? new Date(run.started_at).toLocaleTimeString() : '-'}
                    </td>
                  </tr>
                ))}
                {syncRuns.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400">
                      No sync runs logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
