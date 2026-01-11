'use client';

import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useSession } from "next-auth/react";

// Components
import AdminSidebar from '../AdminSidebar';
import DashboardMetrics from '../DashboardMetrics';
import CouponManagement from '../CouponManagement';
import SettingsManagement from './SettingsManagement';
import CatalogManagement from './CatalogManagement';
import HomepageCMS from './HomepageCMS';
import AdsPerformance from './AdsPerformance';
import DateFilterToolbar from './DateFilterToolbar';

// Tables
import { BookingsTable } from './tables/BookingsTable';
import { LeadsTable } from './tables/LeadsTable';

// Modals
import { ServiceModal } from './modals/ServiceModal';
import { BookingDetailModal } from './Bookings/modals/BookingDetailModal';
import { RescheduleModal } from './Bookings/modals/RescheduleModal';
import { CreateBookingModal } from './Bookings/modals/CreateBookingModal';
import { LeadModal } from './modals/LeadModal';
import { AddonModal } from './modals/AddonModal';
import { PhotographerModal } from './modals/PhotographerModal';

// Hooks
import { useBookings } from './hooks/useBookings';
import { useServices } from './hooks/useServices';
import { usePhotographers } from './hooks/usePhotographers';
import { useAddons } from './hooks/useAddons';
import { useExport } from './hooks/useExport';
import { useLeads } from './hooks/useLeads';

// Types
import { type ViewMode } from '@/lib/types';
import { User } from '@/lib/types/user';

