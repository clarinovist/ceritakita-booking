import { NextRequest, NextResponse } from 'next/server';
import {
    readData as readDataSQLite
} from '@/lib/storage-sqlite';
import { requireAuth } from '@/lib/auth';
import { createBookingSchema } from '@/lib/validation';
import { rateLimiters } from '@/lib/rate-limit';
import { logger, createErrorResponse, createValidationError } from '@/lib/logger';
import { getCsrfToken } from 'next-auth/react';
import formidable from 'formidable';
import { IncomingMessage } from 'http';
import { Readable } from 'stream';
import { bookingService } from '@/lib/services/booking-service';

/**
 * Helper: Parse multipart form data
 */
async function parseMultipartForm(req: NextRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
    // Convert NextRequest to Node.js IncomingMessage
    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const readable = Readable.from(buffer);
    const fakeReq = Object.assign(readable, {
        headers: Object.fromEntries(req.headers.entries()),
        method: req.method,
        url: req.url,
    }) as unknown as IncomingMessage;

    const form = formidable({
        maxFileSize: 5 * 1024 * 1024, // 5MB
        keepExtensions: true,
        allowEmptyFiles: false,
    });

    return new Promise((resolve, reject) => {
        form.parse(fakeReq, (err, fields, files) => {
            if (err) reject(err);
            else resolve({ fields, files });
        });
    });
}

