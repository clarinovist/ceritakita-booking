/**
 * Type safety utilities for database operations
 * Provides validation and safe type casting
 */

import { z } from 'zod';

// Status enum for bookings
export const BookingStatus = {
  ACTIVE: 'Active',
  CANCELLED: 'Cancelled', // Standardized spelling
  RESCHEDULED: 'Rescheduled',
  COMPLETED: 'Completed'
} as const;

export type BookingStatusType = typeof BookingStatus[keyof typeof BookingStatus];

// Validation schemas for database operations
export const DatabaseString = z.string().min(1, 'Required field');
export const DatabaseNumber = z.number().int().nonnegative();
export const DatabaseDate = z.string().datetime();

// Booking status validation (only allows standardized values)
export const BookingStatusSchema = z.enum([
  BookingStatus.ACTIVE,
  BookingStatus.CANCELLED,
  BookingStatus.RESCHEDULED,
  BookingStatus.COMPLETED
]);

// Safe string parsing with fallback
export function safeString(value: any, fallback: string = ''): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  return String(value);
}

// Safe number parsing with fallback
export function safeNumber(value: any, fallback: number = 0): number {
  if (value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return isNaN(parsed) ? fallback : parsed;
}

// Safe boolean parsing
export function safeBoolean(value: any, fallback: boolean = false): boolean {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
  }
  return fallback;
}

// Safe date parsing (returns ISO string or null)
export function safeDate(value: any): string | null {
  if (!value) return null;
  
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
}

// Normalize booking status (handles both spellings)
export function normalizeBookingStatus(status: string): BookingStatusType {
  const normalized = status.trim();
  
  // Handle both spellings of cancelled
  if (normalized.toLowerCase() === 'canceled') {
    return BookingStatus.CANCELLED;
  }
  
  // Validate against allowed values
  const result = BookingStatusSchema.safeParse(normalized);
  if (result.success) {
    return result.data;
  }
  
  // Default to active for unknown values
  return BookingStatus.ACTIVE;
}

// Type guard for booking status
export function isBookingStatus(value: string): value is BookingStatusType {
  return BookingStatusSchema.safeParse(value).success;
}

// Safe object property access with type checking
export function safeProperty<T>(obj: any, path: string, fallback: T): T {
  try {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) return fallback;
      current = current[part];
    }
    
    return current as T ?? fallback;
  } catch {
    return fallback;
  }
}

// Validate database record structure
export function validateDatabaseRecord<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: boolean; data?: z.infer<T>; errors?: any[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return {
      success: false,
      errors: result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code
      }))
    };
  }
}

// Cast database row to typed object with validation
export function castDatabaseRow<T extends z.ZodTypeAny>(
  schema: T,
  row: any
): z.infer<T> | null {
  if (!row) return null;
  
  const result = schema.safeParse(row);
  return result.success ? result.data : null;
}

// Create typed database query result
export function createQueryResult<T>(
  data: any[],
  schema: z.ZodType<T>
): T[] {
  return data
    .map(row => {
      const result = schema.safeParse(row);
      return result.success ? result.data : null;
    })
    .filter((item): item is T => item !== null);
}

// Type-safe error handling wrapper
export async function withTypeSafety<T>(
  operation: () => Promise<T>,
  errorHandler: (error: any) => T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    return errorHandler(error);
  }
}

// Database connection result type
export interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

// Create typed database result
export function createDatabaseResult<T>(
  data: T | null,
  error?: Error
): DatabaseResult<T> {
  if (error) {
    return {
      success: false,
      error: {
        message: error.message,
        code: 'DATABASE_ERROR',
        details: error
      }
    };
  }
  
  if (data === null || data === undefined) {
    return {
      success: false,
      error: {
        message: 'No data returned',
        code: 'NO_DATA'
      }
    };
  }
  
  return {
    success: true,
    data
  };
}

// Transaction result type
export interface TransactionResult<T> {
  success: boolean;
  data?: T;
  rollback?: boolean;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

// Execute transaction with rollback support
export async function executeTransaction<T>(
  operation: () => Promise<T>,
  rollback?: () => Promise<void>
): Promise<TransactionResult<T>> {
  try {
    const result = await operation();
    return {
      success: true,
      data: result
    };
  } catch (error) {
    if (rollback) {
      try {
        await rollback();
        return {
          success: false,
          rollback: true,
          error: {
            message: error instanceof Error ? error.message : 'Transaction failed',
            code: 'TRANSACTION_FAILED',
            details: error
          }
        };
      } catch (rollbackError) {
        return {
          success: false,
          rollback: false,
          error: {
            message: 'Transaction failed and rollback also failed',
            code: 'ROLLBACK_FAILED',
            details: { original: error, rollback: rollbackError }
          }
        };
      }
    }
    
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Operation failed',
        code: 'OPERATION_FAILED',
        details: error
      }
    };
  }
}