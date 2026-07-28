'use client';

import { useState, useEffect } from 'react';
import { Image as ImageIcon, Search, FileJson, LayoutGrid, List, Sparkles } from 'lucide-react';

interface Props {
  onInspectRaw: (type: 'creative', id: string) => void;
}

export default function ExplorerCreativesTab({ onInspectRaw }: Props) {
  const [creatives, setCreatives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    async function loadCreatives() {
      setLoading(true);
      try {
        const res = await fetch(`/api/meta/objects?type=creative&limit=100${search ? `&search=${encodeURIComponent(search)}` : ''}`);
        const json = await res.json();
        if (json.success) {
          setCreatives(json.data);
        }
      } catch (e) {
        console.error('Failed loading creatives', e);
      } finally {
        setLoading(false);
      }
    }
    loadCreatives();
  }, [search]);

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Sparkles size={20} className="text-purple-600" /> Ad Creatives Explorer ({creatives.length})
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Visual inspection of headlines, ad copy, thumbnails, CTAs, and underlying story specifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search headline or body..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border dark:border-gray-800 rounded-xl text-xs bg-gray-50 dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-purple-500 w-64"
            />
          </div>

          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 font-medium transition ${viewMode === 'grid' ? 'bg-white dark:bg-gray-900 shadow-sm text-purple-600' : 'text-gray-500'}`}
            >
              <LayoutGrid size={14} /> Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 font-medium transition ${viewMode === 'table' ? 'bg-white dark:bg-gray-900 shadow-sm text-purple-600' : 'text-gray-500'}`}
            >
              <List size={14} /> Table
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {creatives.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {/* Image Thumbnail */}
                <div className="relative h-44 bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                  {item.thumbnail_url ? (
                    <img src={item.thumbnail_url} alt={item.title || 'Creative'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <ImageIcon size={32} />
                      <span className="text-xs font-mono">No Image Preview</span>
                    </div>
                  )}
                  {item.call_to_action && (
                    <span className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {item.call_to_action}
                    </span>
                  )}
                </div>

                {/* Text Metadata */}
                <div className="p-5 space-y-3">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 line-clamp-1" title={item.title}>
                      {item.title || 'Untitled Creative'}
                    </h4>
                    <p className="text-[11px] font-mono text-purple-600 mt-0.5">ID: {item.id}</p>
                  </div>

                  {item.body && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                      {item.body}
                    </p>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-5 py-3 border-t dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/30 flex items-center justify-between text-xs">
                <span className="text-gray-400 font-mono text-[10px]">
                  Synced: {item.synced_at ? new Date(item.synced_at).toLocaleDateString() : 'N/A'}
                </span>
                <button
                  onClick={() => onInspectRaw('creative', item.id)}
                  className="px-3 py-1 bg-white dark:bg-gray-800 hover:bg-purple-50 text-purple-600 dark:text-purple-400 font-medium rounded-lg border border-purple-200 dark:border-purple-900/50 flex items-center gap-1 transition text-[11px]"
                >
                  <FileJson size={12} /> Inspect Raw
                </button>
              </div>
            </div>
          ))}

          {creatives.length === 0 && (
            <div className="col-span-full py-16 text-center text-gray-400 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800">
              <Sparkles size={32} className="mx-auto mb-2 text-gray-300" />
              <p className="font-medium text-sm">No creatives ingested yet</p>
              <p className="text-xs text-gray-500 mt-1">Go to Sync Center and trigger &quot;Ad Creatives&quot; sync.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-500">
                  <th className="p-3">Creative ID</th>
                  <th className="p-3">Title / Headline</th>
                  <th className="p-3">Body Copy</th>
                  <th className="p-3">CTA</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-800">
                {creatives.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="p-3 font-mono font-medium text-purple-600">{item.id}</td>
                    <td className="p-3 font-bold max-w-[200px] truncate" title={item.title}>{item.title || '-'}</td>
                    <td className="p-3 max-w-[300px] truncate text-gray-600 dark:text-gray-400" title={item.body}>{item.body || '-'}</td>
                    <td className="p-3 uppercase font-semibold text-gray-700 dark:text-gray-300">{item.call_to_action || '-'}</td>
                    <td className="p-3">
                      <button
                        onClick={() => onInspectRaw('creative', item.id)}
                        className="px-2.5 py-1 bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-300 font-medium rounded-lg flex items-center gap-1 text-[11px]"
                      >
                        <FileJson size={12} /> Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
