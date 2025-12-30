import { useState, useEffect, useMemo } from 'react';
import { Booking, FinanceData } from '@/lib/storage';
import { BookingUpdate, FilterStatus, DateRange } from '../types/admin';

export const useBookings = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('Active');
    // Default date range: First day of current month to last day of NEXT month (to include future bookings)
    const [dateRange, setDateRange] = useState<DateRange>({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0] ?? '',
        end: new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0).toISOString().split('T')[0] ?? '' // Changed +1 to +2 to include next month
    });

    // Reschedule state
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [rescheduleBookingId, setRescheduleBookingId] = useState<string | null>(null);
    const [rescheduleFormData, setRescheduleFormData] = useState({
        newDate: '',
        newTime: '',
        reason: ''
    });

    // Booking Creation state
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
    const [availableBookingAddons, setAvailableBookingAddons] = useState<any[]>([]);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/bookings');
            if (res.ok) {
                const data = await res.json();
                setBookings(data);
            }
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
            }
        } catch {
            alert("Failed to update");
        }
    };

    const handleUpdateFinance = (bookingId: string, newFinance: FinanceData) => handleUpdate(bookingId, { finance: newFinance });
    const handleUpdateStatus = (bookingId: string, status: Booking['status']) => handleUpdate(bookingId, { status });

    const handleDeleteBooking = async (bookingId: string) => {
        if (!confirm("Are you sure you want to delete this booking? This action cannot be undone.")) return;

        try {
            const res = await fetch(`/api/bookings?id=${bookingId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setBookings(prev => prev.filter(b => b.id !== bookingId));
                if (selectedBooking?.id === bookingId) {
                    setSelectedBooking(null);
                }
                alert("Booking deleted successfully");
            } else {
                const error = await res.json();
                throw new Error(error.error || "Failed to delete");
            }
        } catch (error) {
            console.error("Delete booking error:", error);
            alert(`Failed to delete booking: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const calculateFinance = (b: Booking) => {
        const total = b.finance.total_price;
        const paid = b.finance.payments.reduce((sum, p) => sum + p.amount, 0);
        const balance = total - paid;
        return { total, paid, balance, isPaidOff: balance <= 0 && total > 0 };
    };

    const getOrReconstructBreakdown = (booking: Booking) => {
        // If breakdown already exists, return it
        if (booking.finance.service_base_price !== undefined) {
            return {
                service_base_price: booking.finance.service_base_price,
                base_discount: booking.finance.base_discount || 0,
                addons_total: booking.finance.addons_total || 0,
                coupon_discount: booking.finance.coupon_discount || 0,
                coupon_code: booking.finance.coupon_code,
                isReconstructed: false
            };
        }

        // For legacy bookings, reconstruct breakdown
        // Try to find service by serviceId first, then fallback to category match

        if (booking.customer.serviceId) {
            // This would need services passed in, but we'll handle it in the component
            return {
                service_base_price: 0,
                base_discount: 0,
                addons_total: booking.addons?.reduce((sum, addon) => sum + (addon.price_at_booking * addon.quantity), 0) || 0,
                coupon_discount: 0,
                coupon_code: undefined,
                isReconstructed: true
            };
        }

        return {
            service_base_price: 0,
            base_discount: 0,
            addons_total: booking.addons?.reduce((sum, addon) => sum + (addon.price_at_booking * addon.quantity), 0) || 0,
            coupon_discount: 0,
            coupon_code: undefined,
            isReconstructed: true
        };
    };

    // Filter bookings by SESSION date range (for revenue realization metrics)
    const bookingsByDateRange = useMemo(() => {
        return bookings.filter(b => {
            const sessionDate = new Date(b.booking.date).toISOString().split('T')[0];
            return sessionDate >= dateRange.start && sessionDate <= dateRange.end;
        });
    }, [bookings, dateRange]);

    // Filter bookings by CREATED date range (for sales pipeline metrics)
    const bookingsByCreatedDate = useMemo(() => {
        return bookings.filter(b => {
            const createdDate = new Date(b.created_at).toISOString().split('T')[0];
            return createdDate >= dateRange.start && createdDate <= dateRange.end;
        });
    }, [bookings, dateRange]);

    // Filter bookings by both status and date range (for table view)
    const filteredBookings = useMemo(() => {
        return bookings.filter(b => {
            // Filter by status
            let statusMatch = false;
            if (filterStatus === 'Active') {
                statusMatch = b.status === 'Active' || b.status === 'Rescheduled';
            } else if (filterStatus === 'Canceled') {
                statusMatch = b.status === 'Cancelled';
            } else if (filterStatus === 'Completed') {
                statusMatch = b.status === 'Completed';
            } else {
                statusMatch = true; // 'All' status
            }

            // Filter by date range
            const bookingDate = new Date(b.booking.date).toISOString().split('T')[0];
            const dateMatch = bookingDate >= dateRange.start && bookingDate <= dateRange.end;

            return statusMatch && dateMatch;
        });
    }, [bookings, filterStatus, dateRange]);

    const events = bookings
        .filter(b => {
            const isActive = b.status === 'Active' || b.status === 'Rescheduled';
            const bookingDate = new Date(b.booking.date).toISOString().split('T')[0];
            const inDateRange = bookingDate >= dateRange.start && bookingDate <= dateRange.end;
            return isActive && inDateRange;
        })
        .map(b => ({
            id: b.id,
            title: `${b.customer.name} (${b.customer.category})`,
            start: b.booking.date,
            backgroundColor: b.customer.category.includes('Outdoor') ? '#10B981' : '#3B82F6',
            extendedProps: { booking: b }
        }));

    return {
        bookings,
        setBookings,
        selectedBooking,
        setSelectedBooking,
        filterStatus,
        setFilterStatus,
        dateRange,
        setDateRange,
        filteredBookings,
        bookingsByDateRange,
        bookingsByCreatedDate,
        events,
        calculateFinance,
        getOrReconstructBreakdown,
        handleUpdate,
        handleUpdateFinance,
        handleUpdateStatus,
        handleDeleteBooking,
        fetchData,
        // Reschedule state
        isRescheduleModalOpen,
        setIsRescheduleModalOpen,
        rescheduleBookingId,
        setRescheduleBookingId,
        rescheduleFormData,
        setRescheduleFormData,
        // Booking creation state
        isCreateBookingModalOpen,
        setIsCreateBookingModalOpen,
        bookingFormData,
        setBookingFormData,
        selectedBookingAddons,
        setSelectedBookingAddons,
        availableBookingAddons,
        setAvailableBookingAddons
    };
};
