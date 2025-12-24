import { NextRequest, NextResponse } from 'next/server';
import { readBooking, updateBooking, type Booking } from '@/lib/storage-sqlite';
import { requireAuth } from '@/lib/auth';
import { updateBookingSchema } from '@/lib/validation';
import { rateLimiters } from '@/lib/rate-limit';
import { logger, createErrorResponse, createValidationError } from '@/lib/logger';
import { safeString, safeNumber, safeProperty } from '@/lib/type-utils';

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

        const currentBooking = readBooking(id);

        if (!currentBooking) {
            logger.warn('Booking not found for update', { requestId, bookingId: id });
            return NextResponse.json(
                { error: 'Booking not found', code: 'BOOKING_NOT_FOUND' },
                { status: 404 }
            );
        }

        // Only update allowed fields (no arbitrary field injection)
        const updatedBooking: Booking = {
            ...currentBooking,
            ...(updates.status && { status: updates.status as Booking['status'] }),
            ...(updates.booking && {
                booking: {
                    ...currentBooking.booking,
                    ...updates.booking,
                    date: updates.booking.date ? safeString(updates.booking.date) : currentBooking.booking.date,
                    notes: updates.booking.notes ? safeString(updates.booking.notes) : currentBooking.booking.notes,
                    location_link: updates.booking.location_link ? safeString(updates.booking.location_link) : currentBooking.booking.location_link
                }
            }),
            ...(updates.finance && { finance: updates.finance }),
            ...(updates.customer && {
                customer: {
                    ...currentBooking.customer,
                    ...updates.customer,
                    name: updates.customer.name ? safeString(updates.customer.name) : currentBooking.customer.name,
                    whatsapp: updates.customer.whatsapp ? safeString(updates.customer.whatsapp) : currentBooking.customer.whatsapp,
                    category: updates.customer.category ? safeString(updates.customer.category) : currentBooking.customer.category
                }
            }),
            ...(updates.photographer_id !== undefined && { photographer_id: updates.photographer_id ? safeString(updates.photographer_id) : undefined }),
            ...(updates.addons !== undefined && { addons: updates.addons }),
        };

        // Save to SQLite database with async/await
        await updateBooking(updatedBooking);

        logger.audit('UPDATE_BOOKING', `booking:${id}`, currentBooking.customer.name, {
            requestId,
            updates: Object.keys(updates)
        });

        return NextResponse.json(updatedBooking);
    } catch (error) {
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error, requestId);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}