export async function GET(req: NextRequest) {
    try {
        // Rate limiting
        const rateLimitResult = rateLimiters.moderate(req);
        if (rateLimitResult) {
            logger.warn('Rate limit exceeded for GET bookings', {
                ip: req.headers.get('x-forwarded-for')
            });
            return rateLimitResult;
        }

        // Require authentication for viewing bookings
        const authCheck = await requireAuth(req);
        if (authCheck) return authCheck;

        // Check if specific booking ID is requested
        const { searchParams } = new URL(req.url);
        const bookingId = searchParams.get('id');

        if (bookingId) {
            // Get single booking
            const { readBooking } = await import('@/lib/storage-sqlite');
            const booking = readBooking(bookingId);

            if (!booking) {
                logger.warn('Booking not found', { bookingId });
                return NextResponse.json(
                    { error: 'Booking not found', code: 'NOT_FOUND' },
                    { status: 404 }
                );
            }

            logger.info('Booking retrieved successfully', { bookingId });
            return NextResponse.json(booking);
        }

        // Parse pagination and filter params
        const pageParam = searchParams.get('page');
        const limitParam = searchParams.get('limit');
        const startDate = searchParams.get('startDate') || undefined;
        const endDate = searchParams.get('endDate') || undefined;
        const status = searchParams.get('status') || undefined;

        let page: number | undefined;
        let limit: number | undefined;

        if (pageParam) {
            const parsedPage = parseInt(pageParam);
            if (!isNaN(parsedPage) && parsedPage > 0) {
                page = parsedPage;
            }
        }

        if (limitParam) {
            const parsedLimit = parseInt(limitParam);
            if (!isNaN(parsedLimit) && parsedLimit > 0) {
                limit = parsedLimit;
            }
        }

        // Get bookings with pagination and filtering
        const data = readDataSQLite(startDate, endDate, status, page, limit);

        logger.info('Bookings retrieved successfully', {
            count: data.length,
            page,
            limit
        });

        return NextResponse.json(data);
    } catch (error) {
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}

export async function POST(req: NextRequest) {
    const requestId = crypto.randomUUID();

    try {
        // Rate limiting
        const rateLimitResult = rateLimiters.moderate(req);
        if (rateLimitResult) {
            logger.warn('Rate limit exceeded for POST bookings', {
                ip: req.headers.get('x-forwarded-for'),
                requestId
            });
            return rateLimitResult;
        }

        // CSRF protection (if user is authenticated)
        const authCheck = await requireAuth(req);
        // requireAuth returns null if authenticated, otherwise returns a 401 response
        if (!authCheck) {
            // User is authenticated. Validate CSRF.
            // Check that the X-CSRF-Token header matches the token derived from the session cookie
            const headerToken = req.headers.get('x-csrf-token');
            const cookieToken = await getCsrfToken({
                req: {
                    headers: {
                        cookie: req.headers.get('cookie') ?? '',
                    },
                },
            });

            if (headerToken !== cookieToken) {
                logger.warn('CSRF validation failed', {
                    requestId,
                    user: 'authenticated',
                    headerToken: headerToken ? 'present' : 'missing',
                });
                return NextResponse.json(
                    { error: 'Invalid CSRF token', code: 'CSRF_INVALID' },
                    { status: 403 }
                );
            }
        }

        const contentType = req.headers.get('content-type') || '';
        let bodyData: unknown;
        let uploadedFile: formidable.File | null = null;

        // Parse request based on content type
        if (contentType.includes('multipart/form-data')) {
            // Parse multipart form data
            const { fields, files } = await parseMultipartForm(req);

            // Extract JSON data from 'data' field
            const dataField = fields.data;
            const dataString = Array.isArray(dataField) ? dataField[0] : dataField;
            bodyData = JSON.parse(dataString || '{}');

            // Extract file from 'proof' field
            const proofField = files.proof;
            uploadedFile = Array.isArray(proofField) ? proofField[0] ?? null : proofField ?? null;
        } else {
            // Parse JSON (backward compatibility)
            bodyData = await req.json();
        }

        // Validate input using Zod
        const validationResult = createBookingSchema.safeParse(bodyData);
        if (!validationResult.success) {
            logger.warn('Validation failed for booking creation', {
                requestId,
                errors: validationResult.error.issues
            });
            const validationError = createValidationError(validationResult.error.issues, requestId);
            return NextResponse.json(validationError.error, { status: validationError.statusCode });
        }

        // Use BookingService to handle business logic
        const newBooking = await bookingService.createBooking(
            validationResult.data,
            uploadedFile ? {
                filepath: uploadedFile.filepath,
                originalFilename: uploadedFile.originalFilename ?? undefined,
                mimetype: uploadedFile.mimetype ?? undefined,
                size: uploadedFile.size
            } : null,
            requestId
        );

        return NextResponse.json(newBooking, { status: 201 });
    } catch (error) {
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error, requestId);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        // Rate limiting
        const rateLimitResult = rateLimiters.moderate(req);
        if (rateLimitResult) {
            logger.warn('Rate limit exceeded for DELETE bookings', {
                ip: req.headers.get('x-forwarded-for')
            });
            return rateLimitResult;
        }

        // Require authentication
        const authCheck = await requireAuth(req);
        if (authCheck) return authCheck;

        // Get booking ID from URL query parameter
        const { searchParams } = new URL(req.url);
        const bookingId = searchParams.get('id');

        if (!bookingId) {
            logger.warn('DELETE request missing booking ID');
            return NextResponse.json(
                { error: 'Booking ID is required', code: 'MISSING_ID' },
                { status: 400 }
            );
        }

        // Import deleteBooking function
        const { deleteBooking, readBooking } = await import('@/lib/storage-sqlite');

        // Check if booking exists
        const existingBooking = readBooking(bookingId);

        if (!existingBooking) {
            logger.warn('Attempted to delete non-existent booking', { bookingId });
            return NextResponse.json(
                { error: 'Booking not found', code: 'NOT_FOUND' },
                { status: 404 }
            );
        }

        // SECURITY: Prevent deletion of completed bookings (immutable)
        if (existingBooking.status === 'Completed') {
            logger.warn('Attempted to delete completed booking', {
                bookingId,
                customer: existingBooking.customer.name,
                status: existingBooking.status
            });
            return NextResponse.json(
                {
                    error: 'Cannot delete completed bookings',
                    code: 'BOOKING_IMMUTABLE',
                    message: 'Completed bookings are immutable and cannot be deleted. Please contact an administrator if you need to remove this booking.'
                },
                { status: 403 }
            );
        }

        // Delete the booking
        deleteBooking(bookingId);

        logger.info('Booking deleted successfully', {
            bookingId,
            customer: existingBooking.customer.name
        });

        return NextResponse.json({ success: true, bookingId });
    } catch (error) {
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}
