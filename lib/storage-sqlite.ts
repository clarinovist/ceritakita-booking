/**
 * SQLite-based storage layer for bookings
 * Replaces the file-based JSON storage with a proper database
 */

import getDb from './db';
import type Database from 'better-sqlite3';
import { getBookingAddons, setBookingAddons, type BookingAddon } from './addons';
import { logger, AppError } from './logger';
import { normalizeBookingStatus, safeString, safeNumber, executeTransaction, createDatabaseResult } from './type-utils';
import { withLock } from './file-lock';

export interface Payment {
  date: string;
  amount: number;
  note: string;
  proof_filename?: string;
  proof_url?: string;
  storage_backend?: 'local' | 'b2';
}

export interface RescheduleHistory {
  id?: number;
  old_date: string;
  new_date: string;
  rescheduled_at: string;
  reason?: string;
}

export interface Booking {
  id: string;
  created_at: string;
  status: 'Active' | 'Cancelled' | 'Rescheduled' | 'Completed';
  customer: {
    name: string;
    whatsapp: string;
    category: string;
    serviceId?: string;
  };
  booking: {
    date: string;
    notes: string;
    location_link: string;
  };
  finance: {
    total_price: number;
    payments: Payment[];
    service_base_price?: number;
    base_discount?: number;
    addons_total?: number;
    coupon_discount?: number;
    coupon_code?: string;
  };
  photographer_id?: string;
  addons?: BookingAddon[];
  reschedule_history?: RescheduleHistory[];
}

/**
 * Convert database row to Booking object with type safety
 */
function rowToBooking(row: any, payments: Payment[], addons?: BookingAddon[], rescheduleHistory?: RescheduleHistory[]): Booking {
  // Use type-safe status normalization
  const status = normalizeBookingStatus(row.status);

  return {
    id: safeString(row.id),
    created_at: safeString(row.created_at),
    status: status,
    customer: {
      name: safeString(row.customer_name),
      whatsapp: safeString(row.customer_whatsapp),
      category: safeString(row.customer_category),
      serviceId: row.customer_service_id ? safeString(row.customer_service_id) : undefined,
    },
    booking: {
      date: safeString(row.booking_date),
      notes: safeString(row.booking_notes, ''),
      location_link: safeString(row.booking_location_link, ''),
    },
    finance: {
      total_price: safeNumber(row.total_price),
      payments,
      service_base_price: row.service_base_price !== null ? safeNumber(row.service_base_price) : undefined,
      base_discount: row.base_discount !== null ? safeNumber(row.base_discount) : undefined,
      addons_total: row.addons_total !== null ? safeNumber(row.addons_total) : undefined,
      coupon_discount: row.coupon_discount !== null ? safeNumber(row.coupon_discount) : undefined,
      coupon_code: row.coupon_code ? safeString(row.coupon_code) : undefined,
    },
    photographer_id: row.photographer_id ? safeString(row.photographer_id) : undefined,
    addons: addons && addons.length > 0 ? addons : undefined,
    reschedule_history: rescheduleHistory && rescheduleHistory.length > 0 ? rescheduleHistory : undefined,
  };
}

/**
 * Get all payments for a booking
 */
function getPaymentsForBooking(bookingId: string): Payment[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT date, amount, note, proof_filename, proof_url, storage_backend
    FROM payments
    WHERE booking_id = ?
    ORDER BY date ASC, id ASC
  `);

  const rows = stmt.all(bookingId) as any[];
  return rows.map(row => ({
    date: row.date,
    amount: row.amount,
    note: row.note || '',
    ...(row.proof_filename && { proof_filename: row.proof_filename }),
    ...(row.proof_url && { proof_url: row.proof_url }),
    ...(row.storage_backend && { storage_backend: row.storage_backend }),
  }));
}

/**
 * Get reschedule history for a booking
 */
function getRescheduleHistory(bookingId: string): RescheduleHistory[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT id, old_date, new_date, rescheduled_at, reason
    FROM reschedule_history
    WHERE booking_id = ?
    ORDER BY rescheduled_at ASC
  `);

  const rows = stmt.all(bookingId) as any[];
  return rows.map(row => ({
    id: row.id,
    old_date: row.old_date,
    new_date: row.new_date,
    rescheduled_at: row.rescheduled_at,
    ...(row.reason && { reason: row.reason }),
  }));
}

/**
 * Add reschedule history entry
 */
