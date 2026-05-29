import { useState, useCallback } from 'react';
import { 
    type Lead, 
    type LeadFormData, 
    type LeadStatus, 
    type LeadSource, 
    type Addon, 
    type Service, 
    type LeadsPaginatedResponse 
} from '@/lib/types';
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '@/lib/fetch';

export interface BookingFormData {
    customer_name: string;
    customer_whatsapp: string;
    customer_email: string;
    service_id: string;
    booking_date: string;
    booking_time: string;
    booking_notes: string;
    location_link: string;
    photographer_id: string;
    dp_amount: number;
    payment_note: string;
}

const initialLeadFormData: LeadFormData = {
    name: '',
    whatsapp: '',
    email: '',
    source: 'Meta Ads',
    status: 'New',
    notes: '',
    assigned_to: '',
    next_follow_up: ''
};

const initialBookingFormData: BookingFormData = {
    customer_name: '',
    customer_whatsapp: '',
    customer_email: '',
    service_id: '',
    booking_date: '',
    booking_time: '',
    booking_notes: '',
    location_link: '',
    photographer_id: '',
    dp_amount: 0,
    payment_note: 'DP Awal'
};

export function useLeadCRUD(
    filterStatus: LeadStatus | 'All',
    filterSource: LeadSource | 'All',
    pagination: { page: number; limit: number; total: number; totalPages: number },
    setPagination: React.Dispatch<React.SetStateAction<{ page: number; limit: number; total: number; totalPages: number }>>,
    selectedIds: Set<string>,
    setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>,
    services: Service[] = []
) {
    const [leads, setLeads] = useState<Lead[]>([]);

    // Modal state
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
    const [leadFormData, setLeadFormData] = useState<LeadFormData>(initialLeadFormData);

    // Lead conversion state
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [bookingFormData, setBookingFormData] = useState<BookingFormData>(initialBookingFormData);
    const [selectedBookingAddons, setSelectedBookingAddons] = useState<Map<string, number>>(new Map());
    const [availableBookingAddons, setAvailableBookingAddons] = useState<Addon[]>([]);
    const [convertingLead, setConvertingLead] = useState<Lead | null>(null);

    // Fetch leads with pagination and filters
    const fetchLeads = useCallback(async (signal?: AbortSignal) => {
        try {
            const params = new URLSearchParams();
            if (filterStatus !== 'All') params.append('status', filterStatus);
            if (filterSource !== 'All') params.append('source', filterSource);

            params.append('page', pagination.page.toString());
            params.append('limit', pagination.limit.toString());

            const data = await apiGet<LeadsPaginatedResponse | Lead[]>(
                `/api/leads?${params.toString()}`,
                { signal }
            );

            if (!signal?.aborted) {
                if (data && 'pagination' in data) {
                    setLeads(data.data);
                    setPagination(data.pagination);
                } else if (Array.isArray(data)) {
                    setLeads(data);
                }
                setSelectedIds(new Set());
            }
        } catch (error) {
            if ((error as Error).name !== 'AbortError') {
                console.error('Failed to fetch leads:', error);
            }
        }
    }, [filterStatus, filterSource, pagination.page, pagination.limit, setPagination, setSelectedIds]);

    // Bulk actions
    const handleBulkUpdateStatus = useCallback(async (status: LeadStatus) => {
        if (selectedIds.size === 0) return;

        try {
            const result = await apiPatch<{ message: string }>('/api/leads/bulk', {
                ids: Array.from(selectedIds),
                action: 'update_status',
                data: { status }
            });

            alert(result.message);
            fetchLeads();
            setSelectedIds(new Set());
        } catch (error) {
            console.error('Bulk update error:', error);
            alert('Failed to update leads');
        }
    }, [selectedIds, fetchLeads, setSelectedIds]);

    const handleBulkDelete = useCallback(async () => {
        if (selectedIds.size === 0) return;

        if (!confirm(`Are you sure you want to delete ${selectedIds.size} leads?`)) return;

        try {
            const result = await apiDelete<{ message: string }>('/api/leads/bulk', {
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ids: Array.from(selectedIds)
                })
            });

            alert(result.message);
            fetchLeads();
            setSelectedIds(new Set());
        } catch (error) {
            console.error('Bulk delete error:', error);
            alert('Failed to delete leads');
        }
    }, [selectedIds, fetchLeads, setSelectedIds]);

    const handleBulkWhatsApp = useCallback(() => {
        const selectedLeads = leads.filter(l => selectedIds.has(l.id));
        selectedLeads.forEach(lead => {
            window.open(`https://wa.me/${lead.whatsapp}`, '_blank');
        });
    }, [leads, selectedIds]);

    // Single status update (for Kanban)
    const handleUpdateLeadStatus = useCallback(async (leadId: string, newStatus: LeadStatus) => {
        // Optimistic update
        setLeads(prev => prev.map(lead =>
            lead.id === leadId ? { ...lead, status: newStatus } : lead
        ));

        try {
            await apiPut(`/api/leads/${leadId}`, { status: newStatus });
        } catch (error) {
            // Revert on error
            fetchLeads();
            console.error('Error updating lead status:', error);
            alert('Failed to update lead status');
        }
    }, [fetchLeads]);

    // Open lead modal
    const handleOpenLeadModal = useCallback((lead?: Lead) => {
        if (lead) {
            setSelectedLead(lead);
            setLeadFormData({
                name: lead.name,
                whatsapp: lead.whatsapp,
                email: lead.email || '',
                source: lead.source,
                status: lead.status,
                notes: lead.notes || '',
                assigned_to: lead.assigned_to || '',
                next_follow_up: lead.next_follow_up || ''
            });
        } else {
            setSelectedLead(null);
            setLeadFormData(initialLeadFormData);
        }
        setIsLeadModalOpen(true);
    }, []);

    // Save lead
    const handleSaveLead = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (selectedLead) {
                await apiPut(`/api/leads/${selectedLead.id}`, leadFormData);
            } else {
                await apiPost('/api/leads', leadFormData);
            }
            setIsLeadModalOpen(false);
            fetchLeads();
            alert(selectedLead ? 'Lead updated!' : 'Lead created!');
        } catch (error) {
            console.error('Error saving lead:', error);
            alert('Failed to save lead');
        }
    }, [selectedLead, leadFormData, fetchLeads]);

    // Delete lead
    const handleDeleteLead = useCallback(async (id: string) => {
        try {
            await apiDelete(`/api/leads/${id}`);
            fetchLeads();
            alert('Lead deleted!');
        } catch (error) {
            console.error('Error deleting lead:', error);
            alert('Failed to delete lead');
        }
    }, [fetchLeads]);

    // WhatsApp handler
    const handleWhatsApp = useCallback((whatsapp: string) => {
        window.open(`https://wa.me/${whatsapp}`, '_blank');
    }, []);

    // Convert lead to booking - prepare modal
    const handleConvertToBooking = useCallback((lead: Lead) => {
        setConvertingLead(lead);
        setBookingFormData({
            customer_name: lead.name,
            customer_whatsapp: lead.whatsapp,
            customer_email: lead.email || '',
            service_id: '',
            booking_date: '',
            booking_time: '',
            booking_notes: `Converted from lead: ${lead.id}\n${lead.notes || ''}`,
            location_link: '',
            photographer_id: '',
            dp_amount: 0,
            payment_note: 'DP Awal'
        });
        setSelectedBookingAddons(new Map());
        setAvailableBookingAddons([]);
        setIsBookingModalOpen(true);
    }, []);

    // Service change for lead conversion
    const handleServiceChangeForConversion = useCallback(async (serviceId: string) => {
        setBookingFormData(prev => ({ ...prev, service_id: serviceId }));
        setSelectedBookingAddons(new Map());

        if (!serviceId) {
            setAvailableBookingAddons([]);
            return;
        }

        const selectedService = services.find(s => s.id === serviceId);
        if (selectedService) {
            try {
                const data = await apiGet<Addon[]>(
                    `/api/addons?active=true&category=${encodeURIComponent(selectedService.name)}`
                );
                setAvailableBookingAddons(data);
            } catch (err) {
                console.error('Failed to fetch add-ons', err);
            }
        }
    }, [services]);

    // Toggle addon for lead conversion
    const toggleBookingAddonForConversion = useCallback((addonId: string) => {
        setSelectedBookingAddons(prev => {
            const newMap = new Map(prev);
            if (newMap.has(addonId)) {
                newMap.delete(addonId);
            } else {
                newMap.set(addonId, 1);
            }
            return newMap;
        });
    }, []);

    // Update addon quantity for lead conversion
    const updateBookingAddonQuantityForConversion = useCallback((addonId: string, quantity: number) => {
        if (quantity < 1) {
            setSelectedBookingAddons(prev => {
                const newMap = new Map(prev);
                newMap.delete(addonId);
                return newMap;
            });
        } else {
            setSelectedBookingAddons(prev => new Map(prev).set(addonId, quantity));
        }
    }, []);

    // Calculate booking total for lead conversion
    const calculateBookingTotalForConversion = useCallback(() => {
        const service = services.find(s => s.id === bookingFormData.service_id);
        if (!service) return 0;

        const basePrice = service.basePrice - service.discountValue;
        const addonsTotal = Array.from(selectedBookingAddons.entries()).reduce((total, [addonId, quantity]) => {
            const addon = availableBookingAddons.find(a => a.id === addonId);
            return total + (addon ? addon.price * quantity : 0);
        }, 0);

        return basePrice + addonsTotal;
    }, [services, bookingFormData.service_id, selectedBookingAddons, availableBookingAddons]);

    // Create booking from lead
    const handleCreateBookingFromLead = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bookingFormData.service_id) {
            alert('Please select a service');
            return;
        }
        try {
            const addonsData = Array.from(selectedBookingAddons.entries()).map(([addonId, quantity]) => {
                const addon = availableBookingAddons.find(a => a.id === addonId);
                return {
                    addon_id: addonId,
                    addon_name: addon?.name || '',
                    quantity,
                    price_at_booking: addon?.price || 0
                };
            });
            const selectedService = services.find(s => s.id === bookingFormData.service_id);
            const payload = {
                customer: {
                    name: bookingFormData.customer_name,
                    whatsapp: bookingFormData.customer_whatsapp,
                    email: bookingFormData.customer_email,
                    category: selectedService?.name || '',
                    serviceId: bookingFormData.service_id
                },
                booking: {
                    date: `${bookingFormData.booking_date}T${bookingFormData.booking_time}`,
                    notes: bookingFormData.booking_notes,
                    location_link: bookingFormData.location_link
                },
                finance: {
                    total_price: calculateBookingTotalForConversion(),
                    payments: bookingFormData.dp_amount > 0 ? [{
                        date: new Date().toISOString().split('T')[0] ?? '',
                        amount: bookingFormData.dp_amount,
                        note: bookingFormData.payment_note
                    }] : []
                },
                photographer_id: bookingFormData.photographer_id || undefined,
                addons: addonsData.length > 0 ? addonsData : undefined
            };

            const newBooking = await apiPost<{ id: string }>('/api/bookings', payload);

            if (convertingLead) {
                await apiPost(`/api/leads/${convertingLead.id}/convert`, { booking_id: newBooking.id });
            }
            setIsBookingModalOpen(false);
            setConvertingLead(null);
            fetchLeads();
            alert('Booking created! Lead marked as Converted.');
        } catch (error) {
            console.error('Error creating booking:', error);
            alert(`Failed to create booking: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [bookingFormData, selectedBookingAddons, availableBookingAddons, services, convertingLead, fetchLeads, calculateBookingTotalForConversion]);

    // Close booking modal
    const closeBookingModal = useCallback(() => {
        setIsBookingModalOpen(false);
        setConvertingLead(null);
    }, []);

    return {
        leads,
        setLeads,
        selectedLead,
        isLeadModalOpen,
        setIsLeadModalOpen,
        leadFormData,
        setLeadFormData,
        isBookingModalOpen,
        bookingFormData,
        setBookingFormData,
        selectedBookingAddons,
        availableBookingAddons,
        convertingLead,
        fetchLeads,
        handleBulkUpdateStatus,
        handleBulkDelete,
        handleBulkWhatsApp,
        handleUpdateLeadStatus,
        handleOpenLeadModal,
        handleSaveLead,
        handleDeleteLead,
        handleWhatsApp,
        handleConvertToBooking,
        handleServiceChangeForConversion,
        toggleBookingAddonForConversion,
        updateBookingAddonQuantityForConversion,
        calculateBookingTotalForConversion,
        handleCreateBookingFromLead,
        closeBookingModal
    };
}
