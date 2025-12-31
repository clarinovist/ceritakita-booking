/**
 * Lib Barrel Exports (CLIENT-SAFE ONLY)
 *
 * This file now ONLY exports types, validation schemas, and client-safe utilities.
 * DO NOT export database functions, auth logic, or file system operations here.
 */

// ✅ Validation (Safe for Client & Server)
export {
  createBookingSchema,
  customerSchema,
  bookingSchema,
  paymentSchema,
  financeSchema,
  bookingAddonSchema,
  updateBookingSchema,
  serviceSchema,
  servicesArraySchema
} from './validation';

// ✅ Constants (Safe)
export * from './constants';

// ✅ Type Definitions (Safe)
export * from './types';

// ✅ Type Utilities (Safe functions)
export {
  safeNumber,
  safeString,
  safeBoolean,
  safeDate,
  safeProperty,
  normalizeBookingStatus,
  createDatabaseResult
} from './type-utils';

// ✅ Settings Context (React Context - Safe)
export {
  SettingsProvider,
  useSettings
} from './settings-context';

// ✅ Permission Types (Enums/Constants only - Safe)
export {
  hasPermission, // Pastikan fungsi ini murni logic JS, tidak akses DB
  getFilteredMenuItems,
  getDefaultPermissions,
  DEFAULT_ADMIN_PERMISSIONS,
  DEFAULT_STAFF_PERMISSIONS,
  PERMISSION_VALIDATION
} from './permissions-types';

// ❌ SEMUA YANG BERHUBUNGAN DENGAN DATABASE/SERVER DIHAPUS DARI SINI
// Anda harus mengimportnya secara langsung (Direct Import) di file yang membutuhkan.