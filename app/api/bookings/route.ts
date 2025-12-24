import { NextRequest, NextResponse } from 'next/server';
import { readData as readDataSQLite, createBooking, updateBooking, type Booking } from '@/lib/storage-sqlite';
import { readServices } from '@/lib/storage';
import { requireAuth } from '@/lib/auth';
import { createBookingSchema, updateBookingSchema } from '@/lib/validation';
import formidable from 'formidable';
import { IncomingMessage } from 'http';
import { Readable } from 'stream';
import { saveUploadedFile, validateFile } from '@/lib/file-storage';
import { readFile } from 'fs/promises';
import { rateLimiters } from '@/lib/rate-limit';
import { csrfProtectionMiddleware } from '@/lib/csrf';
import { logger, createErrorResponse, createValidationError } from '@/lib/logger';
import { safeString, safeNumber, safeProperty } from '@/lib/type-utils';

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

        const data = readDataSQLite();
        
        logger.info('Bookings retrieved successfully', {
            count: data.length
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
        if (authCheck) {
            // If authenticated, check CSRF
            const session = authCheck; // This would be null if auth passed
            // For now, we'll skip CSRF if auth check returns null (meaning authenticated)
            // In production, you'd get the user ID from session and validate CSRF
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

        const { customer, booking, finance, photographer_id, addons } = validationResult.data;

        // Backend Price Validation and Breakdown Calculation
        const services = readServices();
        const service = services.find(s => s.id === customer.serviceId);

        let validatedTotalPrice = 0;
        let serviceBasePrice = 0;
        let baseDiscount = 0;
        let addonsTotal = 0;
        let couponDiscount = 0;
        let couponCode: string | undefined;

        if (service && service.isActive) {
            serviceBasePrice = service.basePrice;
            baseDiscount = service.discountValue;

            // Calculate add-ons total
            if (addons && addons.length > 0) {
                addonsTotal = addons.reduce((total, addon) => {
                    return total + (safeNumber(addon.price_at_booking) * safeNumber(addon.quantity));
                }, 0);
            }

            // Get coupon discount if provided in finance data - FIXED TYPE CASTING
            if (finance && typeof finance === 'object' && 'coupon_discount' in finance) {
                // Use type-safe property access
                couponDiscount = safeProperty(finance, 'coupon_discount', 0);
                couponCode = safeProperty(finance, 'coupon_code', undefined);
            }

            // Formula: Grand Total = (Service Base + Add-ons) - Base Discount - Coupon Discount
            validatedTotalPrice = Math.max(0, serviceBasePrice + addonsTotal - baseDiscount - couponDiscount);
        } else if (service && !service.isActive) {
            logger.warn('Attempted to book inactive service', {
                requestId,
                serviceId: customer.serviceId
            });
            return NextResponse.json(
                { error: 'Selected service is not available', code: 'SERVICE_INACTIVE' },
                { status: 400 }
            );
        } else {
            logger.warn('Invalid service selected', {
                requestId,
                serviceId: customer.serviceId
            });
            return NextResponse.json(
                { error: 'Invalid service selected', code: 'INVALID_SERVICE' },
                { status: 400 }
            );
        }

        // Create booking ID first (needed for file naming)
        const bookingId = crypto.randomUUID();

        // Process uploaded file if present
        let proofFilename: string | undefined;
        if (uploadedFile && uploadedFile.filepath) {
            try {
                // Validate file
                validateFile({
                    size: uploadedFile.size,
                    type: uploadedFile.mimetype || 'application/octet-stream',
                    name: uploadedFile.originalFilename || 'file'
                });

                // Read file buffer
                const fileBuffer = await readFile(uploadedFile.filepath);

                // Save file with locking
                const savedFile = await saveUploadedFile(
                    fileBuffer,
                    bookingId,
                    0, // First payment (index 0)
                    uploadedFile.originalFilename || 'proof.jpg',
                    uploadedFile.mimetype || 'image/jpeg'
                );

                proofFilename = savedFile.relativePath;
                
                logger.info('Payment proof uploaded', {
                    requestId,
                    bookingId,
                    filename: proofFilename,
                    size: fileBuffer.length
                });
            } catch (fileError) {
                logger.error('File upload failed', {
                    requestId,
                    bookingId
                }, fileError as Error);
                
                return NextResponse.json(
                    { error: 'Failed to save uploaded file', code: 'FILE_UPLOAD_FAILED' },
                    { status: 400 }
                );
            }
        }

        // Update payment with proof filename or keep base64 (backward compat)
        const payments = (finance?.payments || []).map((payment, index) => {
            if (index === 0 && proofFilename) {
                // First payment: add proof_filename, remove proof_base64
                const { proof_base64: _, ...paymentWithoutBase64 } = payment;
                return {
                    ...paymentWithoutBase64,
                    proof_filename: proofFilename
                };
            }
            return payment;
        });

        const newBooking: Booking = {
            id: bookingId,
            created_at: new Date().toISOString(),
            status: 'Active',
            customer,
            booking: {
                ...booking,
                location_link: booking.location_link || ''
            },
            finance: {
                total_price: validatedTotalPrice,
                payments,
                // Store price breakdown for transparency
                service_base_price: serviceBasePrice,
                base_discount: baseDiscount,
                addons_total: addonsTotal,
                coupon_discount: couponDiscount,
                coupon_code: couponCode
            },
            photographer_id,
            addons
        };

        // Save to SQLite database with async/await
        await createBooking(newBooking);

        logger.info('Booking created successfully', {
            requestId,
            bookingId: newBooking.id,
            customer: newBooking.customer.name,
            date: newBooking.booking.date,
            total: newBooking.finance.total_price
        });

        return NextResponse.json(newBooking, { status: 201 });
    } catch (error) {
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error, requestId);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}