export function addRescheduleHistory(
  bookingId: string,
  oldDate: string,
  newDate: string,
  reason?: string
): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO reschedule_history (booking_id, old_date, new_date, reason)
    VALUES (?, ?, ?, ?)
  `);

  stmt.run(bookingId, oldDate, newDate, reason || null);
}

/**
 * Read all bookings
 */
export function readData(): Booking[] {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM bookings ORDER BY ABS(julianday(booking_date) - julianday('now')) ASC");
  const rows = stmt.all() as any[];

  logger.info('Retrieved bookings from database', { count: rows.length });

  return rows.map(row => {
    const payments = getPaymentsForBooking(row.id);
    const addons = getBookingAddons(row.id);
    const rescheduleHistory = getRescheduleHistory(row.id);
    return rowToBooking(row, payments, addons, rescheduleHistory);
  });
}

/**
 * Read a single booking by ID
 */
export function readBooking(id: string): Booking | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM bookings WHERE id = ?');
  const row = stmt.get(id) as any;

  if (!row) return null;

  const payments = getPaymentsForBooking(id);
  const addons = getBookingAddons(id);
  const rescheduleHistory = getRescheduleHistory(id);
  return rowToBooking(row, payments, addons, rescheduleHistory);
}

/**
 * Write/Update bookings
 * This replaces the entire booking (used for updates)
 * Uses transaction with rollback support
 */
export async function writeData(bookings: Booking[]): Promise<void> {
  const db = getDb();

  // Use type-safe transaction with rollback
  const result = await executeTransaction(
    async () => {
      // Use transaction for atomic operations
      const transaction = db.transaction(() => {
        // Clear existing data
        db.prepare('DELETE FROM payments').run();
        db.prepare('DELETE FROM bookings').run();

        // Insert all bookings
        const insertBooking = db.prepare(`
          INSERT INTO bookings (
            id, created_at, status,
            customer_name, customer_whatsapp, customer_category, customer_service_id,
            booking_date, booking_notes, booking_location_link,
            total_price, service_base_price, base_discount, addons_total, coupon_discount, coupon_code,
            photographer_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const insertPayment = db.prepare(`
          INSERT INTO payments (booking_id, date, amount, note, proof_filename, proof_url, storage_backend)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        for (const booking of bookings) {
          // Validate and normalize status
          const normalizedStatus = normalizeBookingStatus(booking.status);

          // Insert booking
          insertBooking.run(
            booking.id,
            booking.created_at,
            normalizedStatus,
            safeString(booking.customer.name),
            safeString(booking.customer.whatsapp),
            safeString(booking.customer.category),
            booking.customer.serviceId || null,
            booking.booking.date,
            booking.booking.notes || null,
            booking.booking.location_link || null,
            safeNumber(booking.finance.total_price),
            booking.finance.service_base_price ?? null,
            booking.finance.base_discount ?? null,
            booking.finance.addons_total ?? null,
            booking.finance.coupon_discount ?? null,
            booking.finance.coupon_code || null,
            booking.photographer_id || null
          );

          // Insert payments
          for (const payment of booking.finance.payments) {
            insertPayment.run(
              booking.id,
              payment.date,
              safeNumber(payment.amount),
              payment.note || null,
              payment.proof_filename || null,
              payment.proof_url || null,
              payment.storage_backend || 'local'
            );
          }
        }
      });

      transaction();
    },
    async () => {
      // Rollback: This is a bit tricky with SQLite since we already committed
      // In production, you'd want to use SAVEPOINT for more granular rollback
      logger.warn('Transaction rolled back for writeData', { bookingsCount: bookings.length });
    }
  );

  if (!result.success) {
    logger.error('Failed to write bookings', { error: result.error }, undefined, undefined, undefined);
    throw new AppError('Failed to write bookings to database', 500, 'DATABASE_WRITE_FAILED', result.error);
  }

  logger.info('Successfully wrote bookings', { count: bookings.length });
}

/**
 * Create a new booking with type safety and file locking
 */
export async function createBooking(booking: Booking): Promise<void> {
  const db = getDb();

  // Use file locking to prevent concurrent access issues
  const result = await withLock(
    `booking:${booking.id}`,
    async () => {
      return await executeTransaction(
        async () => {
          const transaction = db.transaction(() => {
            // Validate and normalize status
            const normalizedStatus = normalizeBookingStatus(booking.status);
            
            // Insert booking
            const stmt = db.prepare(`
              INSERT INTO bookings (
                id, created_at, status,
                customer_name, customer_whatsapp, customer_category, customer_service_id,
                booking_date, booking_notes, booking_location_link,
                total_price, service_base_price, base_discount, addons_total, coupon_discount, coupon_code,
                photographer_id
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
              booking.id,
              booking.created_at,
              normalizedStatus,
              safeString(booking.customer.name),
              safeString(booking.customer.whatsapp),
              safeString(booking.customer.category),
              booking.customer.serviceId || null,
              booking.booking.date,
              booking.booking.notes || null,
              booking.booking.location_link || null,
              safeNumber(booking.finance.total_price),
              booking.finance.service_base_price ?? null,
              booking.finance.base_discount ?? null,
              booking.finance.addons_total ?? null,
              booking.finance.coupon_discount ?? null,
              booking.finance.coupon_code || null,
              booking.photographer_id || null
            );

            // Insert payments
            if (booking.finance.payments.length > 0) {
              const paymentStmt = db.prepare(`
                INSERT INTO payments (booking_id, date, amount, note, proof_filename, proof_url, storage_backend)
                VALUES (?, ?, ?, ?, ?, ?, ?)
              `);

              for (const payment of booking.finance.payments) {
                paymentStmt.run(
                  booking.id,
                  payment.date,
                  safeNumber(payment.amount),
                  payment.note || null,
                  payment.proof_filename || null,
                  payment.proof_url || null,
                  payment.storage_backend || 'local'
                );
              }
            }

            // Insert add-ons
            if (booking.addons && booking.addons.length > 0) {
              setBookingAddons(booking.id, booking.addons.map(addon => ({
                addon_id: addon.addon_id,
                quantity: addon.quantity,
                price: safeNumber(addon.price_at_booking)
              })));
            }
          });

          transaction();
        },
        async () => {
          // Rollback logic would go here if needed
          logger.warn('Transaction rolled back for createBooking', { bookingId: booking.id });
        }
      );
    }
  );

  if (!result.success) {
    logger.error('Failed to create booking', { bookingId: booking.id, error: result.error }, undefined, undefined, undefined);
    throw new AppError('Failed to create booking', 500, 'BOOKING_CREATE_FAILED', result.error);
  }

  logger.audit('CREATE_BOOKING', `booking:${booking.id}`, booking.customer.name, {
    bookingId: booking.id,
    date: booking.booking.date
  });
}

