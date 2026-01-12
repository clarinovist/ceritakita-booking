import { z } from 'zod';
import { SERVICE_CATEGORIES as _SERVICE_CATEGORIES } from './constants';

// Customer validation schema
export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  whatsapp: z.string()
    .min(8, 'WhatsApp number too short')
    .max(20, 'WhatsApp number too long')
    .regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format'),
  category: z.string().min(1, 'Category is required'),
  serviceId: z.string().optional(),
});

// Booking validation schema
export const bookingSchema = z.object({
  date: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid date format'),
  notes: z.string().max(500, 'Notes too long').optional().default(''),
  location_link: z.string().url('Invalid URL').optional().or(z.literal('')),
});

// Payment validation schema
export const paymentSchema = z.object({
  date: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid date format'),
  amount: z.number().min(0, 'Amount must be positive'),
  note: z.string().max(200, 'Note too long'),
  proof_base64: z.string().optional().default(''),     // Deprecated: kept for backward compatibility
  proof_filename: z.string().optional().default(''),   // New: relative path from uploads/
});

// Finance validation schema
export const financeSchema = z.object({
  total_price: z.number().min(0, 'Total price must be positive'),
  payments: z.array(paymentSchema).default([]),
  // Price breakdown fields (optional for backward compatibility)
  service_base_price: z.number().min(0).optional(),
  base_discount: z.number().min(0).optional(),
  addons_total: z.number().optional(),
  coupon_discount: z.number().min(0).optional(),
  coupon_code: z.string().optional(),
});

// Booking addon validation schema
export const bookingAddonSchema = z.object({
  addon_id: z.string(),
  addon_name: z.string(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  price_at_booking: z.number(), // Allow negative for adjustments/downgrades
});

// Full booking creation schema
export const createBookingSchema = z.object({
  customer: customerSchema,
  booking: bookingSchema,
  finance: financeSchema,
  photographer_id: z.string().optional(),
  addons: z.array(bookingAddonSchema).optional(),
});

// Booking update schema (only allow specific fields to be updated)
export const updateBookingSchema = z.object({
  id: z.string().uuid('Invalid booking ID'),
  status: z.enum(['Active', 'Cancelled', 'Rescheduled', 'Completed']).optional(),
  booking: bookingSchema.partial().optional(),
  finance: financeSchema.optional(),
  customer: customerSchema.partial().optional(),
  photographer_id: z.string().optional(),
  addons: z.array(bookingAddonSchema).optional(),
});

// Service validation schema
export const serviceSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Service name is required').max(100, 'Name too long'),
  basePrice: z.number().min(0, 'Base price must be positive'),
  discountValue: z.number().min(0, 'Discount must be positive'),
  isActive: z.boolean(),
  badgeText: z.string().max(50, 'Badge text too long').optional(),
}).refine((data) => data.discountValue <= data.basePrice, {
  message: 'Discount cannot exceed base price',
  path: ['discountValue'],
});

// Array of services schema
export const servicesArraySchema = z.array(serviceSchema);

// Price adjustment schema
export const priceAdjustmentSchema = z.object({
  booking_id: z.string().uuid(),
  addon_id: z.string(),
  quantity: z.number().int().positive().default(1),
  price: z.number().nonnegative().optional(), // Optional override price
  reason: z.string().max(500).optional()
});