export default function AdminDashboard() {
    const { data: session } = useSession();
    const user = session?.user as User | undefined;
    const userPermissions = user?.permissions;
    const userRole = user?.role;

    // Custom hooks
    const bookingsHook = useBookings();
    const servicesHook = useServices();
    const photographersHook = usePhotographers();
    const addonsHook = useAddons();
    const exportHook = useExport();
    // Leads hook
    const leadsHook = useLeads(servicesHook.services);

    // Filter view modes based on permissions
    const getAvailableViewModes = (): ViewMode[] => {
        // Note: 'users' and 'payment-settings' are now handled within SettingsManagement, 
        // 'services', 'portfolio', 'addons', 'photographers' are now handled within CatalogManagement
        const allModes: ViewMode[] = ['dashboard', 'ads', 'calendar', 'table', 'leads', 'catalog', 'coupons', 'settings', 'homepage'];

        if (userRole === 'admin') {
            return allModes;
        }

        const allowedModes: ViewMode[] = [];

        if (userPermissions?.dashboard) allowedModes.push('dashboard');
        if (userPermissions?.ads) allowedModes.push('ads');
        if (userPermissions?.booking?.view) {
            allowedModes.push('calendar', 'table');
        }
        if (userPermissions?.leads?.view) allowedModes.push('leads');

        // Catalog permission check
        const hasCatalogAccess =
            userPermissions?.services?.view ||
            userPermissions?.portfolio?.view ||
            userPermissions?.photographers?.view ||
            userPermissions?.addons?.view;

        if (hasCatalogAccess) allowedModes.push('catalog');

        if (userPermissions?.coupons?.view) allowedModes.push('coupons');
        if (userPermissions?.settings) allowedModes.push('settings');
        if (userPermissions?.homepage_cms) allowedModes.push('homepage');

        // If user has permissions for modules inside settings, allow settings access
        if ((userPermissions?.users || userPermissions?.payment) && !allowedModes.includes('settings')) {
            allowedModes.push('settings');
        }

        return allowedModes.length > 0 ? allowedModes : ['table'];
    };

    const availableViewModes = getAvailableViewModes();
    const [viewMode, setViewMode] = useState<ViewMode>(availableViewModes[0] || 'table');

    // Reset view mode if current mode becomes unavailable
    useEffect(() => {
        if (availableViewModes.length > 0 && !availableViewModes.includes(viewMode)) {
            const firstMode = availableViewModes[0];
            if (firstMode) {
                setViewMode(firstMode);
            }
        }
    }, [availableViewModes, viewMode]);

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

    const events = bookingsHook.bookings
        .filter(b => b.status === 'Active' || b.status === 'Rescheduled')
        .map(b => ({
            id: b.id,
            title: `${b.customer.name} (${b.customer.category})`,
            start: b.booking.date,
            backgroundColor: b.customer.category.includes('Outdoor') ? '#10B981' : '#3B82F6',
            extendedProps: { booking: b }
        }));

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar viewMode={viewMode as string} setViewMode={(mode: string) => setViewMode(mode as ViewMode)} />

            <div className="flex-1 ml-0 md:ml-72 p-8 overflow-auto bg-slate-50">

                {/* Command Bar - Modernized */}
                <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40 -mx-8 -mt-8 px-8 py-4 mb-8 flex flex-col md:flex-row justify-between items-center gap-4 transition-all">
                    {/* Left Side: View Title and Date Filter */}
                    <div className="flex flex-1 items-center justify-between w-full md:w-auto gap-6">
                        <div>
                            <h2 className="text-2xl font-display font-bold text-slate-800 capitalize tracking-tight">
                                {viewMode === 'dashboard' ? 'Overview' : viewMode.replace(/_/g, ' ')}
                            </h2>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>

                        {/* Global Date Filter for relevant views */}
                        {(viewMode === 'dashboard' || viewMode === 'ads' || viewMode === 'table') && (
                            <div className="hidden md:flex flex-1 justify-end max-w-md">
                                <DateFilterToolbar
                                    dateRange={bookingsHook.dateRange}
                                    onDateRangeChange={bookingsHook.setDateRange}
                                    className="shadow-sm border-slate-200"
                                />
                            </div>
                        )}

                        {/* Leads Actions (Add Button) */}
                        {viewMode === 'leads' && (
                            <div className="flex items-center gap-3">
                                <span className="bg-blue-100 text-blue-700 font-medium px-3 py-1 rounded-full text-sm">
                                    {leadsHook.pagination.total} Leads
                                </span>
                                <button
                                    onClick={() => leadsHook.handleOpenLeadModal()}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
                                >
                                    <span>+</span> Add Lead
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right Side: Admin Profile */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                            <div className="text-right hidden md:block">
                                <div className="text-sm font-semibold text-slate-700 leading-none mb-1">
                                    {session?.user?.name || 'Administrator'}
                                </div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                                    {userRole || 'Admin'}
                                </div>
                            </div>
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20 ring-2 ring-white">
                                <span className="font-bold text-sm">
                                    {session?.user?.name?.charAt(0).toUpperCase() || 'A'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* DASHBOARD VIEW */}
                    {viewMode === 'dashboard' && (
                        <div className="space-y-8 animate-in fade-in">
                            <DashboardMetrics
                                sessionBookings={bookingsHook.bookingsByDateRange}
                                createdBookings={bookingsHook.bookingsByCreatedDate}
                                dateRange={bookingsHook.dateRange}
                            />
                        </div>
                    )}


                    {/* ADS VIEW */}
                    {viewMode === 'ads' && (
                        <div className="animate-in fade-in">
                            <AdsPerformance
                                bookings={bookingsHook.bookingsByDateRange}
                                dateRange={bookingsHook.dateRange}
                            />
                        </div>
                    )}

                    {/* CALENDAR VIEW */}
                    {viewMode === 'calendar' && (
                        <div className="bg-white p-6 rounded-xl shadow-lg h-[700px] animate-in fade-in">
                            <FullCalendar
                                plugins={[dayGridPlugin, interactionPlugin]}
                                initialView="dayGridMonth"
                                events={events}
                                eventClick={(info) => {
                                    bookingsHook.setSelectedBooking(info.event.extendedProps.booking);
                                }}
                                height="100%"
                            />
                        </div>
                    )}

                    {/* TABLE VIEW */}
                    {viewMode === 'table' && (
                        <BookingsTable
                            bookings={bookingsHook.filteredBookings}
                            filterStatus={bookingsHook.filterStatus}
                            setFilterStatus={bookingsHook.setFilterStatus}
                            setSelectedBooking={bookingsHook.setSelectedBooking}
                            handleUpdateStatus={bookingsHook.handleUpdateStatus}
                            handleDeleteBooking={bookingsHook.handleDeleteBooking}
                            handleOpenCreateBookingModal={handleOpenCreateBookingModal}
                            calculateFinance={bookingsHook.calculateFinance}
                            exportHook={exportHook}
                            dateRange={bookingsHook.dateRange}
                        />
                    )}

                    {/* CATALOG VIEW */}
                    {viewMode === 'catalog' && (
                        <CatalogManagement
                            services={servicesHook.services}
                            handleOpenAddServiceModal={servicesHook.handleOpenAddModal}
                            handleOpenEditServiceModal={servicesHook.handleOpenEditModal}
                            handleDeleteService={servicesHook.handleDeleteService}
                            toggleServiceActive={servicesHook.toggleServiceActive}

                            addons={addonsHook.addons}
                            handleOpenAddAddonModal={addonsHook.handleOpenAddAddonModal}
                            handleOpenEditAddonModal={addonsHook.handleOpenEditAddonModal}
                            handleDeleteAddon={addonsHook.handleDeleteAddon}
                            toggleAddonActive={addonsHook.toggleAddonActive}

                            photographers={photographersHook.photographers}
                            handleOpenAddPhotographerModal={photographersHook.handleOpenAddPhotographerModal}
                            handleOpenEditPhotographerModal={photographersHook.handleOpenEditPhotographerModal}
                            handleDeletePhotographer={photographersHook.handleDeletePhotographer}
                            togglePhotographerActive={photographersHook.togglePhotographerActive}
                        />
                    )}

                    {/* COUPONS VIEW */}
                    {viewMode === 'coupons' && (
                        <div className="animate-in fade-in">
                            <CouponManagement />
                        </div>
                    )}

                    {/* SETTINGS VIEW */}
                    {viewMode === 'settings' && (
                        <div className="animate-in fade-in">
                            <SettingsManagement />
                        </div>
                    )}

                    {/* HOMEPAGE CMS VIEW */}
                    {viewMode === 'homepage' && (
                        <div className="animate-in fade-in">
                            <HomepageCMS />
                        </div>
                    )}

                    {/* LEADS VIEW */}
                    {viewMode === 'leads' && (
                        <LeadsTable
                            leads={leadsHook.filteredLeads}
                            filterStatus={leadsHook.filterStatus}
                            setFilterStatus={leadsHook.setFilterStatus}
                            filterSource={leadsHook.filterSource}
                            setFilterSource={leadsHook.setFilterSource}
                            filterInterest={leadsHook.filterInterest}
                            setFilterInterest={leadsHook.setFilterInterest}
                            searchQuery={leadsHook.searchQuery}
                            setSearchQuery={leadsHook.setSearchQuery}
                            onOpenModal={leadsHook.handleOpenLeadModal}
                            onDeleteLead={leadsHook.handleDeleteLead}
                            onConvertToBooking={leadsHook.handleConvertToBooking}
                            onWhatsApp={leadsHook.handleWhatsApp}

                            selectedIds={leadsHook.selectedIds}
                            onToggleSelect={leadsHook.handleToggleSelect}
                            onSelectAll={leadsHook.handleSelectAll}
                            onDeselectAll={leadsHook.handleDeselectAll}
                            onBulkUpdateStatus={leadsHook.handleBulkUpdateStatus}
                            onBulkDelete={leadsHook.handleBulkDelete}
                            onBulkWhatsApp={leadsHook.handleBulkWhatsApp}
                            pagination={leadsHook.pagination}
                            onPageChange={leadsHook.setPage}
                            services={servicesHook.services}
                        />
                    )}
                </div>

                {/* Lead Modal */}
                <LeadModal
                    isOpen={leadsHook.isLeadModalOpen}
                    onClose={() => leadsHook.setIsLeadModalOpen(false)}
                    onSubmit={leadsHook.handleSaveLead}
                    formData={leadsHook.leadFormData}
                    setFormData={leadsHook.setLeadFormData}
                    editingLead={leadsHook.selectedLead}
                    services={servicesHook.services}
                />

                {/* Create Booking Modal (for lead conversion) */}
                <CreateBookingModal
                    isOpen={leadsHook.isBookingModalOpen}
                    onClose={leadsHook.closeBookingModal}
                    onSubmit={leadsHook.handleCreateBookingFromLead}
                    formData={leadsHook.bookingFormData}
                    setFormData={leadsHook.setBookingFormData}
                    services={servicesHook.services}
                    photographers={photographersHook.photographers}
                    availableAddons={leadsHook.availableBookingAddons}
                    selectedAddons={leadsHook.selectedBookingAddons}
                    onServiceChange={leadsHook.handleServiceChangeForConversion}
                    onToggleAddon={leadsHook.toggleBookingAddonForConversion}
                    onUpdateAddonQuantity={leadsHook.updateBookingAddonQuantityForConversion}
                    calculateTotal={leadsHook.calculateBookingTotalForConversion}
                />

                {/* Service Modal */}
                <ServiceModal
                    isOpen={servicesHook.isServiceModalOpen}
                    onClose={() => servicesHook.setIsServiceModalOpen(false)}
                    onSubmit={servicesHook.handleSaveService}
                    editingService={servicesHook.editingService}
                    formData={servicesHook.serviceFormData}
                    setFormData={servicesHook.setServiceFormData}
                />

                {/* Booking Detail Modal */}
                <BookingDetailModal
                    booking={bookingsHook.selectedBooking}
                    photographers={photographersHook.photographers}
                    onClose={() => bookingsHook.setSelectedBooking(null)}
                    onDelete={bookingsHook.handleDeleteBooking}
                    onUpdateStatus={bookingsHook.handleUpdateStatus}
                    onUpdate={bookingsHook.handleUpdate}
                    onUpdateFinance={bookingsHook.handleUpdateFinance}
                    onOpenRescheduleModal={handleOpenRescheduleModal}
                    calculateFinance={bookingsHook.calculateFinance}
                    getOrReconstructBreakdown={bookingsHook.getOrReconstructBreakdown}
                />

                {/* Reschedule Modal */}
                <RescheduleModal
                    isOpen={bookingsHook.isRescheduleModalOpen}
                    onClose={() => bookingsHook.setIsRescheduleModalOpen(false)}
                    onSubmit={handleReschedule}
                    formData={bookingsHook.rescheduleFormData}
                    setFormData={bookingsHook.setRescheduleFormData}
                />

                {/* Create Booking Modal */}
                <CreateBookingModal
                    isOpen={bookingsHook.isCreateBookingModalOpen}
                    onClose={() => bookingsHook.setIsCreateBookingModalOpen(false)}
                    onSubmit={handleCreateBooking}
                    formData={bookingsHook.bookingFormData}
                    setFormData={bookingsHook.setBookingFormData}
                    services={servicesHook.services}
                    photographers={photographersHook.photographers}
                    availableAddons={bookingsHook.availableBookingAddons}
                    selectedAddons={bookingsHook.selectedBookingAddons}
                    onServiceChange={handleServiceChange}
                    onToggleAddon={toggleBookingAddon}
                    onUpdateAddonQuantity={updateBookingAddonQuantity}
                    calculateTotal={calculateBookingTotal}
                />

                {/* AddonModal */}
                <AddonModal
                    isOpen={addonsHook.isAddonModalOpen}
                    onClose={() => addonsHook.setIsAddonModalOpen(false)}
                    onSubmit={addonsHook.handleSaveAddon}
                    editingAddon={addonsHook.editingAddon}
                    formData={addonsHook.addonFormData}
                    setFormData={addonsHook.setAddonFormData}
                    services={servicesHook.services}
                />

                {/* Photographer Modal */}
                <PhotographerModal
                    isOpen={photographersHook.isPhotographerModalOpen}
                    onClose={() => photographersHook.setIsPhotographerModalOpen(false)}
                    onSubmit={photographersHook.handleSavePhotographer}
                    editingPhotographer={photographersHook.editingPhotographer}
                    formData={photographersHook.photographerFormData}
                    setFormData={photographersHook.setPhotographerFormData}
                />
            </div>
        </div>
    );
}