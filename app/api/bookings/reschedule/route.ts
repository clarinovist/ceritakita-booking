import { NextRequest, NextResponse } from 'next/server';
import { bookingService } from '@/lib/services/booking-service';
import { requireAuth } from '@/lib/auth';
import { rateLimiters } from '@/lib/rate-limit';
import { logger, createErrorResponse } from '@/lib/logger';

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
        let body;
        try {
            body = await req.json();
        } catch (jsonError) {
            logger.warn('Invalid JSON body for reschedule', {
                requestId,
                error: (jsonError as Error).message
            });
            return NextResponse.json(
                { error: 'Invalid JSON body', code: 'INVALID_JSON' },
                { status: 400 }
            );
        }
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

        const finalBooking = await bookingService.rescheduleBooking(bookingId, newDate, reason, requestId);

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
