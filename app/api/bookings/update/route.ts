import { NextRequest, NextResponse } from 'next/server';
import { bookingService } from '@/lib/services/booking-service';
import { requireAuth } from '@/lib/auth';
import { updateBookingSchema } from '@/lib';
import { rateLimiters } from '@/lib/rate-limit';
import { logger, createErrorResponse, createValidationError } from '@/lib/logger';

export async function PUT(req: NextRequest) {
    const requestId = crypto.randomUUID();

    try {
        // Rate limiting
        const rateLimitResult = rateLimiters.moderate(req);
        if (rateLimitResult) {
            logger.warn('Rate limit exceeded for booking update', {
                ip: req.headers.get('x-forwarded-for'),
                requestId
            });
            return rateLimitResult;
        }

        // Require authentication for updating bookings
        const authCheck = await requireAuth(req);
        if (authCheck) return authCheck;

        const body = await req.json();

        // Validate input using Zod
        const validationResult = updateBookingSchema.safeParse(body);
        if (!validationResult.success) {
            logger.warn('Validation failed for booking update', {
                requestId,
                errors: validationResult.error.issues
            });
            const validationError = createValidationError(validationResult.error.issues, requestId);
            return NextResponse.json(validationError.error, { status: validationError.statusCode });
        }

        const { id, ...updates } = validationResult.data;

        const updatedBooking = await bookingService.updateBooking(id, updates, requestId);

        return NextResponse.json(updatedBooking);
    } catch (error) {
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error, requestId);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}
