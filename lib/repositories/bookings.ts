import 'server-only';
import { getDb } from '@/lib/db';
import { getBookingAddons, getBookingAddonsForBookings, setBookingAddons, type BookingAddon } from '@/lib/addons';
import { logger, AppError } from '@/lib/logger';
import { normalizeBookingStatus, safeString, safeNumber, executeTransaction } from '@/lib/type-utils';
import { Booking, Payment, RescheduleHistory } from '@/lib/types';

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
  booking_id?: string;
  date: string;
  amount: number;
  note?: string | null;
  proof_filename?: string | null;
  proof_url?: string | null;
  storage_backend?: string | null;
}

interface RescheduleHistoryRow {
  id: number;
  booking_id?: string;
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
 * Get payments for multiple bookings
 */
function getPaymentsForBookings(bookingIds: string[]): Map<string, Payment[]> {
  if (bookingIds.length === 0) return new Map();

  const db = getDb();
  const resultMap = new Map<string, Payment[]>();
  bookingIds.forEach(id => resultMap.set(id, []));

  const chunkSize = 900;
  for (let i = 0; i < bookingIds.length; i += chunkSize) {
    const chunk = bookingIds.slice(i, i + chunkSize);
    const placeholders = chunk.map(() => '?').join(',');

    const stmt = db.prepare(`
      SELECT booking_id, date, amount, note, proof_filename, proof_url, storage_backend
      FROM payments
      WHERE booking_id IN (${placeholders})
      ORDER BY date ASC, id ASC
    `);

    // We need to cast the result to include booking_id which is not in PaymentRow
    const rows = stmt.all(...chunk) as (PaymentRow & { booking_id: string })[];

    for (const row of rows) {
      const bookingId = String(row.booking_id);
      const current = resultMap.get(bookingId) || [];
      current.push({
        date: row.date,
        amount: row.amount,
        note: row.note || '',
        ...(row.proof_filename && { proof_filename: row.proof_filename }),
        ...(row.proof_url && { proof_url: row.proof_url }),
        ...(row.storage_backend && { storage_backend: row.storage_backend as 'local' | 'b2' }),
      });
      resultMap.set(bookingId, current);
    }
  }

  return resultMap;
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
 * Get reschedule history for multiple bookings
 */
function getRescheduleHistoryForBookings(bookingIds: string[]): Map<string, RescheduleHistory[]> {
  if (bookingIds.length === 0) return new Map();

  const db = getDb();
  const resultMap = new Map<string, RescheduleHistory[]>();
  bookingIds.forEach(id => resultMap.set(id, []));

  const chunkSize = 900;
  for (let i = 0; i < bookingIds.length; i += chunkSize) {
    const chunk = bookingIds.slice(i, i + chunkSize);
    const placeholders = chunk.map(() => '?').join(',');

    const stmt = db.prepare(`
      SELECT booking_id, id, old_date, new_date, rescheduled_at, reason
      FROM reschedule_history
      WHERE booking_id IN (${placeholders})
      ORDER BY rescheduled_at ASC
    `);

    const rows = stmt.all(...chunk) as (RescheduleHistoryRow & { booking_id: string })[];

    for (const row of rows) {
      const bookingId = String(row.booking_id);
      const current = resultMap.get(bookingId) || [];
      current.push({
        id: row.id,
        old_date: row.old_date,
        new_date: row.new_date,
        rescheduled_at: row.rescheduled_at,
        ...(row.reason && { reason: row.reason }),
      });
      resultMap.set(bookingId, current);
    }
  }

  return resultMap;
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
 * Read all bookings, with optional date filtering
 */
export function readData(
  startDate?: string,
  endDate?: string,
  status?: string,
  page?: number,
  limit?: number
): Booking[] {
  const db = getDb();

  let query = 'SELECT * FROM bookings';
  const params: (string | number)[] = [];
  const whereClauses: string[] = [];

  if (startDate) {
    // Optimized: Use direct comparison instead of date() function to enable index usage
    whereClauses.push('booking_date >= ?');
    params.push(startDate);
  }

  if (endDate) {
    // Optimized: Use direct comparison. booking_date (datetime) < next day (date)
    // this ensures all times on the end date are included
    whereClauses.push("booking_date < date(?, '+1 day')");
    params.push(endDate);
  }

  if (status && status !== 'All') {
    whereClauses.push('status = ?');
    params.push(status);
  }

  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }

  query += " ORDER BY ABS(julianday(booking_date) - julianday('now')) ASC";

  // Pagination
  if (limit && limit > 0) {
    query += ' LIMIT ?';
    params.push(limit);

    if (page && page > 1) {
      const offset = (page - 1) * limit;
      query += ' OFFSET ?';
      params.push(offset);
    }
  }

  const stmt = db.prepare(query);
  const rows = stmt.all(...params) as BookingRow[];

  logger.info('Retrieved bookings from database', {
    count: rows.length,
    startDate,
    endDate,
    status,
    page,
    limit
  });

  if (rows.length === 0) {
    return [];
  }

  const bookingIds = rows.map(r => String(r.id));
  const paymentsByBookingId = getPaymentsForBookings(bookingIds);
  const addonsByBookingId = getBookingAddonsForBookings(bookingIds);
  const historyByBookingId = getRescheduleHistoryForBookings(bookingIds);

  return rows.map(row => {
    const bookingId = String(row.id);
    const payments = paymentsByBookingId.get(bookingId) || [];
    const addons = addonsByBookingId.get(bookingId) || [];
    const rescheduleHistory = historyByBookingId.get(bookingId) || [];
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

  if (rows.length === 0) {
    return [];
  }

  // Batch fetch related data using subqueries for efficiency
  // This avoids the N+1 query problem by fetching all related data in just 3 additional queries

  // 1. Fetch all payments for these bookings
  const paymentsStmt = db.prepare(`
    SELECT booking_id, date, amount, note, proof_filename, proof_url, storage_backend
    FROM payments
    WHERE booking_id IN (SELECT id FROM bookings WHERE status = ?)
    ORDER BY date ASC, id ASC
  `);
  const allPayments = paymentsStmt.all(status) as PaymentRow[];

  // 2. Fetch all addons for these bookings
  const addonsStmt = db.prepare(`
    SELECT ba.booking_id, ba.addon_id, a.name as addon_name, ba.quantity, ba.price_at_booking
    FROM booking_addons ba
    JOIN addons a ON ba.addon_id = a.id
    WHERE ba.booking_id IN (SELECT id FROM bookings WHERE status = ?)
    ORDER BY a.name ASC
  `);
  // Define a local type that includes booking_id
  type BookingAddonWithId = BookingAddon & { booking_id: string };
  const allAddons = addonsStmt.all(status) as BookingAddonWithId[];

  // 3. Fetch all reschedule history
  const rescheduleStmt = db.prepare(`
    SELECT id, booking_id, old_date, new_date, rescheduled_at, reason
    FROM reschedule_history
    WHERE booking_id IN (SELECT id FROM bookings WHERE status = ?)
    ORDER BY rescheduled_at ASC
  `);
  const allRescheduleHistory = rescheduleStmt.all(status) as RescheduleHistoryRow[];

  // Group data by booking_id
  const paymentsMap = new Map<string, Payment[]>();
  const addonsMap = new Map<string, BookingAddon[]>();
  const rescheduleMap = new Map<string, RescheduleHistory[]>();

  for (const payment of allPayments) {
    if (!payment.booking_id) continue;
    const bookingId = String(payment.booking_id);
    const bookingPayments = paymentsMap.get(bookingId) || [];
    bookingPayments.push({
      date: payment.date,
      amount: payment.amount,
      note: payment.note || '',
      ...(payment.proof_filename && { proof_filename: payment.proof_filename }),
      ...(payment.proof_url && { proof_url: payment.proof_url }),
      ...(payment.storage_backend && { storage_backend: payment.storage_backend as 'local' | 'b2' }),
    });
    paymentsMap.set(bookingId, bookingPayments);
  }

  for (const addon of allAddons) {
    const bookingId = String(addon.booking_id);
    const bookingAddons = addonsMap.get(bookingId) || [];
    bookingAddons.push({
      addon_id: addon.addon_id,
      addon_name: addon.addon_name,
      quantity: addon.quantity,
      price_at_booking: addon.price_at_booking
    });
    addonsMap.set(bookingId, bookingAddons);
  }

  for (const history of allRescheduleHistory) {
    if (!history.booking_id) continue;
    const bookingId = String(history.booking_id);
    const bookingHistory = rescheduleMap.get(bookingId) || [];
    bookingHistory.push({
      id: history.id,
      old_date: history.old_date,
      new_date: history.new_date,
      rescheduled_at: history.rescheduled_at,
      ...(history.reason && { reason: history.reason }),
    });
    rescheduleMap.set(bookingId, bookingHistory);
  }

  return rows.map(row => {
    const bookingId = String(row.id);
    const payments = paymentsMap.get(bookingId) || [];
    const addons = addonsMap.get(bookingId) || [];
    const rescheduleHistory = rescheduleMap.get(bookingId) || [];
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

  if (rows.length === 0) {
    return [];
  }

  const bookingIds = rows.map(r => String(r.id));
  const paymentsByBookingId = getPaymentsForBookings(bookingIds);
  const addonsByBookingId = getBookingAddonsForBookings(bookingIds);
  const historyByBookingId = getRescheduleHistoryForBookings(bookingIds);

  return rows.map(row => {
    const payments = paymentsByBookingId.get(String(row.id)) || [];
    const addons = addonsByBookingId.get(String(row.id)) || [];
    const rescheduleHistory = historyByBookingId.get(String(row.id)) || [];
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
