import { NextRequest, NextResponse } from 'next/server';
import { readBooking, updateBooking, type Booking } from '@/lib/storage-sqlite';
import { requireAuth } from '@/lib/auth';
import { updateBookingSchema } from '@/lib';
import { rateLimiters } from '@/lib/rate-limit';
import { logger, createErrorResponse, createValidationError } from '@/lib/logger';
import { safeString, safeNumber } from '@/lib/type-utils';
import { sendNewPaymentNotification } from '@/lib/telegram';

/**
 * Valid status transition matrix
 * Defines which status changes are allowed from each current status
 */
const VALID_TRANSITIONS: Record<Booking['status'], Booking['status'][]> = {
    'Active': ['Rescheduled', 'Cancelled', 'Completed'],
    'Rescheduled': ['Active', 'Cancelled', 'Completed'],
    'Cancelled': [], // Cannot transition from Cancelled (final state)
    'Completed': [] // Cannot transition from Completed (immutable final state)
};

/**
 * Calculate total paid amount from payments
 */
function calculateTotalPaid(booking: Booking): number {
    return booking.finance.payments.reduce((sum, payment) => sum + payment.amount, 0);
}

/**
 * Validate if status transition is allowed
 */
function isValidStatusTransition(currentStatus: Booking['status'], newStatus: Booking['status']): boolean {
    return VALID_TRANSITIONS[currentStatus].includes(newStatus);
}

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

        // SECURITY: Prevent modification of completed bookings (immutable)
        if (currentBooking.status === 'Completed') {
            logger.warn('Attempted to modify completed booking', {
                requestId,
                bookingId: id,
                currentStatus: currentBooking.status
            });
            return NextResponse.json(
                {
                    error: 'Cannot modify completed bookings',
                    code: 'BOOKING_IMMUTABLE',
                    message: 'Completed bookings are immutable and cannot be edited'
                },
                { status: 403 }
            );
        }

        // VALIDATION: Check status transition if status is being updated
        if (updates.status && updates.status !== currentBooking.status) {
            const newStatus = updates.status as Booking['status'];

            // Validate status transition
            if (!isValidStatusTransition(currentBooking.status, newStatus)) {
                logger.warn('Invalid status transition attempted', {
                    requestId,
                    bookingId: id,
                    currentStatus: currentBooking.status,
                    attemptedStatus: newStatus
                });
                return NextResponse.json(
                    {
                        error: `Invalid status transition: ${currentBooking.status} → ${newStatus}`,
                        code: 'INVALID_STATUS_TRANSITION',
                        validTransitions: VALID_TRANSITIONS[currentBooking.status]
                    },
                    { status: 400 }
                );
            }

            // PAYMENT VERIFICATION: Check if booking is paid off when marking as Completed
            if (newStatus === 'Completed') {
                const totalPaid = calculateTotalPaid(currentBooking);
                const balance = currentBooking.finance.total_price - totalPaid;

                if (balance > 0) {
                    logger.warn('Attempted to complete booking with outstanding balance', {
                        requestId,
                        bookingId: id,
                        balance,
                        totalPrice: currentBooking.finance.total_price,
                        totalPaid
                    });
                    return NextResponse.json(
                        {
                            error: 'Cannot mark as completed - outstanding balance exists',
                            code: 'OUTSTANDING_BALANCE',
                            balance: balance,
                            totalPrice: currentBooking.finance.total_price,
                            totalPaid: totalPaid
                        },
                        { status: 400 }
                    );
                }

                // Audit log for completion
                logger.audit('BOOKING_COMPLETED', `booking:${id}`, currentBooking.customer.name, {
                    requestId,
                    totalPrice: currentBooking.finance.total_price,
                    totalPaid,
                    bookingDate: currentBooking.booking.date
                });
            }
        }

        // PRICE CHANGE VALIDATION
        // Only allow finance changes on Active bookings
        if ((updates.finance || updates.addons) && currentBooking.status !== 'Active') {
            logger.warn('Attempted to modify price/addons on non-active booking', {
                requestId,
                bookingId: id,
                status: currentBooking.status
            });
            return NextResponse.json(
                {
                    error: 'Perubahan harga hanya diizinkan untuk booking dengan status Active',
                    code: 'INVALID_STATUS_FOR_PRICE_CHANGE'
                },
                { status: 400 }
            );
        }

        // Addon update handling
        let finalFinance = updates.finance || currentBooking.finance;
        let newPaymentNotificationAmount = 0;

        if (updates.finance && updates.finance.payments) {
            const oldPaid = calculateTotalPaid(currentBooking);
            const newPaid = updates.finance.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
            if (newPaid > oldPaid) {
                newPaymentNotificationAmount = newPaid - oldPaid;
            }
        }

        if (updates.addons !== undefined) {
            // Calculate new addons_total
            const newAddonsTotal = updates.addons.reduce((sum, addon) => {
                return sum + (safeNumber(addon.price_at_booking) * safeNumber(addon.quantity));
            }, 0);

            // Recalculate total_price
            const serviceBase = updates.finance?.service_base_price ?? currentBooking.finance.service_base_price ?? 0;
            const baseDiscount = updates.finance?.base_discount ?? currentBooking.finance.base_discount ?? 0;
            const couponDiscount = updates.finance?.coupon_discount ?? currentBooking.finance.coupon_discount ?? 0;

            // Handle legacy data (if no service base but has total)
            let basePrice = serviceBase;
            if (basePrice === 0 && currentBooking.finance.total_price > 0 && (!currentBooking.addons || currentBooking.addons.length === 0) && !updates.finance?.service_base_price) {
                basePrice = currentBooking.finance.total_price;
            }

            const newTotalPrice = Math.max(0, basePrice + newAddonsTotal - baseDiscount - couponDiscount);

            finalFinance = {
                ...finalFinance,
                addons_total: newAddonsTotal,
                total_price: newTotalPrice
            };

            logger.info('Recalculated price due to addon changes', {
                requestId,
                bookingId: id,
                oldTotal: currentBooking.finance.total_price,
                newTotal: newTotalPrice,
                newAddonsTotal
            });
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
                    notes: updates.booking.notes !== undefined ? safeString(updates.booking.notes) : currentBooking.booking.notes,
                    location_link: updates.booking.location_link !== undefined ? safeString(updates.booking.location_link) : currentBooking.booking.location_link,
                    drive_link: updates.booking.drive_link !== undefined ? safeString(updates.booking.drive_link) : currentBooking.booking.drive_link
                }
            }),
            finance: finalFinance,
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

        if (newPaymentNotificationAmount > 0) {
            sendNewPaymentNotification(updatedBooking, newPaymentNotificationAmount).catch(e => {
                logger.error('Failed to send Telegram payment notification', { bookingId: id }, e as Error);
            });
        }

        return NextResponse.json(updatedBooking);
    } catch (error) {
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error, requestId);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}
