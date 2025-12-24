import { NextRequest, NextResponse } from 'next/server';
import { readBooking, updateBooking, addRescheduleHistory, checkSlotAvailability, type Booking } from '@/lib/storage-sqlite';
import { requireAuth } from '@/lib/auth';
import { rateLimiters } from '@/lib/rate-limit';
import { logger, createErrorResponse } from '@/lib/logger';
import { safeString } from '@/lib/type-utils';

export async function POST(req: NextRequest) {
    const requestId = crypto.randomUUID();
    
    try {
        // Rate limiting
        const rateLimitResult = rateLimiters.moderate(req);
        if (rateLimitResult) {
            logger.warn('Rate limit exceeded for booking reschedule', {
                ip: req.headers.get('x-forwarded-for'),
                requestId
            });
            return rateLimitResult;
        }

        // Require authentication for rescheduling bookings
        const authCheck = await requireAuth(req);
        if (authCheck) return authCheck;

        const body = await req.json();
        const { bookingId, newDate, reason } = body;

        if (!bookingId || !newDate) {
            logger.warn('Missing required fields for reschedule', {
                requestId,
                bookingId,
                newDate
            });
            return NextResponse.json(
                { error: 'Booking ID and new date are required', code: 'MISSING_FIELDS' },
                { status: 400 }
            );
        }

        // Fetch the current booking
        const currentBooking = readBooking(bookingId);

        if (!currentBooking) {
            logger.warn('Booking not found for reschedule', { requestId, bookingId });
            return NextResponse.json(
                { error: 'Booking not found', code: 'BOOKING_NOT_FOUND' },
                { status: 404 }
            );
        }

        // Check if the new slot is available (excluding this booking)
        const isAvailable = checkSlotAvailability(safeString(newDate), bookingId);

        if (!isAvailable) {
            logger.warn('Time slot not available for reschedule', {
                requestId,
                bookingId,
                newDate
            });
            return NextResponse.json(
                {
                    error: 'Time slot not available',
                    code: 'SLOT_UNAVAILABLE',
                    message: 'The selected date and time is already booked. Please choose another slot.'
                },
                { status: 409 }
            );
        }

        // Store the old date
        const oldDate = currentBooking.booking.date;

        // Log the reschedule in history
        addRescheduleHistory(bookingId, oldDate, safeString(newDate), reason);

        // Update the booking with the new date and set status to Rescheduled
        const updatedBooking: Booking = {
            ...currentBooking,
            status: 'Rescheduled',
            booking: {
                ...currentBooking.booking,
                date: safeString(newDate)
            }
        };

        await updateBooking(updatedBooking);

        // Fetch the updated booking with reschedule history
        const finalBooking = readBooking(bookingId);

        logger.audit('RESCHEDULE_BOOKING', `booking:${bookingId}`, currentBooking.customer.name, {
            requestId,
            oldDate,
            newDate: safeString(newDate),
            reason
        });

        return NextResponse.json({
            success: true,
            booking: finalBooking,
            message: 'Booking rescheduled successfully'
        });
    } catch (error) {
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error, requestId);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}
