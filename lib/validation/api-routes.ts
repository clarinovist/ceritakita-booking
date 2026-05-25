import { z } from 'zod';
import { FILE_CONSTRAINTS } from '@/lib/constants';

export const analyticsTrackSchema = z.object({
  path: z.string().trim().min(1, 'Path is required').max(500, 'Path is too long'),
  visitor_id: z.string().trim().min(1, 'Visitor ID is required').max(255, 'Visitor ID is too long'),
  user_agent: z.string().trim().max(1000).optional(),
  device_type: z.enum(['mobile', 'desktop', 'tablet', 'unknown']).optional().default('unknown'),
  referer: z.string().trim().max(1000).optional().nullable(),
});

export const analyticsTrafficQuerySchema = z.object({
  start: z.string().trim().optional(),
  end: z.string().trim().optional(),
});

export const paymentSettingsSchema = z.object({
  bank_name: z.string().trim().min(1, 'Bank name is required').max(100, 'Bank name is too long'),
  account_name: z.string().trim().min(1, 'Account name is required').max(100, 'Account name is too long'),
  account_number: z.string().trim().min(1, 'Account number is required').max(50, 'Account number is too long'),
});

export const portfolioQuerySchema = z.object({
  serviceId: z.string().trim().min(1, 'Service ID is required').max(100, 'Service ID is too long'),
});

export const portfolioDeleteSchema = z.object({
  id: z.string().trim().min(1, 'ID is required').max(100, 'ID is too long'),
});

export const portfolioPatchSchema = z.object({
  id: z.string().trim().min(1, 'ID is required').max(100, 'ID is too long'),
  is_active: z.boolean(),
});

export function validateImageUpload(file: File | null, fieldName = 'File') {
  if (!file) {
    return {
      success: false as const,
      error: `${fieldName} is required`,
      code: 'MISSING_FILE'
    };
  }

  if (!FILE_CONSTRAINTS.ALLOWED_IMAGE_TYPES.includes(file.type as typeof FILE_CONSTRAINTS.ALLOWED_IMAGE_TYPES[number])) {
    return {
      success: false as const,
      error: `Invalid ${fieldName.toLowerCase()} type`,
      code: 'INVALID_FILE_TYPE'
    };
  }

  if (file.size > FILE_CONSTRAINTS.MAX_SIZE) {
    return {
      success: false as const,
      error: `${fieldName} is too large. Maximum size is 5MB`,
      code: 'FILE_TOO_LARGE'
    };
  }

  return { success: true as const };
}
