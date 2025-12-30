'use client';

import React, { useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useSession } from "next-auth/react";
import { Calendar, User, LayoutGrid } from 'lucide-react';
import { formatDateTime } from '@/utils/dateFormatter';

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
// Import other modals as they're created...

// Hooks
import { useBookings } from './hooks/useBookings';
import { useServices } from './hooks/useServices';
import { usePhotographers } from './hooks/usePhotographers';
import { useAddons } from './hooks/useAddons';
import { useExport } from './hooks/useExport';

// Types
import { ViewMode } from './types/admin';

export default function AdminDashboard() {
    const { data: session } = useSession();

    // Custom hooks
    const bookingsHook = useBookings();
    const servicesHook = useServices();
    const photographersHook = usePhotographers();
    const addonsHook = useAddons();
    const exportHook = useExport();

    const [viewMode, setViewMode] = React.useState<ViewMode>('dashboard');
    const [showPresets, setShowPresets] = React.useState(false);

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
        let start, end;

        switch (preset) {
            case 'today':
                start = today.toISOString().split('T')[0];
                end = start;
                break;
            case 'yesterday':
                const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                start = yesterday;
                end = yesterday;
                break;
            case 'last7days':
                const last7Days = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
                start = last7Days;
                end = today.toISOString().split('T')[0];
                break;
            case 'last30days':
                const last30Days = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
                start = last30Days;
                end = today.toISOString().split('T')[0];
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
                end = today.toISOString().split('T')[0];
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
                {bookingsHook.selectedBooking && bookingsHook.selectedBooking.booking && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b flex justify-between items-center bg-gray-50 sticky top-0">
                                <h2 className="text-2xl font-bold">Booking Details</h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => bookingsHook.selectedBooking && bookingsHook.handleDeleteBooking(bookingsHook.selectedBooking.id)}
                                        className="text-red-600 hover:text-red-800 font-medium text-xs border border-red-200 px-3 py-1 rounded hover:bg-red-50"
                                    >
                                        Delete Booking
                                    </button>
                                    <button onClick={() => bookingsHook.setSelectedBooking(null)} className="text-gray-500 hover:text-red-500">
                                        <span style={{ fontSize: '24px' }}>✕</span>
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left: General Info */}
                        <div className="space-y-6">
                            {bookingsHook.selectedBooking && (
                                <>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-semibold text-gray-500 text-sm uppercase">Customer</h3>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${bookingsHook.selectedBooking.status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-200' : 
                                        bookingsHook.selectedBooking.status === 'Completed' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
                                        {bookingsHook.selectedBooking.status}
                                    </span>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="font-bold text-lg">{bookingsHook.selectedBooking.customer.name}</p>
                                    <p>WA: {bookingsHook.selectedBooking.customer.whatsapp}</p>
                                    <p>Category: {bookingsHook.selectedBooking.customer.category}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-500 text-sm uppercase mb-2">Session</h3>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="font-bold">{formatDateTime(bookingsHook.selectedBooking.booking.date)}</p>
                                    <p className="mt-2 text-sm text-gray-600">Notes: {bookingsHook.selectedBooking.booking.notes || '-'}</p>
                                    {bookingsHook.selectedBooking.booking.location_link && (
                                        <a href={bookingsHook.selectedBooking.booking.location_link} target="_blank" className="text-blue-600 hover:underline block mt-2">
                                            Open Maps
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Immutability Warning for Completed Bookings */}
                            {bookingsHook.selectedBooking.status === 'Completed' && (
                                <div className="bg-blue-50 p-4 rounded border border-blue-200">
                                    <div className="flex items-start gap-2">
                                        <span className="text-blue-600 font-bold text-lg">ℹ️</span>
                                        <div>
                                            <h4 className="font-bold text-blue-800 text-sm mb-1">Booking Completed</h4>
                                            <p className="text-blue-700 text-xs">
                                                This booking is marked as completed and cannot be modified or deleted.
                                                Contact a system administrator if changes are required.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="bg-orange-50 p-4 rounded border border-orange-100">
                                <h4 className="font-bold text-orange-800 text-sm mb-2">Manage Status</h4>
                                {bookingsHook.selectedBooking.status === 'Completed' ? (
                                    <div className="p-2 bg-blue-50 border border-blue-200 rounded text-center">
                                        <span className="text-blue-600 font-bold text-sm">
                                            Status: Completed ✓ (Immutable)
                                        </span>
                                    </div>
                                ) : (
                                    <select
                                        value={bookingsHook.selectedBooking.status}
                                        onChange={(e) => bookingsHook.handleUpdateStatus(bookingsHook.selectedBooking.id, e.target.value as any)}
                                        className="w-full p-2 border rounded"
                                    >
                                        <option value="Active">Active (Confirmed)</option>
                                        <option value="Rescheduled">Rescheduled</option>
                                        <option value="Canceled">Canceled</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                )}
                                <button
                                    onClick={() => bookingsHook.selectedBooking && handleOpenRescheduleModal(bookingsHook.selectedBooking.id, bookingsHook.selectedBooking.booking.date)}
                                    disabled={bookingsHook.selectedBooking.status === 'Completed'}
                                    className={`mt-3 w-full px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 ${
                                        bookingsHook.selectedBooking.status === 'Completed'
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                                >
                                    <span>📅</span>
                                    Reschedule Date/Time
                                </button>
                            </div>

                            {bookingsHook.selectedBooking.reschedule_history && bookingsHook.selectedBooking.reschedule_history.length > 0 && (
                                <div className="bg-yellow-50 p-4 rounded border border-yellow-100">
                                    <h4 className="font-bold text-yellow-800 text-sm mb-2">Reschedule History</h4>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {bookingsHook.selectedBooking.reschedule_history.map((history, idx) => (
                                            <div key={idx} className="bg-white p-2 rounded border text-xs">
                                                <div className="flex justify-between mb-1">
                                                    <span className="font-medium text-gray-600">Changed on: {formatDateTime(history.rescheduled_at)}</span>
                                                </div>
                                                <div className="text-gray-600">
                                                    <span className="line-through text-red-600">{formatDateTime(history.old_date)}</span>
                                                    {' → '}
                                                    <span className="text-green-600 font-medium">{formatDateTime(history.new_date)}</span>
                                                </div>
                                                {history.reason && (
                                                    <div className="mt-1 text-gray-500">
                                                        Reason: {history.reason}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-purple-50 p-4 rounded border border-purple-100">
                                <h4 className="font-bold text-purple-800 text-sm mb-2 flex items-center gap-2">
                                    <span>📷</span> Assign Photographer
                                </h4>
                                <select
                                    value={bookingsHook.selectedBooking.photographer_id || ''}
                                    onChange={(e) => bookingsHook.handleUpdate(bookingsHook.selectedBooking.id, { photographer_id: e.target.value || undefined })}
                                    disabled={bookingsHook.selectedBooking.status === 'Completed'}
                                    className={`w-full p-2 border rounded ${
                                        bookingsHook.selectedBooking.status === 'Completed'
                                            ? 'bg-gray-100 cursor-not-allowed'
                                            : 'bg-white'
                                    }`}
                                >
                                    <option value="">-- Not Assigned --</option>
                                    {photographersHook.photographers.filter(p => p.is_active).map(photographer => (
                                        <option key={photographer.id} value={photographer.id}>
                                            {photographer.name} {photographer.specialty ? `(${photographer.specialty})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {bookingsHook.selectedBooking.photographer_id && (
                                    <p className="text-xs text-purple-600 mt-1">
                                        Assigned to: {photographersHook.photographers.find(p => p.id === bookingsHook.selectedBooking.photographer_id)?.name || 'Unknown'}
                                    </p>
                                )}
                            </div>
                                </>
                            )}
                        </div>

                                {/* Right: Finance */}
                                <div className="space-y-6">
                                    <h3 className="font-semibold text-gray-500 text-sm uppercase mb-2">
                                        Financials
                                    </h3>

                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-100">
                                        <h4 className="font-bold text-sm mb-3 text-gray-700">Price Breakdown</h4>

                                        {(() => {
                                            const breakdown = bookingsHook.getOrReconstructBreakdown(bookingsHook.selectedBooking);
                                            if (!breakdown) return null;

                                            return (
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Service Base Price:</span>
                                                        <span className="font-semibold">Rp {breakdown?.service_base_price?.toLocaleString('id-ID') ?? '0'}</span>
                                                    </div>

                                                    {breakdown.addons_total > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Add-ons Total:</span>
                                                            <span className="font-semibold text-green-600">+ Rp {breakdown?.addons_total?.toLocaleString('id-ID') ?? '0'}</span>
                                                        </div>
                                                    )}

                                                    {breakdown.base_discount > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Base Discount:</span>
                                                            <span className="font-semibold text-red-600">- Rp {breakdown?.base_discount?.toLocaleString('id-ID') ?? '0'}</span>
                                                        </div>
                                                    )}

                                                    {breakdown.coupon_discount > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">
                                                                Coupon Discount
                                                                {breakdown.coupon_code && (
                                                                    <span className="ml-1 text-xs font-mono bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                                                                        {breakdown.coupon_code}
                                                                    </span>
                                                                )}:
                                                            </span>
                                                            <span className="font-semibold text-red-600">- Rp {breakdown?.coupon_discount?.toLocaleString('id-ID') ?? '0'}</span>
                                                        </div>
                                                    )}

                                                    <div className="border-t-2 border-blue-200 pt-2 mt-2 flex justify-between items-center">
                                                        <span className="font-bold text-base text-gray-900">Grand Total:</span>
                                                        <span className="font-bold text-xl text-blue-600">Rp {bookingsHook.selectedBooking.finance.total_price.toLocaleString('id-ID')}</span>
                                                    </div>

                                                    {breakdown.isReconstructed && (
                                                        <p className="text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded mt-2">
                                                            ℹ️ Breakdown reconstructed from booking data
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })()}

                                        <div className="mt-4 pt-4 border-t-2 border-blue-300 space-y-3">
                                            {(() => {
                                                const finance = bookingsHook.calculateFinance(bookingsHook.selectedBooking!);
                                                const firstPayment = bookingsHook.selectedBooking.finance.payments[0];

                                                return (
                                                    <>
                                                        {firstPayment && (
                                                            <div className="flex justify-between items-center text-sm">
                                                                <span className="text-gray-600">Down Payment (DP):</span>
                                                                <span className="font-semibold text-green-600">
                                                                    Rp {firstPayment.amount.toLocaleString('id-ID')}
                                                                </span>
                                                            </div>
                                                        )}

                                                        <div className="flex justify-between items-center">
                                                            <span className="font-bold text-gray-700">Total Dibayar:</span>
                                                            <span className="font-bold text-lg text-green-600">
                                                                Rp {finance.paid.toLocaleString('id-ID')}
                                                            </span>
                                                        </div>

                                                        {finance.balance > 0 && (
                                                            <div className="flex justify-between items-center">
                                                                <span className="font-bold text-gray-700">Sisa Pembayaran:</span>
                                                                <span className="font-bold text-lg text-orange-600">
                                                                    Rp {finance.balance.toLocaleString('id-ID')}
                                                                </span>
                                                            </div>
                                                        )}

                                                        <div className="mt-2">
                                                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all"
                                                                    style={{ width: `${(finance.paid / finance.total) * 100}%` }}
                                                                />
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-1 text-center">
                                                                {((finance.paid / finance.total) * 100).toFixed(0)}% terbayar
                                                            </p>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>

                                        <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Payment Status:</span>
                                            <span className={`font-bold text-base ${bookingsHook.calculateFinance(bookingsHook.selectedBooking!).isPaidOff ? 'text-green-600' : 'text-red-600'}`}>
                                                {bookingsHook.calculateFinance(bookingsHook.selectedBooking!).isPaidOff ? 'LUNAS ✓' : 'BELUM LUNAS'}
                                            </span>
                                        </div>
                                    </div>

                                    {bookingsHook.selectedBooking.addons && bookingsHook.selectedBooking.addons.length > 0 && (
                                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                                            <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                                                <span>🛍️</span> Selected Add-ons
                                            </h4>
                                            <div className="space-y-2">
                                                {bookingsHook.selectedBooking.addons.map((addon, idx) => (
                                                    <div key={idx} className="text-sm">
                                                        <span>
                                                            {addon.addon_name}
                                                            {addon.quantity > 1 && <span className="text-gray-500"> x{addon.quantity}</span>}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="font-bold text-sm mb-3">Payment History</h4>
                                        <div className="space-y-3">
                                            {bookingsHook.selectedBooking.finance.payments.map((p, idx) => (
                                                <div key={idx} className="bg-white p-3 rounded border flex flex-col gap-2">
                                                    <div className="flex justify-between font-medium">
                                                        <span>Rp {p.amount.toLocaleString()}</span>
                                                        <span className="text-xs text-gray-500">{p.date}</span>
                                                    </div>
                                                    <div className="text-xs text-gray-500">{p.note}</div>
                                                    {(p.proof_url || p.proof_filename || p.proof_base64) && (
                                                        <div className="flex flex-col gap-2">
                                                            <img
                                                                src={p.proof_url || (p.proof_filename ? `/api/uploads/payment-proofs/${p.proof_filename}` : p.proof_base64 ?? '')}
                                                                alt="Payment Proof"
                                                                className="h-32 object-contain self-start border rounded bg-white"
                                                            />
                                                            {p.proof_url && (
                                                                <a
                                                                    href={p.proof_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                                                >
                                                                    <span>📎</span> View full size
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Add Payment Form - Disabled for Completed Bookings */}
                                    {bookingsHook.selectedBooking.status === 'Completed' ? (
                                        <div className="border-t pt-4 mt-4 bg-gray-50 p-3 rounded text-center">
                                            <p className="text-xs text-gray-600">
                                                Payment editing disabled for completed bookings
                                            </p>
                                        </div>
                                    ) : (
                                        <form
                                            className="border-t pt-4 mt-4"
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                const form = e.target as HTMLFormElement;
                                                const formData = new FormData(form);
                                                const amount = Number(formData.get('amount'));
                                                const note = formData.get('note') ?? '';
                                                if (!amount) return;

                                                const newPayment = {
                                                    date: new Date().toISOString().split('T')[0] ?? '',
                                                    amount,
                                                    note: String(note),
                                                    proof_base64: ''
                                                };

                                                bookingsHook.handleUpdateFinance(bookingsHook.selectedBooking.id, {
                                                    ...bookingsHook.selectedBooking.finance,
                                                    payments: [...bookingsHook.selectedBooking.finance.payments, newPayment]
                                                });
                                                form.reset();
                                            }}
                                        >
                                            <h4 className="font-bold text-sm mb-2">Add Payment (Pelunasan)</h4>
                                            <div className="grid grid-cols-2 gap-2 mb-2">
                                                <input name="amount" type="number" placeholder="Amount" className="border rounded p-2 text-sm" required />
                                                <input name="note" type="text" placeholder="Note (e.g. Cash)" className="border rounded p-2 text-sm" required />
                                            </div>
                                            <button type="submit" className="w-full bg-green-600 text-white text-sm font-bold py-2 rounded hover:bg-green-700">
                                                Add Payment
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reschedule Modal */}
                {bookingsHook.isRescheduleModalOpen && (
                    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
                            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                                <h2 className="text-xl font-bold">Reschedule Booking</h2>
                                <button onClick={() => bookingsHook.setIsRescheduleModalOpen(false)} className="text-gray-400 hover:text-red-500">
                                    <span style={{ fontSize: '24px' }}>✕</span>
                                </button>
                            </div>
                            <form onSubmit={handleReschedule} className="p-6 space-y-4">
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-sm text-blue-800">
                                    <p className="font-bold mb-1">Important:</p>
                                    <ul className="list-disc list-inside space-y-1 text-xs">
                                        <li>The system will check for slot availability</li>
                                        <li>Previous schedule will be saved in history</li>
                                        <li>Booking status will be set to "Rescheduled"</li>
                                    </ul>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">New Date *</label>
                                    <input
                                        required
                                        type="date"
                                        value={bookingsHook.rescheduleFormData.newDate}
                                        onChange={e => bookingsHook.setRescheduleFormData({ ...bookingsHook.rescheduleFormData, newDate: e.target.value })}
                                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">New Time * (30-minute intervals)</label>
                                    <input
                                        required
                                        type="time"
                                        step="1800"
                                        value={bookingsHook.rescheduleFormData.newTime}
                                        onChange={e => bookingsHook.setRescheduleFormData({ ...bookingsHook.rescheduleFormData, newTime: e.target.value })}
                                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Only 00:00, 00:30 minutes allowed (e.g., 09:00, 09:30, 10:00)</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Reason (Optional)</label>
                                    <textarea
                                        value={bookingsHook.rescheduleFormData.reason}
                                        onChange={e => bookingsHook.setRescheduleFormData({ ...bookingsHook.rescheduleFormData, reason: e.target.value })}
                                        placeholder="e.g., Customer request, Weather conditions, etc."
                                        rows={3}
                                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    />
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => bookingsHook.setIsRescheduleModalOpen(false)}
                                        className="flex-1 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span>💾</span>
                                        Confirm Reschedule
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Create Booking Modal */}
                {bookingsHook.isCreateBookingModalOpen && (
                    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                            <div className="p-6 border-b flex justify-between items-center bg-gray-50 sticky top-0">
                                <h2 className="text-xl font-bold">Create New Booking</h2>
                                <button onClick={() => bookingsHook.setIsCreateBookingModalOpen(false)} className="text-gray-400 hover:text-red-500">
                                    <span style={{ fontSize: '24px' }}>✕</span>
                                </button>
                            </div>
                            <form onSubmit={handleCreateBooking} className="p-6 space-y-6">
                                {/* Customer Information */}
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                                        <span>👤</span> Customer Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Customer Name *</label>
                                            <input
                                                required
                                                type="text"
                                                value={bookingsHook.bookingFormData.customer_name}
                                                onChange={e => bookingsHook.setBookingFormData({ ...bookingsHook.bookingFormData, customer_name: e.target.value })}
                                                placeholder="e.g. John Doe"
                                                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp Number *</label>
                                            <input
                                                required
                                                type="text"
                                                value={bookingsHook.bookingFormData.customer_whatsapp}
                                                onChange={e => bookingsHook.setBookingFormData({ ...bookingsHook.bookingFormData, customer_whatsapp: e.target.value })}
                                                placeholder="e.g. 081234567890"
                                                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Service Selection */}
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                    <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                                        <span>🏷️</span> Service Selection
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Service Category *</label>
                                            <select
                                                required
                                                value={bookingsHook.bookingFormData.service_id}
                                                onChange={e => handleServiceChange(e.target.value)}
                                                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                            >
                                                <option value="">-- Select Service --</option>
                                                {servicesHook.services.filter(s => s.isActive).map(service => (
                                                    <option key={service.id} value={service.id}>
                                                        {service.name} - Rp {(service.basePrice - service.discountValue).toLocaleString()}
                                                        {service.badgeText && ` (${service.badgeText})`}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {bookingsHook.availableBookingAddons.length > 0 && (
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                                    <span>🛍️</span> Available Add-ons
                                                </label>
                                                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3 bg-white">
                                                    {bookingsHook.availableBookingAddons.map(addon => {
                                                        const isSelected = bookingsHook.selectedBookingAddons.has(addon.id);
                                                        const quantity = bookingsHook.selectedBookingAddons.get(addon.id) || 1;
                                                        return (
                                                            <div key={addon.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                                                <label className="flex items-center gap-2 cursor-pointer flex-1">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isSelected}
                                                                        onChange={() => toggleBookingAddon(addon.id)}
                                                                        className="w-4 h-4 text-purple-600 rounded"
                                                                    />
                                                                    <div className="flex-1">
                                                                        <div className="font-semibold text-gray-800">{addon.name}</div>
                                                                        <div className="text-sm text-green-600 font-bold">+Rp {addon.price.toLocaleString()}</div>
                                                                    </div>
                                                                </label>
                                                                {isSelected && (
                                                                    <div className="flex items-center gap-2 ml-4">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updateBookingAddonQuantity(addon.id, quantity - 1)}
                                                                            className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded text-sm font-bold"
                                                                        >
                                                                            -
                                                                        </button>
                                                                        <span className="w-8 text-center text-sm font-bold">{quantity}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updateBookingAddonQuantity(addon.id, quantity + 1)}
                                                                            className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded text-sm font-bold"
                                                                        >
                                                                            +
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {bookingsHook.bookingFormData.service_id && (
                                            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-gray-700">Total Price:</span>
                                                    <span className="text-xl font-black text-green-600">Rp {calculateBookingTotal().toLocaleString()}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Booking Details */}
                                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                                    <h3 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
                                        <span>📅</span> Booking Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Session Date *</label>
                                            <input
                                                required
                                                type="date"
                                                value={bookingsHook.bookingFormData.booking_date}
                                                onChange={e => bookingsHook.setBookingFormData({ ...bookingsHook.bookingFormData, booking_date: e.target.value })}
                                                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Session Time * (30-min intervals)</label>
                                            <input
                                                required
                                                type="time"
                                                step="1800"
                                                value={bookingsHook.bookingFormData.booking_time}
                                                onChange={e => bookingsHook.setBookingFormData({ ...bookingsHook.bookingFormData, booking_time: e.target.value })}
                                                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                            />
                                            <p className="text-xs text-gray-400 mt-1">e.g., 09:00, 09:30, 10:00</p>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Location Link</label>
                                            <input
                                                type="url"
                                                value={bookingsHook.bookingFormData.location_link}
                                                onChange={e => bookingsHook.setBookingFormData({ ...bookingsHook.bookingFormData, location_link: e.target.value })}
                                                placeholder="e.g. Google Maps link"
                                                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Notes</label>
                                            <textarea
                                                value={bookingsHook.bookingFormData.booking_notes}
                                                onChange={e => bookingsHook.setBookingFormData({ ...bookingsHook.bookingFormData, booking_notes: e.target.value })}
                                                placeholder="Special requests, instructions, etc."
                                                rows={3}
                                                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Photographer Assignment */}
                                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                                    <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
                                        <span>📷</span> Photographer Assignment (Optional)
                                    </h3>
                                    <select
                                        value={bookingsHook.bookingFormData.photographer_id}
                                        onChange={e => bookingsHook.setBookingFormData({ ...bookingsHook.bookingFormData, photographer_id: e.target.value })}
                                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="">-- Not Assigned --</option>
                                        {photographersHook.photographers.filter(p => p.is_active).map(photographer => (
                                            <option key={photographer.id} value={photographer.id}>
                                                {photographer.name} {photographer.specialty ? `(${photographer.specialty})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Payment Information */}
                                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                    <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                                        <span>💶</span> Initial Payment (Optional)
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">DP Amount (Rp)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={bookingsHook.bookingFormData.dp_amount}
                                                onChange={e => bookingsHook.setBookingFormData({ ...bookingsHook.bookingFormData, dp_amount: Number(e.target.value) })}
                                                placeholder="0"
                                                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Payment Note</label>
                                            <input
                                                type="text"
                                                value={bookingsHook.bookingFormData.payment_note}
                                                onChange={e => bookingsHook.setBookingFormData({ ...bookingsHook.bookingFormData, payment_note: e.target.value })}
                                                placeholder="e.g. DP Awal, Cash, Transfer"
                                                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">Leave DP amount as 0 if no payment is made yet</p>
                                </div>

                                {/* Form Actions */}
                                <div className="pt-4 flex gap-3 border-t">
                                    <button
                                        type="button"
                                        onClick={() => bookingsHook.setIsCreateBookingModalOpen(false)}
                                        className="flex-1 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span>💾</span>
                                        Create Booking
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
