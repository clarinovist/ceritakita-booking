/**
 * useAdminAnalytics — lead stats fetcher with caching and cancelation.
 * Extracted from AdminDashboard.tsx fetchAnalytics inline logic.
 */

import { useState, useCallback } from 'react';
import { apiFetch } from '@/lib/fetch';

export interface LeadAnalyticsData {
    total_leads: number;
    total_won: number;
    conversion_rate: number;
    by_agent: { name: string; count: number }[];
    isLoading: boolean;
    error?: string | null;
}

interface AnalyticsApiResponse {
    total_leads: number;
    total_won: number;
    conversion_rate: number;
    by_agent: { name: string; count: number }[];
}

export function useAdminAnalytics(dateRange: { start?: string; end?: string }) {
    const [data, setData] = useState<LeadAnalyticsData>({
        total_leads: 0,
        total_won: 0,
        conversion_rate: 0,
        by_agent: [],
        isLoading: true,
    });

    const fetchAnalytics = useCallback(async () => {
        const controller = new AbortController();
        const startStr = dateRange.start || new Date().toISOString().split('T')[0];
        const endStr   = dateRange.end   || new Date().toISOString().split('T')[0];

        setData(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const res = await apiFetch<AnalyticsApiResponse>(
                `/api/analytics/leads?start=${encodeURIComponent(startStr ?? '')}&end=${encodeURIComponent(endStr ?? '')}`,
                { method: 'GET', signal: controller.signal },
            );
            if (!controller.signal.aborted) {
                setData({ ...res, isLoading: false, error: null });
            }
        } catch (err) {
            if (!controller.signal.aborted && err instanceof Error) {
                console.error(err);
                setData(prev => ({ ...prev, isLoading: false, error: 'Failed to load analytics' }));
            }
        }

        return () => controller.abort();
    }, [dateRange.start, dateRange.end]);

    // Only load when explicitly triggered (caller useEffect)
    return { data, setData, fetchAnalytics };
}
