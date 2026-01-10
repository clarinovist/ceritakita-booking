/**
 * Common Types
 * Shared utility types and interfaces used across the application
 */

// Admin-specific types that don't fit into other domains
export type ViewMode = 'dashboard' | 'calendar' | 'table' | 'services' | 'portfolio' | 'photographers' | 'addons' | 'coupons' | 'users' | 'payment-settings' | 'ads' | 'settings' | 'leads' | 'homepage';

export type FilterStatus = 'All' | 'Active' | 'Canceled' | 'Completed';

export interface DateRange {
  /** Start date (ISO format) */
  start: string;

  /** End date (ISO format) */
  end: string;
}

// Booking update interface for admin operations
export interface BookingUpdate {
  /** Updated status */
  status?: 'Active' | 'Cancelled' | 'Rescheduled' | 'Completed';

  /** Updated finance data */
  finance?: {
    total_price: number;
    payments: Array<{
      date: string;
      amount: number;
      note: string;
      proof_base64?: string;
      proof_filename?: string;
    }>;
    service_base_price?: number;
    base_discount?: number;
    addons_total?: number;
    coupon_discount?: number;
    coupon_code?: string;
  };

  /** Updated booking data */
  booking?: {
    date: string;
    notes: string;
    location_link: string;
  };

  /** Updated customer data */
  customer?: {
    name: string;
    whatsapp: string;
    category: string;
    serviceId?: string;
  };

  /** Updated photographer ID */
  photographer_id?: string;
}

// File upload types
export interface UploadedFile {
  /** Generated filename */
  filename: string;

  /** Original filename */
  originalFilename: string;

  /** File size in bytes */
  size: number;

  /** MIME type */
  mimeType: string;

  /** Relative path from uploads directory */
  relativePath: string;

  /** Full path */
  fullPath: string;
}

// Database result types
export interface DatabaseResult<T> {
  /** Whether the operation succeeded */
  success: boolean;

  /** The data returned (if successful) */
  data?: T;

  /** Error message (if failed) */
  error?: string;

  /** Error code */
  code?: string;
}

// Transaction result types
export interface TransactionResult<T> {
  /** Whether the transaction succeeded */
  success: boolean;

  /** The data returned (if successful) */
  data?: T;

  /** Error message (if failed) */
  error?: string;

  /** Rollback information */
  rollback?: string;
}

// Validation error type
export interface ValidationError {
  /** Field that failed validation */
  field: string;

  /** Validation error message */
  message: string;
}

// Log level types
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LogEntry {
  /** ISO timestamp */
  timestamp: string;

  /** Log level */
  level: LogLevel;

  /** Log message */
  message: string;

  /** Optional context data */
  context?: Record<string, any>;

  /** Optional error object */
  error?: Error;
}

// API Response wrapper
export interface ApiResponse<T> {
  /** Whether the request succeeded */
  success: boolean;

  /** Response data */
  data?: T;

  /** Error message if failed */
  error?: string;

  /** Error code */
  code?: string;

  /** Additional metadata */
  meta?: Record<string, any>;
}