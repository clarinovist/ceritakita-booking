/**
 * Utils Barrel Exports
 *
 * This file provides a single entry point for all utility functions.
 * Use this to import utility functions with clean, short imports.
 *
 * @example
 * ```typescript
 * // Instead of:
 * import { formatDate } from '@/utils/dateFormatter';
 *
 * // Use:
 * import { formatDate, formatDateTime } from '@/utils';
 * ```
 */

// Date formatting utilities
export {
  formatDate,
  formatDateTime,
  formatTime,
  formatDateForInput,
  formatDateShort
} from './dateFormatter';
