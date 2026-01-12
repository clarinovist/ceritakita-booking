/**
 * Admin Components Barrel Exports
 *
 * This file provides a single entry point for all admin-related components, hooks, and tables.
 * Use this to import admin features with clean, short imports.
 *
 * @example
 * ```typescript
 * // Instead of:
 * import { useBookings } from '@/components/admin/hooks/useBookings'
 * import { BookingsTable } from '@/components/admin/tables/BookingsTable'
 *
 * // Use:
 * import { useBookings, BookingsTable } from '@/components/admin'
 * ```
 *
 * @note All exported hooks are designed to be used within client components.
 * They should be imported directly in components with 'use client' directive.
 */

// Views
/** Dashboard view component for admin panel */
export { default as AdminDashboard } from './AdminDashboard';
/** Ads performance analytics component */
export { default as AdsPerformance } from './AdsPerformance';
/** Payment methods management component */
export { default as PaymentMethodsManagement } from './PaymentMethodsManagement';
/** System settings management component */
export { default as SettingsManagement } from './SettingsManagement';
/** User management component */
export { default as UserManagement } from './UserManagement';
/** Finance module container */
export { FinanceModule } from './FinanceModule';

// Hooks
/** Hook for managing add-ons data and operations */
export { useAddons } from './hooks/useAddons';
/** Hook for managing bookings data and operations */
export { useBookings } from './hooks/useBookings';
/** Hook for exporting data in various formats */
export { useExport } from './hooks/useExport';
/** Hook for managing photographers data and operations */
export { usePhotographers } from './hooks/usePhotographers';
/** Hook for managing services data and operations */
export { useServices } from './hooks/useServices';

// Tables
/** Table component for displaying and managing add-ons */
export { AddonsTable } from './tables/AddonsTable';
/** Table component for displaying and managing bookings */
export { BookingsTable } from './tables/BookingsTable';
/** Table component for displaying and managing photographers */
export { PhotographersTable } from './tables/PhotographersTable';
/** Table component for displaying and managing services */
export { ServicesTable } from './tables/ServicesTable';

// Modals
/** Modal component for creating/editing services */
export { ServiceModal } from './modals/ServiceModal';

// Booking Modals
/** Modal component for viewing booking details */
export { BookingDetailModal } from './Bookings/modals/BookingDetailModal';
/** Modal component for creating new bookings */
export { CreateBookingModal } from './Bookings/modals/CreateBookingModal';
/** Modal component for rescheduling bookings */
export { RescheduleModal } from './Bookings/modals/RescheduleModal';

// Re-export types that are commonly used with admin components
export type { ViewMode } from '@/lib/types';