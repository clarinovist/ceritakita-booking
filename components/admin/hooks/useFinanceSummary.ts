import { useState, useCallback } from 'react';
import { DateRange } from '@/lib/types';
import { Expense } from './useExpenses';

export interface FinanceSummaryData {
    period: { startDate?: string; endDate?: string };
    summary: {
        revenue: number;
        expenses: number;
        profit: number;
        outstanding: number;
    };
    revenueByCategory: Record<string, number>;
    expenseDetails: Expense[];
}

export function useFinanceSummary() {
    const [data, setData] = useState<FinanceSummaryData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSummary = useCallback(async (dateRange: DateRange) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                startDate: dateRange.start,
                endDate: dateRange.end
            });

            const res = await fetch(`/api/finance/summary?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch finance summary');

            const summaryData = await res.json();
            setData(summaryData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        data,
        loading,
        error,
        fetchSummary
    };
}
