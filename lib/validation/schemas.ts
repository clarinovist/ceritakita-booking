/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';

/**
 * Booking Form Validation Schemas
 * Implements real-time validation for all form fields
 */

// Service selection schema
export const serviceSelectionSchema = z.object({
  serviceId: z.string().min(1, 'Silakan pilih layanan terlebih dahulu'),
  addons: z.array(
    z.object({
      addonId: z.string(),
      quantity: z.number().min(1, 'Quantity minimal 1'),
    })
  ).optional(),
});

// Schedule and location schema
export const scheduleSchema = z.object({
  date: z.string().min(1, 'Tanggal wajib diisi').refine((val) => {
    const selectedDate = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today;
  }, {
    message: 'Tanggal tidak boleh di masa lalu',
  }),
  
  time: z.string().min(1, 'Jam wajib diisi').refine((val) => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-3]$/;
    return timeRegex.test(val);
  }, {
    message: 'Format jam tidak valid (HH:MM)',
  }),
  
  location_link: z.string().optional().refine((val) => {
    if (!val) return true; // Optional field
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, {
    message: 'Link lokasi harus berupa URL yang valid',
  }),
});

// Customer information schema
export const customerInfoSchema = z.object({
  name: z.string().min(1, 'Nama lengkap wajib diisi')
    .min(2, 'Nama minimal 2 karakter')
    .max(100, 'Nama maksimal 100 karakter')
    .regex(/^[a-zA-Z\s]+$/, 'Nama hanya boleh berisi huruf dan spasi'),
  
  whatsapp: z.string().min(1, 'Nomor WhatsApp wajib diisi').refine((val) => {
    // Remove non-numeric characters
    const cleaned = val.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }, {
    message: 'Nomor WhatsApp minimal 10 digit, maksimal 15 digit',
  }),
  
  notes: z.string().optional().refine((val) => {
    if (!val) return true;
    return val.length <= 500;
  }, {
    message: 'Catatan maksimal 500 karakter',
  }),
});

// Payment schema
export const paymentSchema = z.object({
  dp_amount: z.string().min(1, 'Jumlah DP wajib diisi').refine((val) => {
    const amount = Number(val);
    return amount >= 10000 && amount <= 100000000;
  }, {
    message: 'DP minimal Rp 10.000, maksimal Rp 100.000.000',
  }),
  
  proof_filename: z.string().min(1, 'Bukti transfer wajib diupload'),
});

// Coupon validation schema
export const couponSchema = z.object({
  code: z.string().min(1, 'Kode kupon wajib diisi')
    .min(3, 'Kode kupon minimal 3 karakter')
    .max(20, 'Kode kupon maksimal 20 karakter')
    .regex(/^[A-Z0-9]+$/, 'Kode kupon hanya boleh huruf kapital dan angka'),
  
  totalAmount: z.number().min(0, 'Total amount tidak boleh negatif'),
});

