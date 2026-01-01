/**
 * Centralized Type Definitions
 * 
 * This file serves as the main entry point for all type definitions in the application.
 * It provides a single source of truth for all types, making them easy to import and use.
 * 
 * Usage:
 * ```typescript
 * import { Service, Addon, Booking } from '@/lib/types';
 * ```
 * 
 * @module Types
 */

// Service Types
export type { Service, ServiceFormData } from './service';

// Addon Types
export type { Addon, AddonFormData, BookingAddon } from './addon';

// Photographer Types
export type { Photographer, PhotographerFormData } from './photographer';

// Booking Types
export type {
  Booking,
  BookingData,
  BookingFormData,
  BookingPayload,
  BookingStatus,
  CustomerData,
  FinanceData,
  Payment,
  RescheduleFormData,
  RescheduleHistory,
  getBookingStatusColor
} from './booking';

// Coupon Types
export type { Coupon, CouponValidation, CouponUsage } from './coupon';

// Payment Types
export type {
  PaymentMethod,
  CreatePaymentMethodInput,
  UpdatePaymentMethodInput,
  PaymentSettings
} from './payment';

// Portfolio Types
export type { PortfolioImage, PortfolioFormData } from './portfolio';

// Meta Ads Types
export type { AdsData, AdsLogEntry, AdsInsights } from './meta-ads';

// Settings Types (existing)
export type {
  SystemSettings,
  SettingsContextType,
  SettingsAuditLog
} from './settings';

// Leads Types (new)
export type {
  Lead,
  LeadStatus,
  LeadSource,
  LeadFormData,
  LeadUpdateData,
  LeadFilters,
  getLeadStatusColor,
  getLeadSourceIcon,
  LEAD_STATUSES,
  LEAD_SOURCES
} from './leads';

// User Types (existing)
export type {
  User,
  UserPermissions,
  CreateUserInput,
  UpdateUserInput,
  UserApiResponse,
  UserValidationError
} from './user';

// Common Types
export type {
  ViewMode,
  FilterStatus,
  DateRange,
  BookingUpdate,
  UploadedFile,
  DatabaseResult,
  TransactionResult,
  ValidationError,
  LogLevel,
  LogEntry,
  ApiResponse
} from './common';