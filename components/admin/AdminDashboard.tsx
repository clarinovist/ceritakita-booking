'use client';

import React, { useEffect, useState } from 'react';
import { useSession, getCsrfToken } from "next-auth/react";

// Components
import AdminSidebar from '../AdminSidebar';
import { AdminCommandBar } from './AdminCommandBar';
import { AdminViews } from './AdminViews';
import { AdminModals } from './AdminModals';

// Hooks
import { useBookings } from './hooks/useBookings';
import { useServices } from './hooks/useServices';
import { usePhotographers } from './hooks/usePhotographers';
import { useAddons } from './hooks/useAddons';
import { useExport } from './hooks/useExport';
import { useLeads } from './hooks/useLeads';
import { useAdminPermissions } from './hooks/useAdminPermissions';
import { useAdminAnalytics } from './hooks/useAdminAnalytics';

// Types
import { type ViewMode } from '@/lib/types';
import { User } from '@/lib/types/user';

export default function AdminDashboard() {
    const { data: session } = useSession();
    const user = session?.user as User | undefined;

    // 🔐 Permissions
    const { availableModes: availableViewModes } = useAdminPermissions(user);
    const [viewMode, setViewMode] = useState<ViewMode>('table');
    const [leadsViewMode, setLeadsViewMode] = useState<'table' | 'board'>('table');

    // Custom hooks
    const bookingsHook = useBookings();
    const servicesHook = useServices();
    const photographersHook = usePhotographers();
    const addonsHook = useAddons();
    const exportHook = useExport();
    // Leads hook
    const leadsHook = useLeads(servicesHook.services);

    // 📊 Analytics (extracted)
    const adminAnalytics = useAdminAnalytics(bookingsHook.dateRange);

    // Reset view mode if current mode becomes unavailable
    useEffect(() => {
        if (availableViewModes.length > 0) {
            if (!viewMode || !availableViewModes.includes(viewMode)) {
                const firstMode = availableViewModes[0];
                if (firstMode) {
                    setViewMode(firstMode);
                }
            }
        }
    }, [availableViewModes, viewMode]);

    // Fetch analytics data when on Ads view
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (viewMode === 'ads') {
            adminAnalytics.fetchAnalytics();
        }
    }, [viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch all data on mount
    useEffect(() => {
        bookingsHook.fetchData();
        servicesHook.fetchData();
        photographersHook.fetchData();
        addonsHook.fetchData();
        leadsHook.fetchLeads();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Booking creation handlers
    const handleOpenCreateBookingModal = () => {
        bookingsHook.setBookingFormData({
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
        });
        bookingsHook.setSelectedBookingAddons(new Map());
        bookingsHook.setAvailableBookingAddons([]);
        bookingsHook.setIsCreateBookingModalOpen(true);
    };

    const handleServiceChange = async (serviceId: string) => {
        bookingsHook.setBookingFormData(prev => ({ ...prev, service_id: serviceId }));
        bookingsHook.setSelectedBookingAddons(new Map());

        if (!serviceId) {
            bookingsHook.setAvailableBookingAddons([]);
            return;
        }

        const selectedService = servicesHook.services.find(s => s.id === serviceId);
        if (selectedService) {
            try {
                const res = await fetch(`/api/addons?active=true&category=${encodeURIComponent(selectedService.name)}`);
                if (res.ok) {
                    const data = await res.json();
                    bookingsHook.setAvailableBookingAddons(data);
                }
            } catch (err) {
                console.error('Failed to fetch add-ons', err);
            }
        }
    };

    const toggleBookingAddon = (addonId: string) => {
        bookingsHook.setSelectedBookingAddons(prev => {
            const newMap = new Map(prev);
            if (newMap.has(addonId)) {
                newMap.delete(addonId);
            } else {
                newMap.set(addonId, 1);
            }
            return newMap;
        });
    };

    const updateBookingAddonQuantity = (addonId: string, quantity: number) => {
        if (quantity < 1) {
            bookingsHook.setSelectedBookingAddons(prev => {
                const newMap = new Map(prev);
                newMap.delete(addonId);
                return newMap;
            });
        } else {
            bookingsHook.setSelectedBookingAddons(prev => new Map(prev).set(addonId, quantity));
        }
    };

    const calculateBookingTotal = () => {
        const service = servicesHook.services.find(s => s.id === bookingsHook.bookingFormData.service_id);
        if (!service) return 0;

        const basePrice = service.basePrice - service.discountValue;
        const addonsTotal = Array.from(bookingsHook.selectedBookingAddons.entries()).reduce((total, [addonId, quantity]) => {
            const addon = bookingsHook.availableBookingAddons.find(a => a.id === addonId);
            return total + (addon ? addon.price * quantity : 0);
        }, 0);

        return basePrice + addonsTotal;
    };

    const handleCreateBooking = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!bookingsHook.bookingFormData.service_id) {
            alert('Please select a service');
            return;
        }

        try {
            const addonsData = Array.from(bookingsHook.selectedBookingAddons.entries()).map(([addonId, quantity]) => {
                const addon = bookingsHook.availableBookingAddons.find(a => a.id === addonId);
                return {
                    addon_id: addonId,
                    addon_name: addon?.name || '',
                    quantity,
                    price_at_booking: addon?.price || 0
                };
            });

            const selectedService = servicesHook.services.find(s => s.id === bookingsHook.bookingFormData.service_id);

            const payload = {
                customer: {
                    name: bookingsHook.bookingFormData.customer_name,
                    whatsapp: bookingsHook.bookingFormData.customer_whatsapp,
                    email: bookingsHook.bookingFormData.customer_email,
                    category: selectedService?.name || '',
                    serviceId: bookingsHook.bookingFormData.service_id
                },
                booking: {
                    date: `${bookingsHook.bookingFormData.booking_date}T${bookingsHook.bookingFormData.booking_time}`,
                    notes: bookingsHook.bookingFormData.booking_notes,
                    location_link: bookingsHook.bookingFormData.location_link
                },
                finance: {
                    total_price: calculateBookingTotal(),
                    payments: bookingsHook.bookingFormData.dp_amount > 0 ? [{
                        date: new Date().toISOString().split('T')[0] ?? '',
                        amount: bookingsHook.bookingFormData.dp_amount,
                        note: bookingsHook.bookingFormData.payment_note
                    }] : []
                },
                photographer_id: bookingsHook.bookingFormData.photographer_id || undefined,
                addons: addonsData.length > 0 ? addonsData : undefined
            };

            // Get CSRF token for authenticated request
            const csrfToken = await getCsrfToken();
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (csrfToken) {
                headers['X-CSRF-Token'] = csrfToken;
            }

            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to create booking');
            }

            const newBooking = await res.json();
            bookingsHook.setBookings(prev => [newBooking, ...prev]);
            bookingsHook.setIsCreateBookingModalOpen(false);
            alert('Booking created successfully!');
            bookingsHook.setSelectedBooking(newBooking);
        } catch (error) {
            console.error('Error creating booking:', error);
            alert(`Failed to create booking: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    // Reschedule handlers
    const handleOpenRescheduleModal = (bookingId: string, currentDate: string) => {
        const dateTimeParts = currentDate.split('T');
        const datePart = dateTimeParts[0] || '';
        const timePart = dateTimeParts[1]?.substring(0, 5) || '';

        bookingsHook.setRescheduleBookingId(bookingId);
        bookingsHook.setRescheduleFormData({
            newDate: datePart,
            newTime: timePart,
            reason: ''
        });
        bookingsHook.setIsRescheduleModalOpen(true);
    };

    const handleReschedule = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!bookingsHook.rescheduleBookingId) return;

        try {
            const newDateTime = `${bookingsHook.rescheduleFormData.newDate}T${bookingsHook.rescheduleFormData.newTime}`;

            const res = await fetch('/api/bookings/reschedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: bookingsHook.rescheduleBookingId,
                    newDate: newDateTime,
                    reason: bookingsHook.rescheduleFormData.reason || undefined
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || data.message || 'Failed to reschedule');
            }

            bookingsHook.setBookings(prev => prev.map(b =>
                b.id === bookingsHook.rescheduleBookingId ? data.booking : b
            ));

            if (bookingsHook.selectedBooking?.id === bookingsHook.rescheduleBookingId) {
                bookingsHook.setSelectedBooking(data.booking);
            }

            bookingsHook.setIsRescheduleModalOpen(false);
            alert('Booking rescheduled successfully!');
        } catch (error) {
            console.error('Error rescheduling booking:', error);
            alert(`Failed to reschedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar viewMode={viewMode as string} setViewMode={(mode: string) => setViewMode(mode as ViewMode)} />

            <div className="flex-1 ml-0 md:ml-72 p-4 md:p-8 overflow-x-hidden bg-slate-50">
                <AdminCommandBar
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    session={session}
                    userRole={user?.role}
                    dateRange={bookingsHook.dateRange}
                    onDateRangeChange={bookingsHook.setDateRange}
                    leadsTotal={leadsHook.pagination.total}
                    onOpenLeadModal={() => leadsHook.handleOpenLeadModal()}
                    leadsViewMode={leadsViewMode}
                    setLeadsViewMode={setLeadsViewMode}
                />

                <div className="space-y-6">
                    <AdminViews
                        viewMode={viewMode}
                        leadsViewMode={leadsViewMode}
                        bookingsHook={bookingsHook}
                        servicesHook={servicesHook}
                        photographersHook={photographersHook}
                        addonsHook={addonsHook}
                        exportHook={exportHook}
                        leadsHook={leadsHook}
                        adminAnalytics={adminAnalytics}
                        handleOpenCreateBookingModal={handleOpenCreateBookingModal}
                    />
                </div>

                <AdminModals
                    bookingsHook={bookingsHook}
                    handleOpenRescheduleModal={handleOpenRescheduleModal}
                    handleReschedule={handleReschedule}
                    handleCreateBooking={handleCreateBooking}
                    handleServiceChange={handleServiceChange}
                    toggleBookingAddon={toggleBookingAddon}
                    updateBookingAddonQuantity={updateBookingAddonQuantity}
                    calculateBookingTotal={calculateBookingTotal}
                    leadsHook={leadsHook}
                    services={servicesHook.services}
                    photographers={photographersHook.photographers}
                    servicesHook={servicesHook}
                    addonsHook={addonsHook}
                    photographersHook={photographersHook}
                />
            </div>
        </div>
    );
}