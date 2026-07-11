import { z } from 'zod';
import { LEAD_STATUSES, LEAD_SOURCES } from '@/lib/types/leads';

const nonEmptyTrimmedString = (fieldName: string, max = 500) =>
  z.string()
    .trim()
    .min(1, `${fieldName} is required`)
    .max(max, `${fieldName} is too long`);

const optionalTrimmedString = (max = 500) =>
  z.string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value === '' ? undefined : value);

const optionalEmail = z.string()
  .trim()
  .email('Invalid email format')
  .optional()
  .or(z.literal(''))
  .transform((value) => value === '' ? undefined : value);

const optionalDateString = z.string()
  .trim()
  .optional()
  .transform((value) => value === '' ? undefined : value)
  .refine((value) => {
    if (!value) return true;
    return !Number.isNaN(new Date(value).getTime());
  }, 'Invalid date format');

const leadStatusSchema = z.enum(LEAD_STATUSES as [
  'New',
  'Contacted',
  'Follow Up',
  'Won',
  'Lost',
  'Converted'
]);
const leadSourceSchema = z.enum(LEAD_SOURCES as [
  'Meta Ads',
  'Organic',
  'Referral',
  'Instagram',
  'WhatsApp',
  'Phone Call',
  'Website Form',
  'Other'
]);
const interactionTypeSchema = z.enum(['WhatsApp', 'Phone', 'Email', 'Note']);

export const leadFiltersSchema = z.object({
  status: leadStatusSchema.optional(),
  source: leadSourceSchema.optional(),
  assigned_to: optionalTrimmedString(100),
  search: optionalTrimmedString(255),
  stats: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const leadCreateSchema = z.object({
  name: nonEmptyTrimmedString('Name', 100),
  whatsapp: z.string()
    .trim()
    .min(8, 'WhatsApp number is too short')
    .max(20, 'WhatsApp number is too long')
    .regex(/^[0-9+\-\s()]+$/, 'Invalid WhatsApp number format'),
  email: optionalEmail,
  source: leadSourceSchema,
  interest: z.array(z.string().trim().min(1).max(100)).optional(),
  status: leadStatusSchema,
  notes: optionalTrimmedString(1000),
  assigned_to: optionalTrimmedString(100),
  next_follow_up: optionalDateString,
});

export const leadUpdateSchema = leadCreateSchema
  .extend({
    booking_id: optionalTrimmedString(100),
    converted_at: optionalDateString,
    last_contacted_at: optionalDateString,
  })
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    'At least one field must be provided for update'
  );

export const leadStatusUpdateSchema = z.object({
  status: leadStatusSchema,
});

export const leadBulkActionSchema = z.object({
  ids: z.array(z.string().trim().min(1)).min(1, 'At least one ID is required'),
  action: z.enum(['update_status', 'delete']),
  data: z.object({
    status: leadStatusSchema.optional(),
  }).optional(),
}).superRefine((value, ctx) => {
  if (value.action === 'update_status' && !value.data?.status) {
    ctx.addIssue({
      code: 'custom',
      message: 'Missing status for update',
      path: ['data', 'status'],
    });
  }
});

export const leadInteractionSchema = z.object({
  interaction_type: interactionTypeSchema,
  interaction_content: nonEmptyTrimmedString('Interaction content', 2000),
  send_to_meta: z.boolean().optional(),
});

export const leadIdSchema = z.object({
  id: nonEmptyTrimmedString('Lead ID', 100),
});

export const analyticsLeadsQuerySchema = z.object({
  start: z.string().trim().min(1, 'Start date is required').refine((value) => !Number.isNaN(new Date(value).getTime()), 'Invalid start date'),
  end: z.string().trim().min(1, 'End date is required').refine((value) => !Number.isNaN(new Date(value).getTime()), 'Invalid end date'),
});
