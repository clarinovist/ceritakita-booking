'use client';

import React, { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

interface DateRange {
  start: string;
  end: string;
}

interface Props {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void; // Function to update parent state
  className?: string;
}

export default function DateFilterToolbar({ dateRange, onDateRangeChange, className = '' }: Props) {
  const [showPresets, setShowPresets] = useState(false);

  const applyPreset = (preset: string) => {
    const today = new Date();
    let start = '';
    let end = '';

    switch (preset) {
      case 'today':
        start = today.toISOString().split('T')[0];
        end = start;
        break;
      case 'yesterday':
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        start = yesterday;
        end = yesterday;
        break;
      case 'last7days':
        const last7 = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
        start = last7;
        end = today.toISOString().split('T')[0];
        break;
      case 'last30days':
        const last30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        start = last30;
        end = today.toISOString().split('T')[0];
        break;
      case 'thisMonth':
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const lastDay = new Date(year, today.getMonth() + 1, 0).getDate();
        start = `${year}-${month}-01`;
        end = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
        break;
    }

    if (start && end) {
      onDateRangeChange({ start, end });
      setShowPresets(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Presets Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowPresets(!showPresets)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors shadow-sm"
        >
          <span>📅</span>
          <span className="hidden sm:inline">Presets</span>
          <span className="text-xs">▼</span>
        </button>
        {showPresets && (
          <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-xl p-1 min-w-[150px] z-[50]">
            <button onClick={() => applyPreset('today')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded text-gray-700">Today</button>
            <button onClick={() => applyPreset('yesterday')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded text-gray-700">Yesterday</button>
            <button onClick={() => applyPreset('last7days')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded text-gray-700">Last 7 Days</button>
            <button onClick={() => applyPreset('last30days')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded text-gray-700">Last 30 Days</button>
            <button onClick={() => applyPreset('thisMonth')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded text-gray-700">This Month</button>
          </div>
        )}
      </div>

      {/* Date Inputs */}
      <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm">
        <CalendarIcon size={14} className="text-gray-500" />
        <input
          type="date"
          value={dateRange.start}
          onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
          className="bg-transparent outline-none text-xs font-medium text-gray-700 w-24"
        />
        <span className="text-gray-400 text-xs">-</span>
        <input
          type="date"
          value={dateRange.end}
          onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
          className="bg-transparent outline-none text-xs font-medium text-gray-700 w-24"
        />
      </div>
    </div>
  );
}