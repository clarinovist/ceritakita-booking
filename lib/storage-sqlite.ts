/**
 * SQLite-based storage layer for bookings
 * Replaces the file-based JSON storage with a proper database
 */

import 'server-only';
import getDb from './db';
import { getBookingAddons, setBookingAddons, type BookingAddon } from './addons';
import { logger, AppError } from './logger';
import { normalizeBookingStatus, safeString, safeNumber, executeTransaction } from './type-utils';

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

interface BookingRow {
  id: string;
  created_at: string;
  status: string;
  customer_name: string;
  customer_whatsapp: string;
  customer_category: string;
  customer_service_id?: string | null;
  booking_date: string;
  booking_notes?: string | null;
  booking_location_link?: string | null;
  total_price: number;
  service_base_price?: number | null;
  base_discount?: number | null;
  addons_total?: number | null;
  coupon_discount?: number | null;
  coupon_code?: string | null;
  photographer_id?: string | null;
}

interface PaymentRow {
  date: string;
  amount: number;
  note?: string | null;
  proof_filename?: string | null;
  proof_url?: string | null;
  storage_backend?: string | null;
}

interface RescheduleHistoryRow {
  id: number;
  old_date: string;
  new_date: string;
  rescheduled_at: string;
  reason?: string | null;
}

/**
 * Convert database row to Booking object with type safety
 */