/**
 * Update an existing booking with type safety and file locking
 */
export async function updateBooking(booking: Booking): Promise<void> {
  const db = getDb();

  // Use file locking to prevent concurrent access issues
  const result = await withLock(
    `booking:${booking.id}`,
    async () => {
      return await executeTransaction(
        async () => {
          const transaction = db.transaction(() => {
            // Validate and normalize status
            const normalizedStatus = normalizeBookingStatus(booking.status);
            
            // Update booking
            const stmt = db.prepare(`
              UPDATE bookings SET
                status = ?,
                customer_name = ?,
                customer_whatsapp = ?,
                customer_category = ?,
                customer_service_id = ?,
                booking_date = ?,
                booking_notes = ?,
                booking_location_link = ?,
                total_price = ?,
                service_base_price = ?,
                base_discount = ?,
                addons_total = ?,
                coupon_discount = ?,
                coupon_code = ?,
                photographer_id = ?,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `);

            stmt.run(
              normalizedStatus,
              safeString(booking.customer.name),
              safeString(booking.customer.whatsapp),
              safeString(booking.customer.category),
              booking.customer.serviceId || null,
              booking.booking.date,
              booking.booking.notes || null,
              booking.booking.location_link || null,
              safeNumber(booking.finance.total_price),
              booking.finance.service_base_price ?? null,
              booking.finance.base_discount ?? null,
              booking.finance.addons_total ?? null,
              booking.finance.coupon_discount ?? null,
              booking.finance.coupon_code || null,
              booking.photographer_id || null,
              booking.id
            );

            // Delete old payments and insert new ones
            db.prepare('DELETE FROM payments WHERE booking_id = ?').run(booking.id);

            if (booking.finance.payments.length > 0) {
              const paymentStmt = db.prepare(`
                INSERT INTO payments (booking_id, date, amount, note, proof_filename, proof_url, storage_backend)
                VALUES (?, ?, ?, ?, ?, ?, ?)
              `);

              for (const payment of booking.finance.payments) {
                paymentStmt.run(
                  booking.id,
                  payment.date,
                  safeNumber(payment.amount),
                  payment.note || null,
                  payment.proof_filename || null,
                  payment.proof_url || null,
                  payment.storage_backend || 'local'
                );
              }
            }

            // Update add-ons
            if (booking.addons) {
              setBookingAddons(booking.id, booking.addons.map(addon => ({
                addon_id: addon.addon_id,
                quantity: addon.quantity,
                price: safeNumber(addon.price_at_booking)
              })));
            } else {
              // Clear add-ons if not provided
              setBookingAddons(booking.id, []);
            }
          });

          transaction();
        },
        async () => {
          // Rollback logic
          logger.warn('Transaction rolled back for updateBooking', { bookingId: booking.id });
        }
      );
    }
  );

  if (!result.success) {
    logger.error('Failed to update booking', { bookingId: booking.id, error: result.error }, undefined, undefined, undefined);
    throw new AppError('Failed to update booking', 500, 'BOOKING_UPDATE_FAILED', result.error);
  }

  logger.audit('UPDATE_BOOKING', `booking:${booking.id}`, booking.customer.name, {
    bookingId: booking.id,
    date: booking.booking.date,
    status: booking.status
  });
}

