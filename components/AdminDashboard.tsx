'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Booking, Payment, Service, FinanceData } from '@/lib/storage';
import { Euro, XCircle, LayoutGrid, List, Tag, Save, Plus, Edit, Trash2, LogOut, User, Calendar, Download, Camera, ShoppingBag, Ticket } from 'lucide-react';
import { useSession, signOut } from "next-auth/react";
import CouponManagement from './CouponManagement';
import DashboardMetrics from './DashboardMetrics';

type BookingUpdate = {
    status?: Booking['status'];
    finance?: FinanceData;
    booking?: Booking['booking'];
    customer?: Booking['customer'];
    photographer_id?: string;
};

interface Photographer {
    id: string;
    name: string;
    phone?: string;
    specialty?: string;
    is_active: boolean;
    created_at: string;
}

interface Addon {
    id: string;
    name: string;
    price: number;
    applicable_categories?: string[];
    is_active: boolean;
    created_at: string;
}

export default function AdminDashboard() {
    const { data: session } = useSession();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [photographers, setPhotographers] = useState<Photographer[]>([]);
    const [addons, setAddons] = useState<Addon[]>([]);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [viewMode, setViewMode] = useState<'dashboard' | 'calendar' | 'table' | 'services' | 'photographers' | 'addons' | 'coupons'>('dashboard');
    const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Canceled' | 'Rescheduled'>('Active');

    // Date Range State
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0] ?? '',
        end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0] ?? ''
    });

    // Service CRUD state
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [serviceFormData, setServiceFormData] = useState({
        name: '',
        basePrice: 0,
        discountValue: 0,
        isActive: true,
        badgeText: ''
    });

    // Photographer CRUD state
    const [isPhotographerModalOpen, setIsPhotographerModalOpen] = useState(false);
    const [editingPhotographer, setEditingPhotographer] = useState<Photographer | null>(null);
    const [photographerFormData, setPhotographerFormData] = useState({
        name: '',
        phone: '',
        specialty: '',
        is_active: true
    });

    // Addon CRUD state
    const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
    const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
    const [addonFormData, setAddonFormData] = useState({
        name: '',
        price: 0,
        applicable_categories: [] as string[],
        is_active: true
    });

    // Booking Creation state (admin)
    const [isCreateBookingModalOpen, setIsCreateBookingModalOpen] = useState(false);
    const [bookingFormData, setBookingFormData] = useState({
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
    const [selectedBookingAddons, setSelectedBookingAddons] = useState<Map<string, number>>(new Map());
    const [availableBookingAddons, setAvailableBookingAddons] = useState<Addon[]>([]);

    // Reschedule state
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [rescheduleBookingId, setRescheduleBookingId] = useState<string | null>(null);
    const [rescheduleFormData, setRescheduleFormData] = useState({
        newDate: '',
        newTime: '',
        reason: ''
    });

    // Helper Finance
    const calculateFinance = (b: Booking) => {
        const total = b.finance.total_price;
        const paid = b.finance.payments.reduce((sum, p) => sum + p.amount, 0);
        const balance = total - paid;
        return { total, paid, balance, isPaidOff: balance <= 0 && total > 0 };
    };

    const fetchData = async () => {
        try {
            const [resBookings, resServices, resPhotographers, resAddons] = await Promise.all([
                fetch('/api/bookings'),
                fetch('/api/services'),
                fetch('/api/photographers'),
                fetch('/api/addons')
            ]);

            if (resBookings.ok) setBookings(await resBookings.json());
            if (resServices.ok) setServices(await resServices.json());
            if (resPhotographers.ok) setPhotographers(await resPhotographers.json());
            if (resAddons.ok) setAddons(await resAddons.json());

        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdate = async (bookingId: string, updates: BookingUpdate) => {
        try {
            const res = await fetch('/api/bookings/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: bookingId, ...updates })
            });
            if (res.ok) {
                const updated = await res.json();
                setBookings(prev => prev.map(b => b.id === bookingId ? updated : b));
                setSelectedBooking(updated);
                // alert("Updated successfully"); // Silent update is better for status toggles
            }
        } catch {
            alert("Failed to update");
        }
    };

    const handleUpdateFinance = (bookingId: string, newFinance: FinanceData) => handleUpdate(bookingId, { finance: newFinance });
    const handleUpdateStatus = (bookingId: string, status: Booking['status']) => handleUpdate(bookingId, { status });

    // Services Management
    const saveAllServices = async (updatedList: Service[]) => {
        try {
            const res = await fetch('/api/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedList)
            });
            if (res.ok) {
                setServices(updatedList);
                return true;
            }
            throw new Error("Failed");
        } catch {
            alert("Error saving services");
            return false;
        }
    };

    const handleOpenAddModal = () => {
        setEditingService(null);
        setServiceFormData({ name: '', basePrice: 0, discountValue: 0, isActive: true, badgeText: '' });
        setIsServiceModalOpen(true);
    };

    const handleOpenEditModal = (service: Service) => {
        setEditingService(service);
        setServiceFormData({
            name: service.name,
            basePrice: service.basePrice,
            discountValue: service.discountValue,
            isActive: service.isActive,
            badgeText: service.badgeText || ''
        });
        setIsServiceModalOpen(true);
    };

    const handleDeleteService = async (id: string) => {
        if (!confirm("Are you sure you want to delete this service?")) return;
        const updated = services.filter(s => s.id !== id);
        await saveAllServices(updated);
    };

    const handleSaveService = async (e: React.FormEvent) => {
        e.preventDefault();
        let updatedList: Service[];

        if (editingService) {
            updatedList = services.map(s => s.id === editingService.id ? { ...s, ...serviceFormData } : s);
        } else {
            const newService: Service = {
                id: crypto.randomUUID(),
                ...serviceFormData
            };
            updatedList = [...services, newService];
        }

        if (await saveAllServices(updatedList)) {
            setIsServiceModalOpen(false);
        }
    };

    const toggleServiceActive = async (id: string, active: boolean) => {
        const updated = services.map(s => s.id === id ? { ...s, isActive: active } : s);
        await saveAllServices(updated);
    };

    // Photographer Management
    const handleOpenAddPhotographerModal = () => {
        setEditingPhotographer(null);
        setPhotographerFormData({ name: '', phone: '', specialty: '', is_active: true });
        setIsPhotographerModalOpen(true);
    };

    const handleOpenEditPhotographerModal = (photographer: Photographer) => {
        setEditingPhotographer(photographer);
        setPhotographerFormData({
            name: photographer.name,
            phone: photographer.phone || '',
            specialty: photographer.specialty || '',
            is_active: photographer.is_active
        });
        setIsPhotographerModalOpen(true);
    };

    const handleDeletePhotographer = async (id: string) => {
        if (!confirm("Are you sure you want to delete this photographer? This will remove them from all assigned bookings.")) return;

        try {
            const res = await fetch(`/api/photographers?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setPhotographers(prev => prev.filter(p => p.id !== id));
                alert("Photographer deleted successfully");
            } else {
                throw new Error("Failed");
            }
        } catch {
            alert("Error deleting photographer");
        }
    };

    const handleSavePhotographer = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingPhotographer) {
                // Update existing photographer
                const res = await fetch('/api/photographers', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editingPhotographer.id, ...photographerFormData })
                });

                if (res.ok) {
                    setPhotographers(prev => prev.map(p =>
                        p.id === editingPhotographer.id ? { ...p, ...photographerFormData } : p
                    ));
                    setIsPhotographerModalOpen(false);
                    alert("Photographer updated successfully");
                } else {
                    throw new Error("Failed");
                }
            } else {
                // Create new photographer
                const res = await fetch('/api/photographers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(photographerFormData)
                });

                if (res.ok) {
                    const newPhotographer = await res.json();
                    setPhotographers(prev => [newPhotographer, ...prev]);
                    setIsPhotographerModalOpen(false);
                    alert("Photographer created successfully");
                } else {
                    throw new Error("Failed");
                }
            }
        } catch {
            alert("Error saving photographer");
        }
    };

    const togglePhotographerActive = async (id: string, active: boolean) => {
        try {
            const res = await fetch('/api/photographers', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, is_active: active })
            });

            if (res.ok) {
                setPhotographers(prev => prev.map(p => p.id === id ? { ...p, is_active: active } : p));
            } else {
                throw new Error("Failed");
            }
        } catch {
            alert("Error updating photographer");
        }
    };

    // Add-on Management
    const handleOpenAddAddonModal = () => {
        setEditingAddon(null);
        setAddonFormData({ name: '', price: 0, applicable_categories: [], is_active: true });
        setIsAddonModalOpen(true);
    };

    const handleOpenEditAddonModal = (addon: Addon) => {
        setEditingAddon(addon);
        setAddonFormData({
            name: addon.name,
            price: addon.price,
            applicable_categories: addon.applicable_categories || [],
            is_active: addon.is_active
        });
        setIsAddonModalOpen(true);
    };

    const handleDeleteAddon = async (id: string) => {
        if (!confirm("Are you sure you want to delete this add-on?")) return;

        try {
            const res = await fetch(`/api/addons?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setAddons(prev => prev.filter(a => a.id !== id));
                alert("Add-on deleted successfully");
            } else {
                throw new Error("Failed");
            }
        } catch {
            alert("Error deleting add-on");
        }
    };

    const handleSaveAddon = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingAddon) {
                const res = await fetch('/api/addons', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editingAddon.id, ...addonFormData })
                });

                if (res.ok) {
                    setAddons(prev => prev.map(a =>
                        a.id === editingAddon.id ? { ...a, ...addonFormData } : a
                    ));
                    setIsAddonModalOpen(false);
                    alert("Add-on updated successfully");
                } else {
                    throw new Error("Failed");
                }
            } else {
                const res = await fetch('/api/addons', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(addonFormData)
                });

                if (res.ok) {
                    const newAddon = await res.json();
                    setAddons(prev => [newAddon, ...prev]);
                    setIsAddonModalOpen(false);
                    alert("Add-on created successfully");
                } else {
                    throw new Error("Failed");
                }
            }
        } catch {
            alert("Error saving add-on");
        }
    };

    const toggleAddonActive = async (id: string, active: boolean) => {
        try {
            const res = await fetch('/api/addons', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, is_active: active })
            });

            if (res.ok) {
                setAddons(prev => prev.map(a => a.id === id ? { ...a, is_active: active } : a));
            } else {
                throw new Error("Failed");
            }
        } catch {
            alert("Error updating add-on");
        }
    };

    const toggleCategoryForAddon = (category: string) => {
        setAddonFormData(prev => {
            const cats = prev.applicable_categories || [];
            if (cats.includes(category)) {
                return { ...prev, applicable_categories: cats.filter(c => c !== category) };
            } else {
                return { ...prev, applicable_categories: [...cats, category] };
            }
        });
    };

    // Booking Creation Management (Admin)
    const handleOpenCreateBookingModal = () => {
        // Reset form
        setBookingFormData({
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
        setSelectedBookingAddons(new Map());
        setAvailableBookingAddons([]);
        setIsCreateBookingModalOpen(true);
    };

    const handleServiceChange = async (serviceId: string) => {
        setBookingFormData(prev => ({ ...prev, service_id: serviceId }));
        setSelectedBookingAddons(new Map()); // Reset add-ons when changing service

        if (!serviceId) {
            setAvailableBookingAddons([]);
            return;
        }

        // Fetch applicable add-ons for this service
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
    };

    const toggleBookingAddon = (addonId: string) => {
        setSelectedBookingAddons(prev => {
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
            setSelectedBookingAddons(prev => {
                const newMap = new Map(prev);
                newMap.delete(addonId);
                return newMap;
            });
        } else {
            setSelectedBookingAddons(prev => new Map(prev).set(addonId, quantity));
        }
    };

    const calculateBookingTotal = () => {
        const service = services.find(s => s.id === bookingFormData.service_id);
        if (!service) return 0;

        const basePrice = service.basePrice - service.discountValue;
        const addonsTotal = Array.from(selectedBookingAddons.entries()).reduce((total, [addonId, quantity]) => {
            const addon = availableBookingAddons.find(a => a.id === addonId);
            return total + (addon ? addon.price * quantity : 0);
        }, 0);

        return basePrice + addonsTotal;
    };

    const handleCreateBooking = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!bookingFormData.service_id) {
            alert('Please select a service');
            return;
        }

        try {
            // Prepare add-ons data
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

            // Construct booking payload
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
                    total_price: calculateBookingTotal(),
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

            // Update local state
            setBookings(prev => [newBooking, ...prev]);
            setIsCreateBookingModalOpen(false);
            alert('Booking created successfully!');

            // Optionally show the created booking
            setSelectedBooking(newBooking);
        } catch (error) {
            console.error('Error creating booking:', error);
            alert(`Failed to create booking: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    // Reschedule Handlers
    const handleOpenRescheduleModal = (bookingId: string, currentDate: string) => {
        // Parse current date to prefill the form
        const dateTimeParts = currentDate.split('T');
        const datePart = dateTimeParts[0] || '';
        const timePart = dateTimeParts[1]?.substring(0, 5) || '';

        setRescheduleBookingId(bookingId);
        setRescheduleFormData({
            newDate: datePart,
            newTime: timePart,
            reason: ''
        });
        setIsRescheduleModalOpen(true);
    };

    const handleReschedule = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!rescheduleBookingId) return;

        try {
            const newDateTime = `${rescheduleFormData.newDate}T${rescheduleFormData.newTime}`;

            const res = await fetch('/api/bookings/reschedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: rescheduleBookingId,
                    newDate: newDateTime,
                    reason: rescheduleFormData.reason || undefined
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || data.message || 'Failed to reschedule');
            }

            // Update local state
            setBookings(prev => prev.map(b =>
                b.id === rescheduleBookingId ? data.booking : b
            ));

            // Update selected booking if it's the one being rescheduled
            if (selectedBooking?.id === rescheduleBookingId) {
                setSelectedBooking(data.booking);
            }

            setIsRescheduleModalOpen(false);
            alert('Booking rescheduled successfully!');
        } catch (error) {
            console.error('Error rescheduling booking:', error);
            alert(`Failed to reschedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    // Export Handlers
    const handleExportBookings = async () => {
        try {
            const params = new URLSearchParams({
                status: filterStatus,
                startDate: dateRange.start,
                endDate: dateRange.end
            });

            const response = await fetch(`/api/export/bookings?${params}`);
            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ceritakita-bookings-${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export bookings');
        }
    };

    const handleExportFinancial = async () => {
        try {
            const params = new URLSearchParams({
                startDate: dateRange.start,
                endDate: dateRange.end
            });

            const response = await fetch(`/api/export/financial?${params}`);
            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ceritakita-financial-report-${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export financial report');
        }
    };

    // Convert bookings to events
    const events = bookings.filter(b => b.status === 'Active' || b.status === 'Rescheduled').map(b => ({
        id: b.id,
        title: `${b.customer.name} (${b.customer.category})`,
        start: b.booking.date,
        backgroundColor: b.customer.category.includes('Outdoor') ? '#10B981' : '#3B82F6',
        extendedProps: { booking: b }
    }));

    const filteredBookings = useMemo(() => {
        return bookings.filter(b => {
            const isMatchStatus = filterStatus === 'All' || b.status === filterStatus;
            return isMatchStatus;
        });
    }, [bookings, filterStatus]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Navigation */}
            <div className="bg-white border-b px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-10">
                <div className="flex items-center gap-6">
                    <h1 className="text-2xl font-bold text-blue-900">Admin Panel</h1>
                    <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto">
                        {(['dashboard', 'calendar', 'table', 'services', 'photographers', 'addons', 'coupons'] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-4 py-2 rounded-md capitalize transition font-semibold text-sm whitespace-nowrap ${viewMode === mode ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {mode === 'addons' ? 'Add-ons' : mode === 'table' ? 'Booking' : mode}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-1.5 font-bold text-xs text-gray-600">
                        <Calendar size={14} />
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="bg-transparent outline-none cursor-pointer"
                        />
                        <span>to</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="bg-transparent outline-none cursor-pointer"
                        />
                    </div>

                    {/* Export Buttons */}
                    <div className="hidden md:flex items-center gap-2">
                        <button
                            onClick={handleExportBookings}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
                            title="Export filtered bookings to Excel"
                        >
                            <Download size={14} />
                            <span className="hidden lg:inline">Bookings</span>
                        </button>
                        <button
                            onClick={handleExportFinancial}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                            title="Export financial report to Excel"
                        >
                            <Download size={14} />
                            <span className="hidden lg:inline">Financial</span>
                        </button>
                    </div>

                    <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center">
                            <User size={14} />
                        </div>
                        <span className="text-sm font-bold text-blue-900">
                            Hello, {session?.user?.name || 'Admin'}
                        </span>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </div>

            <div className="p-6 flex-1 overflow-auto">

                {/* VIEW: DASHBOARD */}
                {viewMode === 'dashboard' && (
                    <div className="space-y-8 animate-in fade-in">
                        <DashboardMetrics bookings={filteredBookings} />

                        {/* Recent Activity Mini Table */}
                        <div className="bg-white rounded-xl shadow overflow-hidden">
                            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                                <h3 className="font-bold text-gray-700 flex items-center gap-2"><LayoutGrid size={18} /> Recent Activity (Filtered)</h3>
                                <button onClick={() => setViewMode('table')} className="text-sm text-blue-600 hover:underline">View All</button>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500">
                                    <tr>
                                        <th className="px-4 py-3">Customer</th>
                                        <th className="px-4 py-3">Category</th>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-right">Price</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {[...filteredBookings].reverse().slice(0, 5).map(b => (
                                        <tr key={b.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedBooking(b)}>
                                            <td className="px-4 py-3 font-medium">{b.customer.name}</td>
                                            <td className="px-4 py-3">{b.customer.category}</td>
                                            <td className="px-4 py-3">{new Date(b.booking.date).toLocaleDateString()}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium
                                  ${b.status === 'Canceled' ? 'bg-red-100 text-red-700' :
                                                        b.status === 'Rescheduled' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                                    {b.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">Rp {b.finance.total_price.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* VIEW: CALENDAR */}
                {viewMode === 'calendar' && (
                    <div className="bg-white p-6 rounded-xl shadow-lg h-[700px] animate-in fade-in">
                        <FullCalendar
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            events={events}
                            eventClick={(info: any) => {
                                setSelectedBooking(info.event.extendedProps.booking);
                            }}
                            height="100%"
                        />
                    </div>
                )}

                {/* VIEW: TABLE */}
                {viewMode === 'table' && (
                    <div className="bg-white rounded-xl shadow overflow-hidden animate-in fade-in min-h-[500px]">
                        <div className="p-4 border-b flex gap-4 items-center bg-gray-50 justify-between">
                            <div className="flex gap-4 items-center">
                                <h3 className="font-bold text-gray-700 flex items-center gap-2"><List size={18} /> All Bookings</h3>
                                <div className="flex bg-white border rounded-lg overflow-hidden text-sm">
                                    {(['All', 'Active', 'Rescheduled', 'Canceled'] as const).map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setFilterStatus(s)}
                                            className={`px-3 py-1.5 ${filterStatus === s ? 'bg-blue-600 text-white' : 'hover:bg-gray-50 text-gray-600'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={handleOpenCreateBookingModal}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                            >
                                <Plus size={16} /> Create Booking
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Time</th>
                                        <th className="px-4 py-3">Customer</th>
                                        <th className="px-4 py-3">Phone</th>
                                        <th className="px-4 py-3">Category</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-right">Balance</th>
                                        <th className="px-4 py-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredBookings.length === 0 && (
                                        <tr><td colSpan={8} className="text-center p-8 text-gray-400">No bookings found.</td></tr>
                                    )}
                                    {[...filteredBookings].reverse().map(b => {
                                        const { balance, isPaidOff } = calculateFinance(b);
                                        return (
                                            <tr key={b.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">{new Date(b.booking.date).toLocaleDateString()}</td>
                                                <td className="px-4 py-3 text-gray-600">{new Date(b.booking.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                                <td className="px-4 py-3 font-medium">{b.customer.name}</td>
                                                <td className="px-4 py-3">{b.customer.whatsapp}</td>
                                                <td className="px-4 py-3">{b.customer.category}</td>
                                                <td className="px-4 py-3">
                                                    <select
                                                        value={b.status}
                                                        onChange={(e) => handleUpdateStatus(b.id, e.target.value as Booking['status'])}
                                                        className={`border-none bg-transparent text-xs font-bold focus:ring-0 cursor-pointer
                                      ${b.status === 'Canceled' ? 'text-red-600' : b.status === 'Rescheduled' ? 'text-orange-600' : 'text-green-600'}`}
                                                    >
                                                        <option value="Active">Active</option>
                                                        <option value="Rescheduled">Rescheduled</option>
                                                        <option value="Canceled">Canceled</option>
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {isPaidOff ? (
                                                        <span className="text-green-600 font-bold text-xs bg-green-100 px-2 py-1 rounded">LUNAS</span>
                                                    ) : (
                                                        <span className="text-red-500 font-medium">Rp {balance.toLocaleString()}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button onClick={() => setSelectedBooking(b)} className="text-blue-600 hover:text-blue-800 font-medium text-xs border border-blue-200 px-3 py-1 rounded hover:bg-blue-50">
                                                        Details
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* VIEW: SERVICES */}
                {viewMode === 'services' && (
                    <div className="bg-white rounded-xl shadow overflow-hidden animate-in fade-in">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2"><Tag size={18} /> Manage Services & Pricing</h3>
                            <button onClick={handleOpenAddModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                                <Plus size={16} /> Add New Service
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500">
                                    <tr>
                                        <th className="px-6 py-3">Service Name</th>
                                        <th className="px-6 py-3">Badge Info</th>
                                        <th className="px-6 py-3">Base Price (Rp)</th>
                                        <th className="px-6 py-3">Discount (Rp)</th>
                                        <th className="px-6 py-3">Final Price</th>
                                        <th className="px-6 py-3 text-center">Active</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {services.map(service => (
                                        <tr key={service.id} className="hover:bg-gray-50 group">
                                            <td className="px-6 py-4 font-semibold">{service.name}</td>
                                            <td className="px-6 py-4">
                                                {service.badgeText ? (
                                                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                                        {service.badgeText}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300 text-xs italic">No Badge</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                Rp {service.basePrice.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-red-500 font-medium">
                                                - Rp {service.discountValue.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 font-black text-gray-900">
                                                Rp {(service.basePrice - service.discountValue).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => toggleServiceActive(service.id, !service.isActive)}
                                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-colors ${service.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                                >
                                                    {service.isActive ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleOpenEditModal(service)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button onClick={() => handleDeleteService(service.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* VIEW: PHOTOGRAPHERS */}
                {viewMode === 'photographers' && (
                    <div className="bg-white rounded-xl shadow overflow-hidden animate-in fade-in">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2"><Camera size={18} /> Manage Photographers</h3>
                            <button onClick={handleOpenAddPhotographerModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                                <Plus size={16} /> Add New Photographer
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500">
                                    <tr>
                                        <th className="px-6 py-3">Photographer Name</th>
                                        <th className="px-6 py-3">Phone</th>
                                        <th className="px-6 py-3">Specialty</th>
                                        <th className="px-6 py-3 text-center">Active</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {photographers.length === 0 && (
                                        <tr><td colSpan={5} className="text-center p-8 text-gray-400">No photographers found. Add one to get started!</td></tr>
                                    )}
                                    {photographers.map(photographer => (
                                        <tr key={photographer.id} className="hover:bg-gray-50 group">
                                            <td className="px-6 py-4 font-semibold">{photographer.name}</td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {photographer.phone || <span className="text-gray-300 italic">No phone</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                {photographer.specialty ? (
                                                    <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-1 rounded-full">
                                                        {photographer.specialty}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300 text-xs italic">No specialty</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => togglePhotographerActive(photographer.id, !photographer.is_active)}
                                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-colors ${photographer.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                                >
                                                    {photographer.is_active ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleOpenEditPhotographerModal(photographer)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button onClick={() => handleDeletePhotographer(photographer.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* VIEW: ADD-ONS */}
                {viewMode === 'addons' && (
                    <div className="bg-white rounded-xl shadow overflow-hidden animate-in fade-in">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2"><ShoppingBag size={18} /> Manage Add-ons</h3>
                            <button onClick={handleOpenAddAddonModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                                <Plus size={16} /> Add New Add-on
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500">
                                    <tr>
                                        <th className="px-6 py-3">Add-on Name</th>
                                        <th className="px-6 py-3">Price (Rp)</th>
                                        <th className="px-6 py-3">Applicable To</th>
                                        <th className="px-6 py-3 text-center">Active</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {addons.length === 0 && (
                                        <tr><td colSpan={5} className="text-center p-8 text-gray-400">No add-ons found. Add one to get started!</td></tr>
                                    )}
                                    {addons.map(addon => (
                                        <tr key={addon.id} className="hover:bg-gray-50 group">
                                            <td className="px-6 py-4 font-semibold">{addon.name}</td>
                                            <td className="px-6 py-4 text-green-600 font-bold">
                                                Rp {addon.price.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                {addon.applicable_categories && addon.applicable_categories.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {addon.applicable_categories.map(cat => (
                                                            <span key={cat} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                                                                {cat}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs italic">All Categories</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => toggleAddonActive(addon.id, !addon.is_active)}
                                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-colors ${addon.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                                >
                                                    {addon.is_active ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleOpenEditAddonModal(addon)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button onClick={() => handleDeleteAddon(addon.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Coupon Management View */}
                {viewMode === 'coupons' && (
                    <div className="animate-in fade-in">
                        <CouponManagement />
                    </div>
                )}
            </div>

            {/* Service Edit/Add Modal */}
            {isServiceModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold">{editingService ? 'Edit Service' : 'Add New Service'}</h2>
                            <button onClick={() => setIsServiceModalOpen(false)} className="text-gray-400 hover:text-red-500">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveService} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Service Name</label>
                                <input
                                    required
                                    type="text"
                                    value={serviceFormData.name}
                                    onChange={e => setServiceFormData({ ...serviceFormData, name: e.target.value })}
                                    placeholder="e.g. Seasonal Promo"
                                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Badge Info (e.g. Best Deal)</label>
                                <input
                                    type="text"
                                    value={serviceFormData.badgeText}
                                    onChange={e => setServiceFormData({ ...serviceFormData, badgeText: e.target.value })}
                                    placeholder="Empty if no badge"
                                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Base Price (Rp)</label>
                                    <input
                                        required
                                        type="number"
                                        value={serviceFormData.basePrice}
                                        onChange={e => setServiceFormData({ ...serviceFormData, basePrice: Number(e.target.value) })}
                                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Discount (Rp)</label>
                                    <input
                                        required
                                        type="number"
                                        value={serviceFormData.discountValue}
                                        onChange={e => setServiceFormData({ ...serviceFormData, discountValue: Number(e.target.value) })}
                                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-red-600 font-medium"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={serviceFormData.isActive}
                                    onChange={e => setServiceFormData({ ...serviceFormData, isActive: e.target.checked })}
                                    className="w-5 h-5 text-blue-600 rounded"
                                />
                                <label htmlFor="is_active" className="text-sm font-bold text-gray-700 cursor-pointer">Service is Active</label>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsServiceModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center justify-center gap-2">
                                    <Save size={18} />
                                    {editingService ? 'Update Service' : 'Create Service'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Photographer Edit/Add Modal */}
            {isPhotographerModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold">{editingPhotographer ? 'Edit Photographer' : 'Add New Photographer'}</h2>
                            <button onClick={() => setIsPhotographerModalOpen(false)} className="text-gray-400 hover:text-red-500">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSavePhotographer} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Photographer Name</label>
                                <input
                                    required
                                    type="text"
                                    value={photographerFormData.name}
                                    onChange={e => setPhotographerFormData({ ...photographerFormData, name: e.target.value })}
                                    placeholder="e.g. John Doe"
                                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="text"
                                    value={photographerFormData.phone}
                                    onChange={e => setPhotographerFormData({ ...photographerFormData, phone: e.target.value })}
                                    placeholder="e.g. 081234567890"
                                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Specialty</label>
                                <input
                                    type="text"
                                    value={photographerFormData.specialty}
                                    onChange={e => setPhotographerFormData({ ...photographerFormData, specialty: e.target.value })}
                                    placeholder="e.g. Wedding, Portrait, Outdoor"
                                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="photographer_active"
                                    checked={photographerFormData.is_active}
                                    onChange={e => setPhotographerFormData({ ...photographerFormData, is_active: e.target.checked })}
                                    className="w-5 h-5 text-blue-600 rounded"
                                />
                                <label htmlFor="photographer_active" className="text-sm font-bold text-gray-700 cursor-pointer">Photographer is Active</label>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsPhotographerModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center justify-center gap-2">
                                    <Save size={18} />
                                    {editingPhotographer ? 'Update Photographer' : 'Create Photographer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add-on Edit/Add Modal */}
            {isAddonModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold">{editingAddon ? 'Edit Add-on' : 'Add New Add-on'}</h2>
                            <button onClick={() => setIsAddonModalOpen(false)} className="text-gray-400 hover:text-red-500">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveAddon} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Add-on Name</label>
                                <input
                                    required
                                    type="text"
                                    value={addonFormData.name}
                                    onChange={e => setAddonFormData({ ...addonFormData, name: e.target.value })}
                                    placeholder="e.g. Extra Hour, Drone Shots"
                                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Price (Rp)</label>
                                <input
                                    required
                                    type="number"
                                    value={addonFormData.price}
                                    onChange={e => setAddonFormData({ ...addonFormData, price: Number(e.target.value) })}
                                    placeholder="e.g. 500000"
                                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Applicable To (leave empty for all)</label>
                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                                    {services.map(service => (
                                        <label key={service.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                            <input
                                                type="checkbox"
                                                checked={addonFormData.applicable_categories.includes(service.name)}
                                                onChange={() => toggleCategoryForAddon(service.name)}
                                                className="w-4 h-4 text-blue-600 rounded"
                                            />
                                            <span className="text-xs">{service.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="addon_active"
                                    checked={addonFormData.is_active}
                                    onChange={e => setAddonFormData({ ...addonFormData, is_active: e.target.checked })}
                                    className="w-5 h-5 text-blue-600 rounded"
                                />
                                <label htmlFor="addon_active" className="text-sm font-bold text-gray-700 cursor-pointer">Add-on is Active</label>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsAddonModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center justify-center gap-2">
                                    <Save size={18} />
                                    {editingAddon ? 'Update Add-on' : 'Create Add-on'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Booking Creation Modal (Admin) */}
            {isCreateBookingModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50 sticky top-0">
                            <h2 className="text-xl font-bold">Create New Booking</h2>
                            <button onClick={() => setIsCreateBookingModalOpen(false)} className="text-gray-400 hover:text-red-500">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateBooking} className="p-6 space-y-6">
                            {/* Customer Information */}
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                                    <User size={16} /> Customer Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Customer Name *</label>
                                        <input
                                            required
                                            type="text"
                                            value={bookingFormData.customer_name}
                                            onChange={e => setBookingFormData({ ...bookingFormData, customer_name: e.target.value })}
                                            placeholder="e.g. John Doe"
                                            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp Number *</label>
                                        <input
                                            required
                                            type="text"
                                            value={bookingFormData.customer_whatsapp}
                                            onChange={e => setBookingFormData({ ...bookingFormData, customer_whatsapp: e.target.value })}
                                            placeholder="e.g. 081234567890"
                                            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Service Selection */}
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                                    <Tag size={16} /> Service Selection
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Service Category *</label>
                                        <select
                                            required
                                            value={bookingFormData.service_id}
                                            onChange={e => handleServiceChange(e.target.value)}
                                            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                        >
                                            <option value="">-- Select Service --</option>
                                            {services.filter(s => s.isActive).map(service => (
                                                <option key={service.id} value={service.id}>
                                                    {service.name} - Rp {(service.basePrice - service.discountValue).toLocaleString()}
                                                    {service.badgeText && ` (${service.badgeText})`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Add-ons Selection */}
                                    {availableBookingAddons.length > 0 && (
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                                <ShoppingBag size={14} /> Available Add-ons
                                            </label>
                                            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3 bg-white">
                                                {availableBookingAddons.map(addon => (
                                                    <div key={addon.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                                        <label className="flex items-center gap-2 cursor-pointer flex-1">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedBookingAddons.has(addon.id)}
                                                                onChange={() => toggleBookingAddon(addon.id)}
                                                                className="w-4 h-4 text-purple-600 rounded"
                                                            />
                                                            <span className="text-sm font-medium">{addon.name}</span>
                                                            <span className="text-sm text-green-600 font-bold">Rp {addon.price.toLocaleString()}</span>
                                                        </label>
                                                        {selectedBookingAddons.has(addon.id) && (
                                                            <div className="flex items-center gap-2 ml-4">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateBookingAddonQuantity(addon.id, (selectedBookingAddons.get(addon.id) || 1) - 1)}
                                                                    className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded text-sm font-bold"
                                                                >
                                                                    -
                                                                </button>
                                                                <span className="w-8 text-center text-sm font-bold">{selectedBookingAddons.get(addon.id)}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateBookingAddonQuantity(addon.id, (selectedBookingAddons.get(addon.id) || 1) + 1)}
                                                                    className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded text-sm font-bold"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Total Price Display */}
                                    {bookingFormData.service_id && (
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
                                    <Calendar size={16} /> Booking Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Session Date *</label>
                                        <input
                                            required
                                            type="date"
                                            value={bookingFormData.booking_date}
                                            onChange={e => setBookingFormData({ ...bookingFormData, booking_date: e.target.value })}
                                            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Session Time * (30-min intervals)</label>
                                        <input
                                            required
                                            type="time"
                                            step="1800"
                                            value={bookingFormData.booking_time}
                                            onChange={e => setBookingFormData({ ...bookingFormData, booking_time: e.target.value })}
                                            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">e.g., 09:00, 09:30, 10:00</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Location Link</label>
                                        <input
                                            type="url"
                                            value={bookingFormData.location_link}
                                            onChange={e => setBookingFormData({ ...bookingFormData, location_link: e.target.value })}
                                            placeholder="e.g. Google Maps link"
                                            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Notes</label>
                                        <textarea
                                            value={bookingFormData.booking_notes}
                                            onChange={e => setBookingFormData({ ...bookingFormData, booking_notes: e.target.value })}
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
                                    <Camera size={16} /> Photographer Assignment (Optional)
                                </h3>
                                <select
                                    value={bookingFormData.photographer_id}
                                    onChange={e => setBookingFormData({ ...bookingFormData, photographer_id: e.target.value })}
                                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="">-- Not Assigned --</option>
                                    {photographers.filter(p => p.is_active).map(photographer => (
                                        <option key={photographer.id} value={photographer.id}>
                                            {photographer.name} {photographer.specialty ? `(${photographer.specialty})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Payment Information */}
                            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                                    <Euro size={16} /> Initial Payment (Optional)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">DP Amount (Rp)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={bookingFormData.dp_amount}
                                            onChange={e => setBookingFormData({ ...bookingFormData, dp_amount: Number(e.target.value) })}
                                            placeholder="0"
                                            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Payment Note</label>
                                        <input
                                            type="text"
                                            value={bookingFormData.payment_note}
                                            onChange={e => setBookingFormData({ ...bookingFormData, payment_note: e.target.value })}
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
                                    onClick={() => setIsCreateBookingModalOpen(false)}
                                    className="flex-1 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <Save size={18} />
                                    Create Booking
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Modal (Reused) */}
            {selectedBooking && selectedBooking.booking && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50 sticky top-0">
                            <h2 className="text-2xl font-bold">Booking Details</h2>
                            <button onClick={() => setSelectedBooking(null)} className="text-gray-500 hover:text-red-500">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left: General Info */}
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-semibold text-gray-500 text-sm uppercase">Customer</h3>
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${selectedBooking.status === 'Canceled' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
                                            {selectedBooking.status}
                                        </span>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="font-bold text-lg">{selectedBooking.customer.name}</p>
                                        <p>WA: {selectedBooking.customer.whatsapp}</p>
                                        <p>Category: {selectedBooking.customer.category}</p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-500 text-sm uppercase mb-2">Session</h3>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="font-bold">{new Date(selectedBooking.booking.date).toLocaleString()}</p>
                                        <p className="mt-2 text-sm text-gray-600">Notes: {selectedBooking.booking.notes || '-'}</p>
                                        {selectedBooking.booking.location_link && (
                                            <a href={selectedBooking.booking.location_link} target="_blank" className="text-blue-600 hover:underline block mt-2">
                                                Open Maps
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-orange-50 p-4 rounded border border-orange-100">
                                    <h4 className="font-bold text-orange-800 text-sm mb-2">Manage Status</h4>
                                    <select
                                        value={selectedBooking.status}
                                        onChange={(e) => handleUpdateStatus(selectedBooking.id, e.target.value as Booking['status'])}
                                        className="w-full p-2 border rounded"
                                    >
                                        <option value="Active">Active (Confirmed)</option>
                                        <option value="Rescheduled">Rescheduled</option>
                                        <option value="Canceled">Canceled</option>
                                    </select>
                                    <button
                                        onClick={() => handleOpenRescheduleModal(selectedBooking.id, selectedBooking.booking.date)}
                                        className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                                    >
                                        <Calendar size={14} />
                                        Reschedule Date/Time
                                    </button>
                                </div>

                                {selectedBooking.reschedule_history && selectedBooking.reschedule_history.length > 0 && (
                                    <div className="bg-yellow-50 p-4 rounded border border-yellow-100">
                                        <h4 className="font-bold text-yellow-800 text-sm mb-2">Reschedule History</h4>
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {selectedBooking.reschedule_history.map((history, idx) => (
                                                <div key={idx} className="bg-white p-2 rounded border text-xs">
                                                    <div className="flex justify-between mb-1">
                                                        <span className="font-medium text-gray-600">Changed on: {new Date(history.rescheduled_at).toLocaleString()}</span>
                                                    </div>
                                                    <div className="text-gray-600">
                                                        <span className="line-through text-red-600">{new Date(history.old_date).toLocaleString()}</span>
                                                        {' → '}
                                                        <span className="text-green-600 font-medium">{new Date(history.new_date).toLocaleString()}</span>
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
                                        <Camera size={14} /> Assign Photographer
                                    </h4>
                                    <select
                                        value={selectedBooking.photographer_id || ''}
                                        onChange={(e) => handleUpdate(selectedBooking.id, { photographer_id: e.target.value || undefined })}
                                        className="w-full p-2 border rounded bg-white"
                                    >
                                        <option value="">-- Not Assigned --</option>
                                        {photographers.filter(p => p.is_active).map(photographer => (
                                            <option key={photographer.id} value={photographer.id}>
                                                {photographer.name} {photographer.specialty ? `(${photographer.specialty})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {selectedBooking.photographer_id && (
                                        <p className="text-xs text-purple-600 mt-1">
                                            Assigned to: {photographers.find(p => p.id === selectedBooking.photographer_id)?.name || 'Unknown'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Right: Finance */}
                            <div className="space-y-6">
                                <h3 className="font-semibold text-gray-500 text-sm uppercase mb-2 flex items-center gap-2">
                                    <Euro size={16} /> Financials
                                </h3>

                                {/* Total Price Display (Read-only) */}
                                <div className="flex gap-4 items-end">
                                    <div className="flex-1">
                                        <label className="text-sm text-gray-500">Total Package Price</label>
                                        <div className="w-full border rounded p-2 bg-gray-50 font-bold text-lg">
                                            Rp {selectedBooking.finance.total_price.toLocaleString('id-ID')}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">Calculated from service + add-ons at booking time</p>
                                    </div>
                                    <div className="flex-1 text-right">
                                        <div className="text-sm text-gray-500">Status</div>
                                        <div className={`font-bold text-xl ${calculateFinance(selectedBooking).isPaidOff ? 'text-green-600' : 'text-red-600'}`}>
                                            {calculateFinance(selectedBooking).isPaidOff ? 'LUNAS' : 'BELUM LUNAS'}
                                        </div>
                                    </div>
                                </div>

                                {/* Add-ons List */}
                                {selectedBooking.addons && selectedBooking.addons.length > 0 && (
                                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                                        <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                                            <ShoppingBag size={14} className="text-blue-600" />
                                            Selected Add-ons
                                        </h4>
                                        <div className="space-y-2">
                                            {selectedBooking.addons.map((addon, idx) => (
                                                <div key={idx} className="flex justify-between text-sm">
                                                    <span>
                                                        {addon.addon_name}
                                                        {addon.quantity > 1 && <span className="text-gray-500"> x{addon.quantity}</span>}
                                                    </span>
                                                    <span className="font-bold text-green-600">
                                                        Rp {(addon.price_at_booking * addon.quantity).toLocaleString()}
                                                    </span>
                                                </div>
                                            ))}
                                            <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                                                <span>Add-ons Subtotal:</span>
                                                <span className="text-blue-600">
                                                    Rp {selectedBooking.addons.reduce((sum, a) => sum + (a.price_at_booking * a.quantity), 0).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Payments List */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="font-bold text-sm mb-3">Payment History</h4>
                                    <div className="space-y-3">
                                        {selectedBooking.finance.payments.map((p, idx) => (
                                            <div key={idx} className="bg-white p-3 rounded border flex flex-col gap-2">
                                                <div className="flex justify-between font-medium">
                                                    <span>Rp {p.amount.toLocaleString()}</span>
                                                    <span className="text-xs text-gray-500">{p.date}</span>
                                                </div>
                                                <div className="text-xs text-gray-500">{p.note}</div>
                                                {(p.proof_filename || p.proof_base64) && (
                                                    <Image
                                                        src={p.proof_filename ? `/api/uploads/payment-proofs/${p.proof_filename}` : p.proof_base64 ?? ''}
                                                        alt="Proof"
                                                        width={200}
                                                        height={80}
                                                        className="h-20 object-contain self-start border rounded"
                                                        unoptimized={!!p.proof_base64}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Add Payment Form */}
                                <form
                                    className="border-t pt-4 mt-4"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        const form = e.target as HTMLFormElement;
                                        const formData = new FormData(form);
                                        const amount = Number(formData.get('amount'));
                                        const note = formData.get('note') ?? '';
                                        if (!amount) return;

                                        const newPayment: Payment = {
                                            date: new Date().toISOString().split('T')[0] ?? '',
                                            amount,
                                            note: String(note),
                                            proof_base64: ''
                                        };

                                        handleUpdateFinance(selectedBooking.id, {
                                            ...selectedBooking.finance,
                                            payments: [...selectedBooking.finance.payments, newPayment]
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

                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reschedule Modal */}
            {isRescheduleModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold">Reschedule Booking</h2>
                            <button onClick={() => setIsRescheduleModalOpen(false)} className="text-gray-400 hover:text-red-500">
                                <XCircle size={24} />
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
                                    value={rescheduleFormData.newDate}
                                    onChange={e => setRescheduleFormData({ ...rescheduleFormData, newDate: e.target.value })}
                                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">New Time * (30-minute intervals)</label>
                                <input
                                    required
                                    type="time"
                                    step="1800"
                                    value={rescheduleFormData.newTime}
                                    onChange={e => setRescheduleFormData({ ...rescheduleFormData, newTime: e.target.value })}
                                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">Only 00:00, 00:30 minutes allowed (e.g., 09:00, 09:30, 10:00)</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Reason (Optional)</label>
                                <textarea
                                    value={rescheduleFormData.reason}
                                    onChange={e => setRescheduleFormData({ ...rescheduleFormData, reason: e.target.value })}
                                    placeholder="e.g., Customer request, Weather conditions, etc."
                                    rows={3}
                                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsRescheduleModalOpen(false)}
                                    className="flex-1 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <Save size={18} />
                                    Confirm Reschedule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
