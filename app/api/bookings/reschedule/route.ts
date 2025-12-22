import { NextRequest, NextResponse } from 'next/server';
import { readBooking, updateBooking, addRescheduleHistory, checkSlotAvailability } from '@/lib/storage-sqlite';
import { requireAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
    // Require authentication for rescheduling bookings
    const authCheck = await requireAuth(req);
    if (authCheck) return authCheck;

    try {
        const body = await req.json();
        const { bookingId, newDate, reason } = body;

        if (!bookingId || !newDate) {
            return NextResponse.json(
                { error: 'Booking ID and new date are required' },
                { status: 400 }
            );
        }

        // Fetch the current booking
        const currentBooking = readBooking(bookingId);

        if (!currentBooking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Check if the new slot is available (excluding this booking)
        const isAvailable = checkSlotAvailability(newDate, bookingId);

        if (!isAvailable) {
            return NextResponse.json(
                {
                    error: 'Time slot not available',
                    message: 'The selected date and time is already booked. Please choose another slot.'
                },
                { status: 409 }
            );
        }

        // Store the old date
        const oldDate = currentBooking.booking.date;

        // Log the reschedule in history
        addRescheduleHistory(bookingId, oldDate, newDate, reason);

        // Update the booking with the new date and set status to Rescheduled
        const updatedBooking = {
            ...currentBooking,
            status: 'Rescheduled' as const,
            booking: {
                ...currentBooking.booking,
                date: newDate
            }
        };

        updateBooking(updatedBooking);

        // Fetch the updated booking with reschedule history
        const finalBooking = readBooking(bookingId);

        return NextResponse.json({
            success: true,
            booking: finalBooking,
            message: 'Booking rescheduled successfully'
        });
    } catch (error) {
        console.error('Error rescheduling booking:', error);
        return NextResponse.json(
            { error: 'Failed to reschedule booking' },
            { status: 500 }
        );
    }
}