function rowToBooking(row: BookingRow, payments: Payment[], addons?: BookingAddon[], rescheduleHistory?: RescheduleHistory[]): Booking {
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

  const rows = stmt.all(bookingId) as PaymentRow[];
  return rows.map(row => ({
    date: row.date,
    amount: row.amount,
    note: row.note || '',
    ...(row.proof_filename && { proof_filename: row.proof_filename }),
    ...(row.proof_url && { proof_url: row.proof_url }),
    ...(row.storage_backend && { storage_backend: row.storage_backend as 'local' | 'b2' }),
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

  const rows = stmt.all(bookingId) as RescheduleHistoryRow[];
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
  const rows = stmt.all() as BookingRow[];

  logger.info('Retrieved bookings from database', { count: rows.length });

  return rows.map(row => {
    const payments = getPaymentsForBooking(String(row.id));
    const addons = getBookingAddons(String(row.id));
    const rescheduleHistory = getRescheduleHistory(String(row.id));
    return rowToBooking(row, payments, addons, rescheduleHistory);
  });
}

/**
 * Read a single booking by ID
 */
export function readBooking(id: string): Booking | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM bookings WHERE id = ?');
  const row = stmt.get(id) as BookingRow | undefined;

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

  const result = await executeTransaction(
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

  const result = await executeTransaction(
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
  const rows = stmt.all(status) as BookingRow[];

  return rows.map(row => {
    const payments = getPaymentsForBooking(String(row.id));
    const addons = getBookingAddons(String(row.id));
    const rescheduleHistory = getRescheduleHistory(String(row.id));
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

  const rows = stmt.all(searchPattern, searchPattern) as BookingRow[];

  return rows.map(row => {
    const payments = getPaymentsForBooking(String(row.id));
    const addons = getBookingAddons(String(row.id));
    const rescheduleHistory = getRescheduleHistory(String(row.id));
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

  const result = stmt.get(date, excludeBookingId || '') as { count: number };
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
  updated_at?: string;  // Added for history tracking
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
 * Save Meta Ads performance data to database with DAILY granularity
 * Uses INSERT OR REPLACE to upsert daily records
 * Each dashboard load will update today's data
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

  // Allow saving even if zero data for daily tracking continuity
  // This helps maintain a complete daily timeline

  // Use date_start as the record date (YYYY-MM-DD format)
  // If not provided, use today's date
  let dateRecord: string;
  if (data.date_start) {
    // Use the actual date from the API response
    dateRecord = data.date_start;
  } else {
    // Fallback to today's date
    const now = new Date();
    dateRecord = now.toISOString().split('T')[0] || '';
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

    logger.info('Saved daily ads performance log', {
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
 * Backfill historical ads data for the last N days
 * This is a one-time operation to populate historical daily data
 * @param accessToken - Meta access token
 * @param adAccountId - Meta ad account ID
 * @param days - Number of days to backfill (default: 30)
 * @param apiVersion - Meta API version (default: v19.0)
 * @returns Object with success status and number of days backfilled
 */
export async function backfillAdsHistory(
  accessToken: string,
  adAccountId: string,
  days: number = 30,
  apiVersion: string = 'v19.0'
): Promise<{ success: boolean; daysBackfilled: number; errors: string[] }> {
  const errors: string[] = [];
  let daysBackfilled = 0;

  logger.info('Starting ads history backfill', { days });

  try {
    const today = new Date();
    const url = `https://graph.facebook.com/${apiVersion}/${adAccountId}/insights`;

    // Fetch data for each day in the past N days
    for (let i = days - 1; i >= 0; i--) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - i);
      const dateStr = targetDate.toISOString().split('T')[0];

      try {
        const params = new URLSearchParams({
          access_token: accessToken,
          fields: 'spend,impressions,inline_link_clicks,reach',
          time_range: JSON.stringify({ since: dateStr, until: dateStr }),
          level: 'account',
        });

        const apiUrl = `${url}?${params.toString()}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          errors.push(`${dateStr}: ${errorData?.error?.message || 'API error'}`);
          logger.warn('Backfill API error for date', { date: dateStr, error: errorData });
          continue;
        }

        const data = await response.json();

        // Extract data or use zeros if no data
        const insights = data.data?.[0];
        const adsData: AdsData = {
          spend: parseFloat(insights?.spend || '0'),
          impressions: parseInt(insights?.impressions || '0'),
          inlineLinkClicks: parseInt(insights?.inline_link_clicks || '0'),
          reach: parseInt(insights?.reach || '0'),
          date_start: dateStr,
          date_end: dateStr,
        };

        // Save to database
        saveAdsLog(adsData);
        daysBackfilled++;

        // Small delay to avoid rate limiting (100ms between requests)
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (dayError) {
        const errMsg = dayError instanceof Error ? dayError.message : String(dayError);
        errors.push(`${dateStr}: ${errMsg}`);
        logger.error('Backfill error for specific day', { date: dateStr, error: errMsg });
      }
    }

    logger.info('Completed ads history backfill', {
      daysBackfilled,
      totalDays: days,
      errors: errors.length
    });

    return {
      success: errors.length < days, // Success if at least some days were backfilled
      daysBackfilled,
      errors
    };

  } catch (error) {
    logger.error('Backfill operation failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    return {
      success: false,
      daysBackfilled,
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
}

/**
 * Get ads performance data for a specific day or date range
 * @param dateRecord - Specific day to retrieve (YYYY-MM-DD format)
 * @param startDate - Start date for range query (YYYY-MM-DD)
 * @param endDate - End date for range query (YYYY-MM-DD)
 * @param limit - Maximum number of records to return (default: 30 days)
 * @returns Array of ads performance data
 */
export function getAdsLog(
  dateRecord?: string,
  startDate?: string,
  endDate?: string,
  limit: number = 30
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
      date_end: row.date_record,
      updated_at: row.updated_at  // Include updated_at for history tracking
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

/**
 * System Settings Interface
 */
export interface SystemSettings {
  site_name: string;
  site_logo: string;
  business_phone: string;
  business_address: string;
  [key: string]: string;
}

/**
 * Get all system settings as an object
 */
export function getSystemSettings(): SystemSettings {
  const db = getDb();
  const stmt = db.prepare('SELECT key, value FROM system_settings ORDER BY key');
  const rows = stmt.all() as Array<{ key: string; value: string }>;

  const settings: SystemSettings = {
    site_name: 'Cerita Kita',
    site_logo: '/images/default-logo.png',
    business_phone: '+62 812 3456 7890',
    business_address: 'Jalan Raya No. 123, Jakarta',
    whatsapp_admin_number: '+62 812 3456 7890',
    whatsapp_message_template: 'Halo {{customer_name}}!\n\nBooking Anda untuk {{service}} pada {{date}} pukul {{time}} telah dikonfirmasi.\n\nTotal: Rp {{total_price}}\nID Booking: {{booking_id}}\n\nTerima kasih telah memilih Cerita Kita!'
  };

  // Override with database values
  rows.forEach(row => {
    settings[row.key] = row.value;
  });

  return settings;
}

/**
 * Get a single system setting by key
 */
export function getSystemSetting(key: string): string | null {
  const db = getDb();
  const stmt = db.prepare('SELECT value FROM system_settings WHERE key = ?');
  const result = stmt.get(key) as { value: string } | undefined;
  return result ? result.value : null;
}

/**
 * Update system settings (supports batch updates)
 * Includes audit trail logging
 */
export function updateSystemSettings(settings: Record<string, string>, updatedBy: string = 'system'): void {
  const db = getDb();

  const selectStmt = db.prepare('SELECT value FROM system_settings WHERE key = ?');
  const updateStmt = db.prepare(`
    INSERT OR REPLACE INTO system_settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `);
  const auditStmt = db.prepare(`
    INSERT INTO system_settings_audit (key, old_value, new_value, updated_by, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  const transaction = db.transaction(() => {
    Object.entries(settings).forEach(([key, value]) => {
      // Get old value for audit trail
      const oldRow = selectStmt.get(key) as { value: string } | undefined;
      const oldValue = oldRow ? oldRow.value : null;

      // Update setting
      updateStmt.run(key, value);

      // Log change to audit table
      auditStmt.run(key, oldValue, value, updatedBy);

      logger.info(`Setting updated: ${key}`, {
        oldValue: oldValue || '(none)',
        newValue: value,
        updatedBy
      });
    });
  });

  transaction();
}

/**
 * Initialize system settings with defaults (if not exists)
 */
export function initializeSystemSettings(): void {
  const db = getDb();
  const defaults: Record<string, string> = {
    site_name: 'Cerita Kita',
    site_logo: '/images/default-logo.png',
    business_phone: '+62 812 3456 7890',
    business_address: 'Jalan Raya No. 123, Jakarta',
    whatsapp_admin_number: '+62 812 3456 7890',
    whatsapp_message_template: 'Halo {{customer_name}}!\n\nBooking Anda untuk {{service}} pada {{date}} pukul {{time}} telah dikonfirmasi.\n\nTotal: Rp {{total_price}}\nID Booking: {{booking_id}}\n\nTerima kasih telah memilih Cerita Kita!'
  };

  const checkStmt = db.prepare('SELECT key FROM system_settings WHERE key = ?');
  const insertStmt = db.prepare('INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)');

  const transaction = db.transaction(() => {
    Object.entries(defaults).forEach(([key, value]) => {
      const exists = checkStmt.get(key);
      if (!exists) {
        insertStmt.run(key, value);
      }
    });
  });

  transaction();
}
