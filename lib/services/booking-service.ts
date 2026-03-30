import { readFile } from 'fs/promises';
import { z } from 'zod';
import {
    createBooking,
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
} from '@/lib/coupons';
import { generateWhatsAppMessage, generateWhatsAppLink } from '@/lib/whatsapp-template';
import { sendNewBookingNotification } from '@/lib/telegram';
import { sendEmail } from '@/lib/email';
import { buildCustomerBookingEmail } from '@/lib/email-templates';
import { logger, AppError } from '@/lib/logger';
import { safeNumber, safeProperty } from '@/lib/type-utils';
import { Booking } from '@/lib/types';
import { createBookingSchema } from '@/lib/validation';

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

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
}

export const bookingService = new BookingService();
