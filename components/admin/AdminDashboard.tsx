'use client';

import React, { useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useSession } from "next-auth/react";
import { Calendar, User, LayoutGrid } from 'lucide-react';
import { formatDateTime } from '@/utils';

// Components
import AdminSidebar from '../AdminSidebar';
import DashboardMetrics from '../DashboardMetrics';
import CouponManagement from '../CouponManagement';
import PortfolioManagement from '../PortfolioManagement';
import UserManagement from './UserManagement';
import PaymentMethodsManagement from './PaymentMethodsManagement';
import SettingsManagement from './SettingsManagement';

import AdsPerformance from './AdsPerformance';
// Tables
import { BookingsTable } from './tables/BookingsTable';
import { ServicesTable } from './tables/ServicesTable';
import { PhotographersTable } from './tables/PhotographersTable';
import { AddonsTable } from './tables/AddonsTable';

// Modals
import { ServiceModal } from './modals/ServiceModal';
import { BookingDetailModal } from './Bookings/modals/BookingDetailModal';
import { RescheduleModal } from './Bookings/modals/RescheduleModal';
import { CreateBookingModal } from './Bookings/modals/CreateBookingModal';

// Hooks
import { useBookings } from './hooks/useBookings';
import { useServices } from './hooks/useServices';
import { usePhotographers } from './hooks/usePhotographers';
import { useAddons } from './hooks/useAddons';
import { useExport } from './hooks/useExport';

// Types
import { ViewMode } from '@/lib/types';

