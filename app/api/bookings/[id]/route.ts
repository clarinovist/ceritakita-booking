import { NextRequest, NextResponse } from 'next/server';
import { readBooking } from '@/lib';
import { requireAuth } from '@/lib/auth';
import { rateLimiters } from '@/lib/rate-limit';
import { logger, createErrorResponse } from '@/lib/logger';

/**
 * GET /api/bookings/[id]
 * Fetch a single booking by ID (RESTful endpoint)
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const requestId = crypto.randomUUID();

    try {
        // Rate limiting
        const rateLimitResult = rateLimiters.moderate(req);
        if (rateLimitResult) {
            logger.warn('Rate limit exceeded for GET single booking', {
                ip: req.headers.get('x-forwarded-for'),
                requestId,
                bookingId: params.id
            });
            return rateLimitResult;
        }

        // Require authentication for viewing bookings
        const authCheck = await requireAuth(req);
        if (authCheck) return authCheck;

        // Get single booking
        const booking = readBooking(params.id);

        if (!booking) {
            logger.warn('Booking not found', {
                requestId,
                bookingId: params.id
            });
            return NextResponse.json(
                { error: 'Booking not found', code: 'NOT_FOUND' },
                { status: 404 }
            );
        }

        logger.info('Booking retrieved successfully', {
            requestId,
            bookingId: params.id,
            customer: booking.customer.name
        });

        return NextResponse.json(booking);
    } catch (error) {
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error, requestId);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}
