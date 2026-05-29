import { useEffect, useCallback } from 'react';
import { type Service } from '@/lib/types';
import { useLeadFilter } from './useLeadFilter';
import { useLeadCRUD } from './useLeadCRUD';

export function useLeads(services: Service[] = []) {
    const filterState = useLeadFilter();
    const {
        pagination,
        setPagination,
        filterStatus,
        filterSource,
        filterInterest,
        selectedIds,
        setSelectedIds,
        searchQuery
    } = filterState;

    const crudState = useLeadCRUD(
        filterStatus,
        filterSource,
        pagination,
        setPagination,
        selectedIds,
        setSelectedIds,
        services
    );

    const { fetchLeads, leads } = crudState;

    // Trigger fetch on filter/page change
    useEffect(() => {
        const controller = new AbortController();
        fetchLeads(controller.signal);
        return () => {
            controller.abort();
        };
    }, [fetchLeads]);

    // Handle Select All based on fetched leads
    const handleSelectAll = useCallback(() => {
        filterState.handleSelectAll(leads);
    }, [filterState, leads]);

    // Filter interest and search logic (client-side for now as noted)
    const filteredLeads = leads.filter(lead => {
        // Interest filter
        if (filterInterest !== 'All' && (!lead.interest || !lead.interest.includes(filterInterest))) return false;

        // Search filter (name or contact)
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const nameMatch = lead.name.toLowerCase().includes(query);
            const contactMatch = lead.whatsapp.toLowerCase().includes(query);
            if (!nameMatch && !contactMatch) return false;
        }

        return true;
    });

    return {
        // Leads state
        leads,
        filteredLeads,
        pagination: filterState.pagination,

        // Filter state
        filterStatus: filterState.filterStatus,
        setFilterStatus: filterState.setFilterStatus,
        filterSource: filterState.filterSource,
        setFilterSource: filterState.setFilterSource,
        filterInterest: filterState.filterInterest,
        setFilterInterest: filterState.setFilterInterest,
        searchQuery: filterState.searchQuery,
        setSearchQuery: filterState.setSearchQuery,

        // Selection state
        selectedIds: filterState.selectedIds,
        handleSelectAll,
        handleDeselectAll: filterState.handleDeselectAll,
        handleToggleSelect: filterState.handleToggleSelect,

        // Bulk Actions
        handleBulkUpdateStatus: crudState.handleBulkUpdateStatus,
        handleBulkDelete: crudState.handleBulkDelete,
        handleBulkWhatsApp: crudState.handleBulkWhatsApp,

        // Other state
        selectedLead: crudState.selectedLead,
        isLeadModalOpen: crudState.isLeadModalOpen,
        setIsLeadModalOpen: crudState.setIsLeadModalOpen,
        leadFormData: crudState.leadFormData,
        setLeadFormData: crudState.setLeadFormData,

        // Leads functions
        fetchLeads,
        setPage: filterState.setPage,
        handleOpenLeadModal: crudState.handleOpenLeadModal,
        handleSaveLead: crudState.handleSaveLead,
        handleDeleteLead: crudState.handleDeleteLead,
        handleWhatsApp: crudState.handleWhatsApp,
        handleUpdateLeadStatus: crudState.handleUpdateLeadStatus,

        // Lead conversion
        isBookingModalOpen: crudState.isBookingModalOpen,
        bookingFormData: crudState.bookingFormData,
        setBookingFormData: crudState.setBookingFormData,
        selectedBookingAddons: crudState.selectedBookingAddons,
        availableBookingAddons: crudState.availableBookingAddons,
        convertingLead: crudState.convertingLead,
        handleConvertToBooking: crudState.handleConvertToBooking,
        handleServiceChangeForConversion: crudState.handleServiceChangeForConversion,
        toggleBookingAddonForConversion: crudState.toggleBookingAddonForConversion,
        updateBookingAddonQuantityForConversion: crudState.updateBookingAddonQuantityForConversion,
        calculateBookingTotalForConversion: crudState.calculateBookingTotalForConversion,
        handleCreateBookingFromLead: crudState.handleCreateBookingFromLead,
        closeBookingModal: crudState.closeBookingModal
    };
}