/**
 * Delete a booking
 */
export function deleteBooking(id: string): void {
  const db = getDb();

  // Payments will be deleted automatically due to CASCADE
  const stmt = db.prepare('DELETE FROM bookings WHERE id = ?');
  stmt.run(id);
}

/**
 * Get bookings by status
 */
export function getBookingsByStatus(status: 'Active' | 'Completed' | 'Cancelled'): Booking[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM bookings WHERE status = ? ORDER BY created_at DESC');
  const rows = stmt.all(status) as any[];

  return rows.map(row => {
    const payments = getPaymentsForBooking(row.id);
    const addons = getBookingAddons(row.id);
    const rescheduleHistory = getRescheduleHistory(row.id);
    return rowToBooking(row, payments, addons, rescheduleHistory);
  });
}

/**
 * Search bookings by customer name or whatsapp
 */
export function searchBookings(query: string): Booking[] {
  const db = getDb();
  const searchPattern = `%${query}%`;

  const stmt = db.prepare(`
    SELECT * FROM bookings
    WHERE customer_name LIKE ? OR customer_whatsapp LIKE ?
    ORDER BY created_at DESC
  `);

  const rows = stmt.all(searchPattern, searchPattern) as any[];

  return rows.map(row => {
    const payments = getPaymentsForBooking(row.id);
    const addons = getBookingAddons(row.id);
    const rescheduleHistory = getRescheduleHistory(row.id);
    return rowToBooking(row, payments, addons, rescheduleHistory);
  });
}

/**
 * Check if a time slot is available (no double booking)
 * Excludes the given booking ID from the check (for rescheduling)
 */
export function checkSlotAvailability(
  date: string,
  excludeBookingId?: string
): boolean {
  const db = getDb();

  // Check if there are any active or rescheduled bookings at this time
  const stmt = db.prepare(`
    SELECT COUNT(*) as count
    FROM bookings
    WHERE booking_date = ?
      AND status IN ('Active', 'Rescheduled')
      AND id != ?
  `);

  const result = stmt.get(date, excludeBookingId || '') as any;
  return result.count === 0;
}

/**
 * Ads Data Interface for Meta Ads metrics
 */
export interface AdsData {
  spend: number;
  impressions: number;
  inlineLinkClicks: number;
  reach: number;
  date_start?: string;
  date_end?: string;
}

/**
 * Database row interface for ads_performance_log table
 */
interface AdsLogRow {
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
  date_record: string;
  updated_at: string;
}

/**
 * Check if a date range represents a full month
 */
function isFullMonthQuery(startDate: string, endDate: string): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Check if start is first day of month
  if (start.getDate() !== 1) {
    return false;
  }

  // Check if both dates are in the same month
  if (start.getMonth() !== end.getMonth() || start.getFullYear() !== end.getFullYear()) {
    return false;
  }

  // Check if end is last day of that month
  const lastDayOfMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
  return end.getDate() === lastDayOfMonth;
}

