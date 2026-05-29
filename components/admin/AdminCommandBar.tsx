'use client';

import React from 'react';
import { Session } from 'next-auth';
import { LayoutList, Kanban as KanbanIcon } from 'lucide-react';
import { type ViewMode } from '@/lib/types';
import DateFilterToolbar from './DateFilterToolbar';
import { DateRange } from '@/lib/types';

interface AdminCommandBarProps {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    session: Session | null;
    userRole?: string;

    // Date filter
    dateRange: DateRange;
    onDateRangeChange: (range: DateRange) => void;

    // Leads controls
    leadsTotal: number;
    onOpenLeadModal: () => void;
    leadsViewMode: 'table' | 'board';
    setLeadsViewMode: (mode: 'table' | 'board') => void;
}

export function AdminCommandBar({
    viewMode,
    session,
    userRole,
    dateRange,
    onDateRangeChange,
    leadsTotal,
    onOpenLeadModal,
    leadsViewMode,
    setLeadsViewMode,
}: AdminCommandBarProps) {
    return (
        <div className="bg-white/90 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40 -mx-4 -mt-4 px-4 py-3 md:-mx-8 md:-mt-8 md:px-8 md:py-4 mb-4 md:mb-8 flex flex-col md:flex-row justify-between items-center gap-3 transition-all">
            {/* Left Side: View Title and Toggle */}
            <div className="flex items-center justify-between w-full md:w-auto gap-4 pl-12 md:pl-0">
                <div>
                    <h2 className="text-lg md:text-2xl font-bold text-slate-800 capitalize tracking-tight leading-tight">
                        {viewMode === 'dashboard' ? 'Overview' : viewMode.replace(/_/g, ' ')}
                    </h2>
                    <p className="hidden xs:block text-[10px] md:text-xs text-slate-500 font-medium mt-0.5">
                        {new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                </div>
                {/* Mobile Only: Profile Mini */}
                <div className="md:hidden flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center shadow-md ring-2 ring-white">
                        <span className="font-bold text-[10px]">
                            {session?.user?.name?.charAt(0).toUpperCase() || 'A'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Global Date Filter for relevant views */}
            {(viewMode === 'dashboard' || viewMode === 'ads' || viewMode === 'table') && (
                <div className="w-full md:max-w-md overflow-x-auto no-scrollbar py-1">
                    <DateFilterToolbar
                        dateRange={dateRange}
                        onDateRangeChange={onDateRangeChange}
                        className="shadow-sm border-slate-100 scale-95 origin-left md:scale-100"
                    />
                </div>
            )}

            {/* Leads Specific Controls */}
            {viewMode === 'leads' && (
                <div className="flex items-center justify-between w-full md:w-auto gap-3">
                    <div className="flex items-center gap-2">
                        <span className="bg-blue-50 text-blue-700 font-bold px-2 py-1 rounded-lg text-[10px] uppercase border border-blue-100">
                            {leadsTotal} Leads
                        </span>
                        <button
                            onClick={onOpenLeadModal}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm min-h-[44px]"
                        >
                            <span>+</span> Add Lead
                        </button>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                        <button
                            onClick={() => setLeadsViewMode('table')}
                            className={`p-1.5 rounded transition-all ${leadsViewMode === 'table' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                        >
                            <LayoutList size={16} />
                        </button>
                        <button
                            onClick={() => setLeadsViewMode('board')}
                            className={`p-1.5 rounded transition-all ${leadsViewMode === 'board' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                        >
                            <KanbanIcon size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Desktop Only: Profile Panel */}
            <div className="hidden md:flex items-center gap-3 pl-4 border-l border-slate-200">
                <div className="text-right">
                    <div className="text-sm font-semibold text-slate-700 leading-none mb-1">
                        {session?.user?.name || 'Administrator'}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                        {userRole || 'Admin'}
                    </div>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg ring-2 ring-white">
                    <span className="font-bold text-sm">
                        {session?.user?.name?.charAt(0).toUpperCase() || 'A'}
                    </span>
                </div>
            </div>
        </div>
    );
}
