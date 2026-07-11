import { readFile } from 'fs/promises';
import { z } from 'zod';
import {
    createBooking,
    readBooking,
    updateBooking,
    addRescheduleHistory,
    checkSlotAvailability
} from '@/lib/repositories/bookings';
import { getSystemSettings } from '@/lib/repositories/settings';
import { readServices } from '@/lib/repositories/services';
import { saveUploadedFile, validateFile } from '@/lib/file-storage';
import { calculateDetailedPricing } from '@/lib/pricing';
import {
    recordCouponUsage,
    incrementCouponUsage,
    getCouponByCode
} from '@/lib/repositories/coupons';
import { generateWhatsAppMessage, generateWhatsAppLink } from '@/lib/whatsapp-template';
import { sendNewBookingNotification, sendNewPaymentNotification } from '@/lib/telegram';
import { sendEmail } from '@/lib/email';
import { buildCustomerBookingEmail } from '@/lib/email-templates';
import { logger, AppError } from '@/lib/logger';
import { safeNumber, safeProperty, safeString } from '@/lib/type-utils';
import { Booking } from '@/lib/types';
import { createBookingSchema, updateBookingSchema } from '@/lib/validation';

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type UpdateBookingUpdates = Omit<UpdateBookingInput, 'id'>;

export class BookingService {
    /**
     * Create a new booking
     */
    async createBooking(
        data: CreateBookingInput,
        uploadedFile?: { filepath: string; originalFilename?: string; mimetype?: string; size: number } | null,
        requestId: string = crypto.randomUUID()
    ) {
        const { customer, booking, finance, photographer_id, addons } = data;

        // 1. Backend Price Validation and Breakdown Calculation
        const services = await readServices();
        const service = services.find(s => s.id === customer.serviceId);

        let validatedTotalPrice = 0;
        let serviceBasePrice = 0;
        let baseDiscount = 0;
        let addonsTotal = 0;
        let couponDiscount = 0;
        let couponCode: string | undefined;

        if (service && service.isActive) {
            // Get coupon discount if provided in finance data
            if (finance && typeof finance === 'object' && 'coupon_discount' in finance) {
                // Use type-safe property access
                couponDiscount = safeProperty(finance, 'coupon_discount', 0);
                couponCode = safeProperty(finance, 'coupon_code', undefined);
            }

            const addonsList = (addons || []).map(a => ({
                price: safeNumber(a.price_at_booking),
                quantity: safeNumber(a.quantity)
            }));

            const breakdown = calculateDetailedPricing(
                service,
                addonsList,
                couponDiscount
            );

            serviceBasePrice = breakdown.serviceBasePrice;
            baseDiscount = breakdown.baseDiscount;
            addonsTotal = breakdown.addonsTotal;
            validatedTotalPrice = breakdown.total;
        } else if (service && !service.isActive) {
            logger.warn('Attempted to book inactive service', {
                requestId,
                serviceId: customer.serviceId
            });
            throw new AppError('Selected service is not available', 400, 'SERVICE_INACTIVE');
        } else {
            logger.warn('Invalid service selected', {
                requestId,
                serviceId: customer.serviceId
            });
            throw new AppError('Invalid service selected', 400, 'INVALID_SERVICE');
        }

        // 2. BOOKING RULES VALIDATION
        const settings = getSystemSettings();
        const minBookingNotice = settings.min_booking_notice || 1;
        const maxBookingAhead = settings.max_booking_ahead || 90;

        // Validate booking date against rules
        const bookingDate = new Date(booking.date);
        const today = new Date();

        // Reset time to midnight for accurate date comparison
        bookingDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        const daysDiff = Math.ceil((bookingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Check minimum booking notice
        if (daysDiff < minBookingNotice) {
            logger.warn('Booking violates minimum notice requirement', {
                requestId,
                bookingDate: booking.date,
                daysDiff,
                minBookingNotice
            });
            throw new AppError(
                `Booking must be made at least ${minBookingNotice} day(s) in advance`,
                400,
                'MIN_BOOKING_NOTICE_VIOLATED',
                { minBookingNotice, daysDiff }
            );
        }

        // Check maximum booking ahead
        if (daysDiff > maxBookingAhead) {
            logger.warn('Booking exceeds maximum advance booking', {
                requestId,
                bookingDate: booking.date,
                daysDiff,
                maxBookingAhead
            });
            throw new AppError(
                `Cannot book more than ${maxBookingAhead} days in advance`,
                400,
                'MAX_BOOKING_AHEAD_VIOLATED',
                { maxBookingAhead, daysDiff }
            );
        }

        // Check slot availability
        if (!checkSlotAvailability(booking.date)) {
            logger.warn('Slot not available for booking', {
                requestId,
                bookingDate: booking.date
            });
            throw new AppError('This time slot is already booked', 400, 'SLOT_UNAVAILABLE');
        }

        // 3. Create booking ID
        const bookingId = crypto.randomUUID();

        // 4. Process uploaded file if present
        let proofFilename: string | undefined;
        let proofUrl: string | undefined;
        let storageBackend: 'local' | 'b2' = 'local';

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

                // Save file with locking (will use B2 if configured)
                const savedFile = await saveUploadedFile(
                    fileBuffer,
                    bookingId,
                    0, // First payment (index 0)
                    uploadedFile.originalFilename || 'proof.jpg',
                    uploadedFile.mimetype || 'image/jpeg'
                );

                proofFilename = savedFile.relativePath;
                proofUrl = savedFile.url;
                storageBackend = savedFile.storage;

                logger.info('Payment proof uploaded', {
                    requestId,
                    bookingId,
                    filename: proofFilename,
                    size: fileBuffer.length,
                    storage: storageBackend,
                    url: proofUrl
                });
            } catch (fileError) {
                logger.error('File upload failed', {
                    requestId,
                    bookingId
                }, fileError as Error);

                throw new AppError('Failed to save uploaded file', 400, 'FILE_UPLOAD_FAILED');
            }
        }

        // 5. Update payment with proof filename
        const payments = (finance?.payments || []).map((payment, index) => {
            if (index === 0 && proofFilename) {
                // First payment: add proof data
                const { proof_base64: _, ...paymentWithoutBase64 } = payment;
                return {
                    ...paymentWithoutBase64,
                    proof_filename: proofFilename,
                    proof_url: proofUrl,
                    storage_backend: storageBackend
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

        // 6. Save to database
        await createBooking(newBooking);

        // 7. Record coupon usage
        if (couponCode && couponDiscount > 0) {
            try {
                const coupon = getCouponByCode(couponCode);
                if (coupon) {
                    incrementCouponUsage(couponCode);
                    recordCouponUsage(
                        coupon.id,
                        bookingId,
                        customer.name,
                        customer.whatsapp,
                        couponDiscount,
                        validatedTotalPrice + couponDiscount
                    );
                }
            } catch (couponError) {
                // Log but don't fail the booking
                logger.error('Failed to record coupon usage', {
                    requestId,
                    bookingId,
                    couponCode
                }, couponError as Error);
            }
        }

        logger.info('Booking created successfully', {
            requestId,
            bookingId: newBooking.id,
            customer: newBooking.customer.name,
            total: newBooking.finance.total_price
        });

        // 8. Send Telegram Notification
        sendNewBookingNotification(newBooking).catch(e => {
            logger.error('Failed to send Telegram notification', { bookingId: newBooking.id }, e as Error);
        });

        // 9. Send Customer Email Confirmation
        if (newBooking.customer.email && settings.customer_email_enabled) {
            const customerEmail = newBooking.customer.email;
            
            // Format subject
            const serviceName = newBooking.customer.category;
            const subject = `Konfirmasi Pesanan Ceritakita - ${serviceName}`;
            
            // Build HTML
            const html = buildCustomerBookingEmail(newBooking);
            
            // Sender Configuration
            const senderName = settings.customer_email_sender_name || 'Ceritakita Studio';
            const fromEnv = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
            
            // If fromEnv already has a name like "Name <email>", extract just the email
            let finalFrom = `${senderName} <${fromEnv}>`;
            if (fromEnv.includes('<')) {
                const emailMatch = fromEnv.match(/<(.+)>/);
                if (emailMatch) {
                    finalFrom = `${senderName} <${emailMatch[1]}>`;
                } else {
                    finalFrom = fromEnv; // fallback if regex fails
                }
            }

            sendEmail({
                to: customerEmail,
                subject,
                html,
                from: finalFrom
            }).catch(e => {
                logger.error('Failed to send customer confirmation email', { 
                    bookingId: newBooking.id, 
                    email: customerEmail 
                }, e as Error);
            });
        }

        // 10. Generate WhatsApp response
        let whatsappResponse = {};
        try {
            if (settings.whatsapp_admin_number && settings.whatsapp_message_template) {
                const whatsappMessage = generateWhatsAppMessage(
                    settings.whatsapp_message_template,
                    {
                        customer_name: newBooking.customer.name,
                        service: newBooking.customer.category,
                        date: newBooking.booking.date?.split('T')[0] || '',
                        time: newBooking.booking.date?.split('T')[1] || '',
                        total_price: newBooking.finance.total_price,
                        booking_id: newBooking.id
                    }
                );

                const whatsappLink = generateWhatsAppLink(
                    settings.whatsapp_admin_number,
                    whatsappMessage
                );

                whatsappResponse = {
                    whatsapp_link: whatsappLink,
                    whatsapp_message: whatsappMessage
                };
            }
        } catch (whatsappError) {
            logger.error('WhatsApp generation failed', {
                requestId,
                bookingId: newBooking.id
            }, whatsappError as Error);
        }

        return {
            ...newBooking,
            ...whatsappResponse
        };
    }

    /**
     * Update an existing booking
     */
    async updateBooking(
        id: string,
        updates: UpdateBookingUpdates,
        requestId: string = crypto.randomUUID()
    ): Promise<Booking> {
        const currentBooking = readBooking(id);

        if (!currentBooking) {
            logger.warn('Booking not found for update', { requestId, bookingId: id });
            throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
        }

        // SECURITY: Prevent modification of completed bookings (immutable)
        if (currentBooking.status === 'Completed') {
            logger.warn('Attempted to modify completed booking', {
                requestId,
                bookingId: id,
                currentStatus: currentBooking.status
            });
            throw new AppError('Completed bookings are immutable and cannot be edited', 403, 'BOOKING_IMMUTABLE');
        }

        // VALIDATION: Check status transition if status is being updated
        if (updates.status && updates.status !== currentBooking.status) {
            const newStatus = updates.status as Booking['status'];
            const VALID_TRANSITIONS: Record<Booking['status'], Booking['status'][]> = {
                'Active': ['Rescheduled', 'Cancelled', 'Completed'],
                'Rescheduled': ['Active', 'Cancelled', 'Completed'],
                'Cancelled': [],
                'Completed': []
            };

            // Validate status transition
            if (!VALID_TRANSITIONS[currentBooking.status].includes(newStatus)) {
                logger.warn('Invalid status transition attempted', {
                    requestId,
                    bookingId: id,
                    currentStatus: currentBooking.status,
                    attemptedStatus: newStatus
                });
                throw new AppError(
                    `Invalid status transition: ${currentBooking.status} → ${newStatus}`,
                    400,
                    'INVALID_STATUS_TRANSITION',
                    { validTransitions: VALID_TRANSITIONS[currentBooking.status] }
                );
            }

            // PAYMENT VERIFICATION: Check if booking is paid off when marking as Completed
            if (newStatus === 'Completed') {
                const totalPaid = currentBooking.finance.payments.reduce((sum, payment) => sum + payment.amount, 0);
                const balance = currentBooking.finance.total_price - totalPaid;

                if (balance > 0) {
                    logger.warn('Attempted to complete booking with outstanding balance', {
                        requestId,
                        bookingId: id,
                        balance,
                        totalPrice: currentBooking.finance.total_price,
                        totalPaid
                    });
                    throw new AppError(
                        'Cannot mark as completed - outstanding balance exists',
                        400,
                        'OUTSTANDING_BALANCE',
                        {
                            balance,
                            totalPrice: currentBooking.finance.total_price,
                            totalPaid
                        }
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
            throw new AppError('Perubahan harga hanya diizinkan untuk booking dengan status Active', 400, 'INVALID_STATUS_FOR_PRICE_CHANGE');
        }

        // Addon update handling
        let finalFinance = updates.finance || currentBooking.finance;
        let newPaymentNotificationAmount = 0;

        if (updates.finance && updates.finance.payments) {
            const oldPaid = currentBooking.finance.payments.reduce((sum, payment) => sum + payment.amount, 0);
            const newPaid = updates.finance.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
            if (newPaid > oldPaid) {
                newPaymentNotificationAmount = newPaid - oldPaid;
            }
        }

        if (updates.addons !== undefined) {
            // Calculate new addons_total
            const newAddonsTotal = updates.addons.reduce((sum: number, addon: any) => {
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

        // Save to SQLite database
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

        return updatedBooking;
    }

    /**
     * Reschedule a booking
     */
    async rescheduleBooking(
        bookingId: string,
        newDate: string,
        reason?: string,
        requestId: string = crypto.randomUUID()
    ): Promise<Booking> {
        // Fetch the current booking
        const currentBooking = readBooking(bookingId);

        if (!currentBooking) {
            logger.warn('Booking not found for reschedule', { requestId, bookingId });
            throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
        }

        // Check if the new slot is available (excluding this booking)
        const isAvailable = checkSlotAvailability(safeString(newDate), bookingId);

        if (!isAvailable) {
            logger.warn('Time slot not available for reschedule', {
                requestId,
                bookingId,
                newDate
            });
            throw new AppError('Time slot not available', 409, 'SLOT_UNAVAILABLE');
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

        if (!finalBooking) {
            throw new AppError('Failed to retrieve rescheduled booking', 500, 'FETCH_FAILED');
        }

        return finalBooking;
    }

    /**
     * Quick price adjustment
     */
    async adjustPrice(
        data: {
            bookingId: string;
            addonId: string;
            quantity: number;
            price?: number;
            reason?: string;
        },
        requestId: string = crypto.randomUUID()
    ) {
        const { bookingId, addonId, quantity, price, reason } = data;

        // Get current booking
        const currentBooking = readBooking(bookingId);
        if (!currentBooking) {
            throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
        }

        // Validate status
        if (currentBooking.status !== 'Active') {
            throw new AppError('Can only adjust price for Active bookings', 400, 'INVALID_STATUS');
        }

        // Calculate adjustment
        const { addPriceAdjustment } = await import('@/lib/price-adjustments');
        const { newAddons, newTotalPrice } = await addPriceAdjustment(currentBooking, {
            bookingId,
            addonId,
            quantity,
            customPrice: price,
            reason
        });

        // Update booking
        await updateBooking({
            ...currentBooking,
            addons: newAddons,
            finance: {
                ...currentBooking.finance,
                addons_total: newAddons.reduce((sum, a) => sum + (a.price_at_booking * a.quantity), 0),
                total_price: newTotalPrice
            }
        });

        logger.info('Price adjustment applied', {
            bookingId,
            oldTotal: currentBooking.finance.total_price,
            newTotal: newTotalPrice,
            addonId,
            reason,
            requestId
        });

        return {
            success: true,
            bookingId,
            oldTotal: currentBooking.finance.total_price,
            newTotal: newTotalPrice,
            adjustment: newTotalPrice - currentBooking.finance.total_price
        };
    }
}

export const bookingService = new BookingService();
