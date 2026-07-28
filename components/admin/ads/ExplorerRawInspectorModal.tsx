'use client';

import { useState, useEffect } from 'react';
import { X, Search, Copy, Check, FileJson, AlertCircle } from 'lucide-react';

interface Props {
  objectType: 'account' | 'campaign' | 'adset' | 'ad' | 'creative' | 'insight';
  objectId: string;
  onClose: () => void;
}

export default function ExplorerRawInspectorModal({ objectType, objectId, onClose }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadRawPayload() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/meta/raw?type=${objectType}&id=${encodeURIComponent(objectId)}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || 'Failed loading raw payload');
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadRawPayload();
  }, [objectType, objectId]);

  const rawJsonString = data ? JSON.stringify(data, null, 2) : '';

  const handleCopy = () => {
    if (!rawJsonString) return;
    navigator.clipboard.writeText(rawJsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <FileJson size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                Raw Payload Inspector
                <span className="text-xs uppercase px-2 py-0.5 bg-purple-100 text-purple-700 font-mono rounded-md font-semibold">
                  {objectType}
                </span>
              </h3>
              <p className="text-xs text-gray-500 font-mono">Target ID: {objectId}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search JSON key or value..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            onClick={handleCopy}
            disabled={!data}
            className="px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
          >
            {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy JSON'}
          </button>
        </div>

        {/* Payload Content Area */}
        <div className="flex-1 overflow-hidden p-6 flex flex-col bg-white">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-400 animate-pulse font-mono">
              Loading raw Graph API JSON payload...
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          ) : (
            <div className="flex-1 overflow-auto rounded-xl bg-gray-950 text-gray-100 p-4 font-mono text-xs leading-relaxed">
              <pre className="whitespace-pre-wrap break-all">
                {search
                  ? rawJsonString
                      .split('\n')
                      .filter((line: string) => line.toLowerCase().includes(search.toLowerCase()))
                      .join('\n') || '// No matching keys found'
                  : rawJsonString}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <span>Format: Full Un-truncated Graph API Payload</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
