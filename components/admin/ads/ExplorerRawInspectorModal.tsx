'use client';

import { useState, useEffect } from 'react';
import { X, Copy, Check, Search, FileJson } from 'lucide-react';

interface Props {
  objectType: 'account' | 'campaign' | 'adset' | 'ad' | 'creative' | 'insight';
  objectId: string;
  onClose: () => void;
}

export default function ExplorerRawInspectorModal({ objectType, objectId, onClose }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadRaw() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/meta/raw?type=${objectType}&id=${encodeURIComponent(objectId)}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || 'Failed to fetch raw payload');
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    if (objectId) loadRaw();
  }, [objectType, objectId]);

  const rawJsonString = data?.raw_parsed
    ? JSON.stringify(data.raw_parsed, null, 2)
    : data?.raw_json || '{}';

  const handleCopy = () => {
    navigator.clipboard.writeText(rawJsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-xl">
              <FileJson size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                Raw Inspector <span className="text-xs font-mono uppercase bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 px-2 py-0.5 rounded-full">{objectType}</span>
              </h3>
              <p className="text-xs text-gray-500 font-mono">ID: {objectId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition"
            >
              {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy JSON'}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-6 flex flex-col gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search key or value in raw JSON..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border dark:border-gray-800 rounded-xl text-sm bg-gray-50 dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center p-12 text-sm text-gray-400 animate-pulse">
              Loading raw payload...
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center p-12 text-sm text-red-500">
              {error}
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
        <div className="px-6 py-3 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50 flex justify-between items-center text-xs text-gray-500">
          <span>Synced: {data?.synced_at || data?.updated_at || 'N/A'}</span>
          <span>Redacted security tokens enforced</span>
        </div>
      </div>
    </div>
  );
}
