/**
 * SQLite-based storage layer for bookings
 * Replaces the file-based JSON storage with a proper database
 *
 * @deprecated This file is a facade for backward compatibility.
 * Please import from '@/lib/repositories/*' instead.
 */

import 'server-only';

// Re-export types
export type {
    Booking,
    Payment,
    RescheduleHistory,
    AdsData,
    SystemSettings
} from '@/lib/types';

// Re-export Bookings Repository
export {
    createBooking,
    readBooking,
    readData,
    writeData,
    updateBooking,
    deleteBooking,
    getBookingsByStatus,
    searchBookings,
    checkSlotAvailability,
    addRescheduleHistory
} from '@/lib/repositories/bookings';

// Re-export Analytics Repository
export {
    saveAdsLog,
    saveAdsLogBatch,
    backfillAdsHistory,
    getAdsLog,
    saveWaClick,
    getWaClicksByDay,
    getWaClicksCount,
} from '@/lib/repositories/analytics';

// Re-export Settings Repository
export {
    getSystemSettings,
    getSystemSetting,
    updateSystemSettings,
    initializeSystemSettings
} from '@/lib/repositories/settings';
