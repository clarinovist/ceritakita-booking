/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Booking, Payment, Service } from '@/lib/storage';
import { Euro, XCircle, LayoutGrid, List, Tag, Save, Plus, Edit, Trash2, LogOut, User, Calendar } from 'lucide-react';
import { useSession, signOut } from "next-auth/react";
import DashboardMetrics from './DashboardMetrics';

export default function AdminDashboard() {
    const { data: session } = useSession();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [viewMode, setViewMode] = useState<'dashboard' | 'calendar' | 'table' | 'services'>('dashboard');
    const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Canceled' | 'Rescheduled'>('All');

    // Date Range State
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
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

    // Helper Finance
    const calculateFinance = (b: Booking) => {
        const total = b.finance.total_price;
        const paid = b.finance.payments.reduce((sum, p) => sum + p.amount, 0);
        const balance = total - paid;
        return { total, paid, balance, isPaidOff: balance <= 0 && total > 0 };
    };

    const fetchData = async () => {
        try {
            const [resBookings, resServices] = await Promise.all([
                fetch('/api/bookings'),
                fetch('/api/services')
            ]);

            if (resBookings.ok) setBookings(await resBookings.json());
            if (resServices.ok) setServices(await resServices.json());

        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdate = async (bookingId: string, updates: any) => {
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

    const handleUpdateFinance = (bookingId: string, newFinance: any) => handleUpdate(bookingId, { finance: newFinance });
    const handleUpdateStatus = (bookingId: string, status: string) => handleUpdate(bookingId, { status });

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
            const bDate = b.booking.date.split('T')[0];
            const isInRange = bDate >= dateRange.start && bDate <= dateRange.end;
            const isMatchStatus = filterStatus === 'All' || b.status === filterStatus;
            return isInRange && isMatchStatus;
        });
    }, [bookings, dateRange, filterStatus]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Navigation */}
            <div className="bg-white border-b px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-10">
                <div className="flex items-center gap-6">
                    <h1 className="text-2xl font-bold text-blue-900">Admin Panel</h1>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {['dashboard', 'calendar', 'table', 'services'].map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode as any)}
                                className={`px-4 py-2 rounded-md capitalize transition font-semibold text-sm ${viewMode === mode ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {mode}
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
                            eventClick={(info) => {
                                setSelectedBooking(info.event.extendedProps.booking);
                            }}
                            height="100%"
                        />
                    </div>
                )}

                {/* VIEW: TABLE */}
                {viewMode === 'table' && (
                    <div className="bg-white rounded-xl shadow overflow-hidden animate-in fade-in min-h-[500px]">
                        <div className="p-4 border-b flex gap-4 items-center bg-gray-50">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2"><List size={18} /> All Bookings</h3>
                            <div className="flex bg-white border rounded-lg overflow-hidden text-sm">
                                {['All', 'Active', 'Rescheduled', 'Canceled'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setFilterStatus(s as any)}
                                        className={`px-3 py-1.5 ${filterStatus === s ? 'bg-blue-600 text-white' : 'hover:bg-gray-50 text-gray-600'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
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
                                        <tr><td colSpan={7} className="text-center p-8 text-gray-400">No bookings found.</td></tr>
                                    )}
                                    {[...filteredBookings].reverse().map(b => {
                                        const { balance, isPaidOff } = calculateFinance(b);
                                        return (
                                            <tr key={b.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">{new Date(b.booking.date).toLocaleDateString()} <span className="text-gray-400 text-xs">{new Date(b.booking.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></td>
                                                <td className="px-4 py-3 font-medium">{b.customer.name}</td>
                                                <td className="px-4 py-3">{b.customer.whatsapp}</td>
                                                <td className="px-4 py-3">{b.customer.category}</td>
                                                <td className="px-4 py-3">
                                                    <select
                                                        value={b.status}
                                                        onChange={(e) => handleUpdateStatus(b.id, e.target.value)}
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
                                        onChange={(e) => handleUpdateStatus(selectedBooking.id, e.target.value)}
                                        className="w-full p-2 border rounded"
                                    >
                                        <option value="Active">Active (Confirmed)</option>
                                        <option value="Rescheduled">Rescheduled</option>
                                        <option value="Canceled">Canceled</option>
                                    </select>
                                </div>
                            </div>

                            {/* Right: Finance */}
                            <div className="space-y-6">
                                <h3 className="font-semibold text-gray-500 text-sm uppercase mb-2 flex items-center gap-2">
                                    <Euro size={16} /> Financials
                                </h3>

                                {/* Total Price Editor */}
                                <div className="flex gap-4 items-end">
                                    <div className="flex-1">
                                        <label className="text-sm">Total Package Price</label>
                                        <input
                                            type="number"
                                            className="w-full border rounded p-2"
                                            defaultValue={selectedBooking.finance.total_price}
                                            onBlur={(e) => {
                                                const val = Number(e.target.value);
                                                if (val !== selectedBooking.finance.total_price) {
                                                    handleUpdateFinance(selectedBooking.id, {
                                                        ...selectedBooking.finance,
                                                        total_price: val
                                                    });
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1 text-right">
                                        <div className="text-sm text-gray-500">Status</div>
                                        <div className={`font-bold text-xl ${calculateFinance(selectedBooking).isPaidOff ? 'text-green-600' : 'text-red-600'}`}>
                                            {calculateFinance(selectedBooking).isPaidOff ? 'LUNAS' : 'BELUM LUNAS'}
                                        </div>
                                    </div>
                                </div>

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
                                                {p.proof_base64 && (
                                                    <img src={p.proof_base64} alt="Proof" className="h-20 object-contain self-start border rounded" />
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
                                        const form = e.target as any;
                                        const amount = Number(form.amount.value);
                                        const note = form.note.value;
                                        if (!amount) return;

                                        const newPayment: Payment = {
                                            date: new Date().toISOString().split('T')[0],
                                            amount,
                                            note,
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
        </div>
    );
}
