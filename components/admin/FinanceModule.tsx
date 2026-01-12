'use client';

import React, { useState, useEffect } from 'react';
import { FinanceDashboard } from './finance/FinanceDashboard';
import { RevenueDetails } from './finance/RevenueDetails';
import { ExpenseManager } from './finance/ExpenseManager';
import { FinanceReports } from './finance/FinanceReports';
import { useFinanceSummary } from './hooks/useFinanceSummary';
import { DateRange } from '@/lib/types';
import { LayoutDashboard, Wallet, CreditCard, FileText } from 'lucide-react';
import DateFilterToolbar from './DateFilterToolbar';

export const FinanceModule: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'revenue' | 'expenses' | 'reports'>('dashboard');
    const [dateRange, setDateRange] = useState<DateRange>(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return {
            start: `${year}-${month}-01`,
            end: `${year}-${month}-${day}`
        };
    });

    const { data, fetchSummary } = useFinanceSummary();

    useEffect(() => {
        // Fetch summary when date range changes
        // Only fetch if active tab needs summary data
        if (activeTab !== 'expenses') {
            fetchSummary(dateRange);
        }
    }, [dateRange, activeTab, fetchSummary]);

    const tabs = [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'revenue', label: 'Revenue Details', icon: Wallet },
        { id: 'expenses', label: 'Expenses', icon: CreditCard },
        { id: 'reports', label: 'Reports', icon: FileText }
    ] as const;

    return (
        <div className="space-y-6">
            {/* Header / Tabs */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex bg-slate-100 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap
                                ${activeTab === tab.id
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Date Filter */}
                <DateFilterToolbar
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    className="border-none shadow-none"
                />
            </div>

            {/* Content */}
            <div className="min-h-[500px]">
                {activeTab === 'dashboard' && (
                    <FinanceDashboard data={data} />
                )}

                {activeTab === 'revenue' && (
                    <RevenueDetails data={data} />
                )}

                {activeTab === 'expenses' && (
                    <ExpenseManager dateRange={dateRange} />
                )}

                {activeTab === 'reports' && (
                    <FinanceReports dateRange={dateRange} />
                )}
            </div>
        </div>
    );
};