/**
 * Save Meta Ads performance data to database
 * Uses INSERT OR REPLACE to update existing records for the same month
 * Only saves data if it represents a full month to prevent partial data overwrite
 */
export function saveAdsLog(data: AdsData): void {
  const db = getDb();

  // Validate data - check for negative values
  if (data.spend < 0 || data.impressions < 0 || data.inlineLinkClicks < 0 || data.reach < 0) {
    logger.warn('Invalid ads data - negative values detected, skipping save', {
      spend: data.spend,
      impressions: data.impressions,
      clicks: data.inlineLinkClicks,
      reach: data.reach
    });
    return;
  }

  // Skip saving if no activity data
  if (data.impressions === 0 && data.spend === 0 && data.inlineLinkClicks === 0) {
    logger.debug('Skipping save - no activity data', {
      date_start: data.date_start,
      date_end: data.date_end
    });
    return;
  }

  // Only save if we have a full month of data to prevent partial data overwrite
  if (data.date_start && data.date_end) {
    if (!isFullMonthQuery(data.date_start, data.date_end)) {
      logger.debug('Skipping save - not a full month query', {
        date_start: data.date_start,
        date_end: data.date_end,
        reason: 'Only full month data is saved to maintain consistency'
      });
      return;
    }
  }

  // Extract month from date_start or use current month
  let dateRecord: string;
  if (data.date_start) {
    // Use the first day of the month from date_start
    const date = new Date(data.date_start);
    dateRecord = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
  } else {
    // Use current month's first day
    const now = new Date();
    dateRecord = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  }

  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO ads_performance_log (
        date_record, spend, impressions, clicks, reach, updated_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.run(
      dateRecord,
      data.spend,
      data.impressions,
      data.inlineLinkClicks,
      data.reach
    );

    logger.info('Saved ads performance log', {
      date_record: dateRecord,
      spend: data.spend,
      impressions: data.impressions,
      clicks: data.inlineLinkClicks,
      reach: data.reach
    });
  } catch (error) {
    logger.error('Failed to save ads performance log', {
      error: error instanceof Error ? error.message : String(error),
      date_record: dateRecord,
      data
    });
    throw error;
  }
}

/**
 * Get ads performance data for a specific month or date range
 * @param dateRecord - Specific month to retrieve (YYYY-MM-01 format)
 * @param startDate - Start date for range query
 * @param endDate - End date for range query
 * @param limit - Maximum number of records to return (default: 12 months)
 * @returns Array of ads performance data
 */
export function getAdsLog(
  dateRecord?: string,
  startDate?: string,
  endDate?: string,
  limit: number = 12
): AdsData[] {
  try {
    const db = getDb();

    // Helper function to map database row to AdsData
    const mapRowToAdsData = (row: AdsLogRow): AdsData => ({
      spend: row.spend,
      impressions: row.impressions,
      inlineLinkClicks: row.clicks,
      reach: row.reach,
      date_start: row.date_record,
      date_end: row.date_record
    });

    if (dateRecord) {
      // Get specific month
      const stmt = db.prepare(`
        SELECT spend, impressions, clicks, reach, date_record, updated_at
        FROM ads_performance_log
        WHERE date_record = ?
        ORDER BY updated_at DESC
        LIMIT 1
      `);
      const rows = stmt.all(dateRecord) as AdsLogRow[];
      return rows.map(mapRowToAdsData);
    } else if (startDate && endDate) {
      // Get date range
      const stmt = db.prepare(`
        SELECT spend, impressions, clicks, reach, date_record, updated_at
        FROM ads_performance_log
        WHERE date_record >= ? AND date_record <= ?
        ORDER BY date_record ASC
      `);
      const rows = stmt.all(startDate, endDate) as AdsLogRow[];
      return rows.map(mapRowToAdsData);
    } else {
      // Get recent records with LIMIT to prevent unbounded results
      const stmt = db.prepare(`
        SELECT spend, impressions, clicks, reach, date_record, updated_at
        FROM ads_performance_log
        ORDER BY date_record DESC
        LIMIT ?
      `);
      const rows = stmt.all(limit) as AdsLogRow[];
      return rows.map(mapRowToAdsData);
    }
  } catch (error) {
    logger.error('Failed to retrieve ads performance log', {
      error: error instanceof Error ? error.message : String(error),
      dateRecord,
      startDate,
      endDate,
      limit
    });
    // Return empty array instead of throwing to prevent UI breakage
    return [];
  }
}
