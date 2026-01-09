import { useState, useCallback } from 'react';
import { type Lead, type LeadFormData, type LeadStatus, type LeadSource, type Addon, type Service } from '@/lib/types';

interface BookingFormData {
    customer_name: string;
    customer_whatsapp: string;
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
    service_id: '',
    booking_date: '',
    booking_time: '',
    booking_notes: '',
    location_link: '',
    photographer_id: '',
    dp_amount: 0,
    payment_note: 'DP Awal'
};

export function useLeads(services: Service[] = []) {
    // Leads state
    const [leads, setLeads] = useState<Lead[]>([]);
    const [filterStatus, setFilterStatus] = useState<LeadStatus | 'All'>('All');
    const [filterSource, setFilterSource] = useState<LeadSource | 'All'>('All');
    const [filterInterest, setFilterInterest] = useState<string | 'All'>('All');
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
    const [leadFormData, setLeadFormData] = useState<LeadFormData>(initialLeadFormData);

    // Lead conversion state
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [bookingFormData, setBookingFormData] = useState<BookingFormData>(initialBookingFormData);
    const [selectedBookingAddons, setSelectedBookingAddons] = useState<Map<string, number>>(new Map());
    const [availableBookingAddons, setAvailableBookingAddons] = useState<Addon[]>([]);
    const [convertingLead, setConvertingLead] = useState<Lead | null>(null);

    // Fetch leads
    const fetchLeads = useCallback(async () => {
        try {
            const res = await fetch('/api/leads');
            if (res.ok) {
                const data = await res.json();
                setLeads(data);
            }
        } catch (error) {
            console.error('Failed to fetch leads:', error);
        }
    }, []);

    // Filtered leads
    const filteredLeads = leads.filter(lead => {
        if (filterStatus !== 'All' && lead.status !== filterStatus) return false;
        if (filterSource !== 'All' && lead.source !== filterSource) return false;
        if (filterInterest !== 'All' && (!lead.interest || !lead.interest.includes(filterInterest))) return false;
        return true;
    });

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
            const method = selectedLead ? 'PUT' : 'POST';
            const url = selectedLead ? `/api/leads/${selectedLead.id}` : '/api/leads';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(leadFormData)
            });
            if (!res.ok) throw new Error('Failed to save lead');
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
            const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete lead');
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
                const res = await fetch(`/api/addons?active=true&category=${encodeURIComponent(selectedService.name)}`);
                if (res.ok) {
                    const data = await res.json();
                    setAvailableBookingAddons(data);
                }
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
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to create booking');
            }
            const newBooking = await res.json();
            if (convertingLead) {
                await fetch(`/api/leads/${convertingLead.id}/convert`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ booking_id: newBooking.id })
                });
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
        // Leads state
        leads,
        filteredLeads,
        filterStatus,
        setFilterStatus,
        filterSource,
        setFilterSource,
        filterInterest,
        setFilterInterest,
        selectedLead,
        isLeadModalOpen,
        setIsLeadModalOpen,
        leadFormData,
        setLeadFormData,

        // Leads functions
        fetchLeads,
        handleOpenLeadModal,
        handleSaveLead,
        handleDeleteLead,
        handleWhatsApp,

        // Lead conversion
        isBookingModalOpen,
        bookingFormData,
        setBookingFormData,
        selectedBookingAddons,
        availableBookingAddons,
        convertingLead,
        handleConvertToBooking,
        handleServiceChangeForConversion,
        toggleBookingAddonForConversion,
        updateBookingAddonQuantityForConversion,
        calculateBookingTotalForConversion,
        handleCreateBookingFromLead,
        closeBookingModal
    };
}