// Complete booking schema (combines all steps)
export const completeBookingSchema = z.object({
  // Step 1: Service Selection
  serviceId: z.string().min(1, 'Silakan pilih layanan'),
  
  // Step 2: Add-ons (optional)
  addons: z.array(
    z.object({
      addonId: z.string(),
      addonName: z.string(),
      quantity: z.number().min(1, 'Quantity minimal 1'),
      priceAtBooking: z.number().min(0),
    })
  ).optional(),
  
  // Step 3: Schedule & Location
  date: z.string().min(1, 'Tanggal wajib diisi').refine((val) => {
    const selectedDate = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today;
  }, {
    message: 'Tanggal tidak boleh di masa lalu',
  }),
  
  time: z.string().min(1, 'Jam wajib diisi'),
  
  location_link: z.string().optional().refine((val) => {
    if (!val) return true;
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, {
    message: 'Link lokasi harus berupa URL yang valid',
  }),
  
  // Step 4: Customer Information
  customerName: z.string().min(1, 'Nama lengkap wajib diisi')
    .min(2, 'Nama minimal 2 karakter')
    .max(100, 'Nama maksimal 100 karakter'),
  
  whatsapp: z.string().min(1, 'Nomor WhatsApp wajib diisi').refine((val) => {
    const cleaned = val.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }, {
    message: 'Nomor WhatsApp minimal 10 digit',
  }),
  
  notes: z.string().optional(),
  
  // Step 5: Payment
  dpAmount: z.string().min(1, 'Jumlah DP wajib diisi').refine((val) => {
    const amount = Number(val);
    return amount >= 10000;
  }, {
    message: 'DP minimal Rp 10.000',
  }),
  
  proofFile: z.any().refine((val) => val instanceof File, {
    message: 'Bukti transfer wajib diupload',
  }),
  
  // Financial calculations (for backend validation)
  totalPrice: z.number().min(0),
  serviceBasePrice: z.number().min(0),
  baseDiscount: z.number().min(0),
  addonsTotal: z.number().min(0),
  couponDiscount: z.number().min(0),
  couponCode: z.string().optional(),
});

// Partial schemas for individual step validation
export const stepSchemas = {
  1: serviceSelectionSchema,
  2: z.object({}), // Add-ons are optional, no strict validation needed
  3: scheduleSchema,
  4: customerInfoSchema,
  5: paymentSchema,
};

// Validation error type
export type ValidationError = {
  field: string;
  message: string;
  step: number;
};

// Helper function to validate step
export const validateStep = (step: number, data: any): { success: boolean; errors?: ValidationError[] } => {
  const schema = stepSchemas[step as keyof typeof stepSchemas];
  
  if (!schema) {
    return { success: false, errors: [{ field: 'step', message: 'Invalid step', step }] };
  }
  
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true };
  }
  
  const errors = result.error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
    step,
  }));
  
  return { success: false, errors };
};

// Helper function to validate complete booking
export const validateCompleteBooking = (data: any) => {
  const result = completeBookingSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
  
  return { success: false, errors };
};

// Field-specific validation helpers
export const fieldValidators = {
  name: (value: string) => {
    if (!value || value.trim().length === 0) return 'Nama wajib diisi';
    if (value.length < 2) return 'Nama minimal 2 karakter';
    if (value.length > 100) return 'Nama maksimal 100 karakter';
    if (!/^[a-zA-Z\s]+$/.test(value)) return 'Nama hanya boleh berisi huruf dan spasi';
    return null;
  },
  
  whatsapp: (value: string) => {
    if (!value) return 'Nomor WhatsApp wajib diisi';
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length < 10) return 'Nomor WhatsApp minimal 10 digit';
    if (cleaned.length > 15) return 'Nomor WhatsApp maksimal 15 digit';
    return null;
  },
  
  date: (value: string) => {
    if (!value) return 'Tanggal wajib diisi';
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) return 'Tanggal tidak boleh di masa lalu';
    return null;
  },
  
  time: (value: string) => {
    if (!value) return 'Jam wajib diisi';
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-3]$/;
    if (!timeRegex.test(value)) return 'Format jam tidak valid (HH:MM)';
    return null;
  },
  
  dp_amount: (value: string, total?: number) => {
    if (!value) return 'Jumlah DP wajib diisi';
    const amount = Number(value);
    if (isNaN(amount)) return 'DP harus berupa angka';
    if (amount < 10000) return 'DP minimal Rp 10.000';
    if (total && amount > total) return 'DP tidak boleh melebihi total';
    return null;
  },
  
  location_link: (value: string) => {
    if (!value) return null; // Optional field
    try {
      new URL(value);
      return null;
    } catch {
      return 'Link lokasi harus berupa URL yang valid';
    }
  },
  
  notes: (value: string) => {
    if (value && value.length > 500) return 'Catatan maksimal 500 karakter';
    return null;
  },
};