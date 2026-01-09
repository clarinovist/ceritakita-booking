'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DateRange {
  start: string;
  end: string;
}

interface Props {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  className?: string;
}

export default function DateFilterToolbar({ dateRange, onDateRangeChange, className = '' }: Props) {
  // Helper to get start and end of month based on a reference date
  const getMonthRange = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Format to YYYY-MM-DD manually to avoid UTC shifts
    const formatDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    return {
      start: formatDate(firstDay),
      end: formatDate(lastDay)
    };
  };

  // Safe date construction from YYYY-MM-DD to local time
  const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year!, month! - 1, day!);
  };

  // Get current month label (e.g., "Januari 2026")
  const getCurrentMonthLabel = () => {
    if (!dateRange.start) return '...';
    try {
      const date = parseLocalDate(dateRange.start);
      return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    } catch (e) {
      return '...';
    }
  };

  const handlePrevMonth = () => {
    const current = parseLocalDate(dateRange.start);
    current.setMonth(current.getMonth() - 1);
    onDateRangeChange(getMonthRange(current));
  };

  const handleNextMonth = () => {
    const current = parseLocalDate(dateRange.start);
    current.setMonth(current.getMonth() + 1);
    onDateRangeChange(getMonthRange(current));
  };

  const handleThisMonth = () => {
    onDateRangeChange(getMonthRange(new Date()));
  };

  // Determine if it's currently showing "this month"
  const isThisMonth = () => {
    if (!dateRange.start) return false;
    const today = new Date();
    const current = parseLocalDate(dateRange.start);
    return today.getMonth() === current.getMonth() && today.getFullYear() === current.getFullYear();
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
        {/* Prev Month */}
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-50 border-r border-gray-300 transition-colors text-gray-600"
          title="Bulan Sebelumnya"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Current Month Label */}
        <div className="px-4 py-2 flex items-center gap-2 min-w-[160px] justify-center bg-white">
          <Calendar size={16} className="text-blue-600" />
          <span className="text-sm font-bold text-gray-700 whitespace-nowrap">
            {getCurrentMonthLabel()}
          </span>
        </div>

        {/* Next Month */}
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-50 border-l border-gray-300 transition-colors text-gray-600"
          title="Bulan Berikutnya"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* This Month Reset Button */}
      <button
        onClick={handleThisMonth}
        disabled={isThisMonth()}
        className={`px-3 py-2 text-sm font-semibold rounded-lg transition-all border shadow-sm
          ${isThisMonth()
            ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
            : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300'}`}
      >
        <span className="sm:hidden">Current</span>
        <span className="hidden sm:inline">Bulan Ini</span>
      </button>
    </div>
  );
}