export default function AdminDashboard() {
    const { data: session } = useSession();
    const userPermissions = (session?.user as any)?.permissions;
    const userRole = (session?.user as any)?.role;

    // Custom hooks
    const bookingsHook = useBookings();
    const servicesHook = useServices();
    const photographersHook = usePhotographers();
    const addonsHook = useAddons();
    const exportHook = useExport();

    // Filter view modes based on permissions
    const getAvailableViewModes = (): ViewMode[] => {
      const allModes: ViewMode[] = ['dashboard', 'ads', 'calendar', 'table', 'services', 'portfolio', 'photographers', 'addons', 'coupons', 'users', 'payment-settings', 'settings'];
      
      if (userRole === 'admin') {
        return allModes;
      }

      const allowedModes: ViewMode[] = [];
      
      if (userPermissions?.dashboard) allowedModes.push('dashboard');
      if (userPermissions?.ads) allowedModes.push('ads');
      if (userPermissions?.booking?.view) {
        allowedModes.push('calendar', 'table');
      }
      if (userPermissions?.services?.view) allowedModes.push('services');
      if (userPermissions?.portfolio?.view) allowedModes.push('portfolio');
      if (userPermissions?.photographers?.view) allowedModes.push('photographers');
      if (userPermissions?.addons?.view) allowedModes.push('addons');
      if (userPermissions?.coupons?.view) allowedModes.push('coupons');
      if (userPermissions?.users) allowedModes.push('users');
      if (userPermissions?.payment) allowedModes.push('payment-settings');
      if (userPermissions?.settings) allowedModes.push('settings');

      return allowedModes.length > 0 ? allowedModes : ['table']; // Default to table if no permissions
    };

    const availableViewModes = getAvailableViewModes();
    const [viewMode, setViewMode] = React.useState<ViewMode>(availableViewModes[0] || 'table');
    const [showPresets, setShowPresets] = React.useState(false);

    // Reset view mode if current mode becomes unavailable
    React.useEffect(() => {
      if (!availableViewModes.includes(viewMode)) {
        setViewMode(availableViewModes[0] || 'table');
      }
    }, [availableViewModes, viewMode]);

    // Fetch all data on mount
    useEffect(() => {
        bookingsHook.fetchData();
        servicesHook.fetchData();
        photographersHook.fetchData();
        addonsHook.fetchData();
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

    // Preset handlers
    const applyPreset = (preset: string) => {
        const today = new Date();
        let start: string = '';
        let end: string = '';

        switch (preset) {
            case 'today':
                start = today.toISOString().split('T')[0] || '';
                end = start;
                break;
            case 'yesterday':
                const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0] || '';
                start = yesterday;
                end = yesterday;
                break;
            case 'last7days':
                const last7Days = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0] || '';
                start = last7Days;
                end = today.toISOString().split('T')[0] || '';
                break;
            case 'last30days':
                const last30Days = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0] || '';
                start = last30Days;
                end = today.toISOString().split('T')[0] || '';
                break;
            case 'thisMonth':
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const lastDay = new Date(year, today.getMonth() + 1, 0).getDate();
                start = `${year}-${month}-01`;
                end = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
                break;
            case 'lastMonth':
                const lastMonth = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
                const lastMonthYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
                const lastMonthStr = String(lastMonth + 1).padStart(2, '0');
                const lastDayLastMonth = new Date(lastMonthYear, lastMonth + 1, 0).getDate();
                start = `${lastMonthYear}-${lastMonthStr}-01`;
                end = `${lastMonthYear}-${lastMonthStr}-${String(lastDayLastMonth).padStart(2, '0')}`;
                break;
            case 'thisYear':
                const currentYear = today.getFullYear();
                start = `${currentYear}-01-01`;
                end = today.toISOString().split('T')[0] || '';
                break;
        }

        bookingsHook.setDateRange({ start, end });
        setShowPresets(false);
    };

    // Calendar events
    const events = bookingsHook.bookings.filter(b => b.status === 'Active' || b.status === 'Rescheduled').map(b => ({
        id: b.id,
        title: `${b.customer.name} (${b.customer.category})`,
        start: b.booking.date,
        backgroundColor: b.customer.category.includes('Outdoor') ? '#10B981' : '#3B82F6',
        extendedProps: { booking: b }
    }));

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar viewMode={viewMode} setViewMode={(mode: any) => setViewMode(mode)} />
            
            <div className="flex-1 ml-0 md:ml-64 p-6 overflow-auto">
                {/* Command Bar - Single Line */}
                <div className="bg-white border rounded-xl p-4 mb-6 sticky top-0 z-10 flex justify-between items-center">
                    {/* Left Side: Date Range Picker + Presets */}
                    <div className="flex items-center gap-3">
                        {/* Presets Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowPresets(!showPresets)}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                <span>📅</span>
                                <span>Presets</span>
                                <span className="text-xs">▼</span>
                            </button>
                            {showPresets && (
                                <div className="absolute top-full left-0 mt-2 bg-white border rounded-lg shadow-lg p-2 min-w-[180px] z-20">
                                    <button onClick={() => applyPreset('today')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded">Today</button>
                                    <button onClick={() => applyPreset('yesterday')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded">Yesterday</button>
                                    <button onClick={() => applyPreset('last7days')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded">Last 7 Days</button>
                                    <button onClick={() => applyPreset('last30days')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded">Last 30 Days</button>
                                    <button onClick={() => applyPreset('thisMonth')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded">This Month</button>
                                    <button onClick={() => applyPreset('lastMonth')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded">Last Month</button>
                                    <button onClick={() => applyPreset('thisYear')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded">This Year</button>
                                </div>
                            )}
                        </div>

                        {/* Date Range Picker */}
                        <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2 font-bold text-xs text-gray-600">
                            <Calendar size={14} />
                            <input
                                type="date"
                                value={bookingsHook.dateRange.start}
                                onChange={(e) => bookingsHook.setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                className="bg-transparent outline-none cursor-pointer"
                            />
                            <span>to</span>
                            <input
                                type="date"
                                value={bookingsHook.dateRange.end}
                                onChange={(e) => bookingsHook.setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                className="bg-transparent outline-none cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Right Side: Admin Profile */}
                    <div className="flex items-center gap-3 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center">
                            <User size={14} />
                        </div>
                        <span className="text-sm font-bold text-blue-900">
                            Hello, {session?.user?.name || 'Admin'}
                        </span>
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
                                eventClick={(info: any) => {
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

                    {/* SERVICES VIEW */}
                    {viewMode === 'services' && (
                        <ServicesTable
                            services={servicesHook.services}
                            handleOpenAddModal={servicesHook.handleOpenAddModal}
                            handleOpenEditModal={servicesHook.handleOpenEditModal}
                            handleDeleteService={servicesHook.handleDeleteService}
                            toggleServiceActive={servicesHook.toggleServiceActive}
                        />
                    )}

                    {/* PHOTOGRAPHERS VIEW */}
                    {viewMode === 'photographers' && (
                        <PhotographersTable
                            photographers={photographersHook.photographers}
                            handleOpenAddPhotographerModal={photographersHook.handleOpenAddPhotographerModal}
                            handleOpenEditPhotographerModal={photographersHook.handleOpenEditPhotographerModal}
                            handleDeletePhotographer={photographersHook.handleDeletePhotographer}
                            togglePhotographerActive={photographersHook.togglePhotographerActive}
                        />
                    )}

                    {/* ADDONS VIEW */}
                    {viewMode === 'addons' && (
                        <AddonsTable
                            addons={addonsHook.addons}
                            services={servicesHook.services}
                            handleOpenAddAddonModal={addonsHook.handleOpenAddAddonModal}
                            handleOpenEditAddonModal={addonsHook.handleOpenEditAddonModal}
                            handleDeleteAddon={addonsHook.handleDeleteAddon}
                            toggleAddonActive={addonsHook.toggleAddonActive}
                        />
                    )}

                    {/* PORTFOLIO VIEW */}
                    {viewMode === 'portfolio' && (
                        <div className="animate-in fade-in">
                            <PortfolioManagement services={servicesHook.services} />
                        </div>
                    )}

                    {/* COUPONS VIEW */}
                    {viewMode === 'coupons' && (
                        <div className="animate-in fade-in">
                            <CouponManagement />
                        </div>
                    )}

                    {/* USERS VIEW */}
                    {viewMode === 'users' && (
                        <div className="animate-in fade-in">
                            <UserManagement />
                        </div>
                    )}

                    {/* PAYMENT METHODS VIEW */}
                    {viewMode === 'payment-settings' && (
                        <div className="animate-in fade-in">
                            <PaymentMethodsManagement />
                        </div>
                    )}

                    {/* SETTINGS VIEW */}
                    {viewMode === 'settings' && (
                        <div className="animate-in fade-in">
                            <SettingsManagement />
                        </div>
                    )}
                </div>

                {/* Service Modal */}
                <ServiceModal
                    isOpen={servicesHook.isServiceModalOpen}
                    onClose={() => servicesHook.setIsServiceModalOpen(false)}
                    onSubmit={servicesHook.handleSaveService}
                    editingService={servicesHook.editingService}
                    formData={servicesHook.serviceFormData}
                    setFormData={servicesHook.setServiceFormData}
                />

                {/* Other modals would go here... */}

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
            </div>
        </div>
    );
}
