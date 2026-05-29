import { useState, useCallback } from 'react';
import { type Lead, type LeadStatus, type LeadSource } from '@/lib/types';

export function useLeadFilter() {
    // Pagination state
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });

    // Filter state
    const [filterStatus, setFilterStatus] = useState<LeadStatus | 'All'>('All');
    const [filterSource, setFilterSource] = useState<LeadSource | 'All'>('All');
    const [filterInterest, setFilterInterest] = useState<string | 'All'>('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Selection handlers
    const handleSelectAll = useCallback((leads: Lead[]) => {
        const newSelected = new Set(leads.map(l => l.id));
        setSelectedIds(newSelected);
    }, []);

    const handleDeselectAll = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const handleToggleSelect = useCallback((id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);

    const setPage = useCallback((page: number) => {
        setPagination(prev => ({ ...prev, page }));
    }, []);

    const handleSetFilterStatus = useCallback((status: LeadStatus | 'All') => {
        setFilterStatus(status);
        setPagination(prev => ({ ...prev, page: 1 }));
    }, []);

    const handleSetFilterSource = useCallback((source: LeadSource | 'All') => {
        setFilterSource(source);
        setPagination(prev => ({ ...prev, page: 1 }));
    }, []);

    const handleSetSearchQuery = useCallback((query: string) => {
        setSearchQuery(query);
        setPagination(prev => ({ ...prev, page: 1 }));
    }, []);

    return {
        pagination,
        setPagination,
        filterStatus,
        setFilterStatus: handleSetFilterStatus,
        filterSource,
        setFilterSource: handleSetFilterSource,
        filterInterest,
        setFilterInterest,
        searchQuery,
        setSearchQuery: handleSetSearchQuery,
        selectedIds,
        setSelectedIds,
        handleSelectAll,
        handleDeselectAll,
        handleToggleSelect,
        setPage
    };
}
