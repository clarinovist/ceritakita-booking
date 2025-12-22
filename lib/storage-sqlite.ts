/**
 * SQLite-based storage layer for bookings
 * Replaces the file-based JSON storage with a proper database
 */

import getDb from './db';
import type Database from 'better-sqlite3';
import { getBookingAddons, setBookingAddons, type BookingAddon } from './addons';

export interface Payment {
  date: string;
  amount: number;
  note: string;
  proof_filename?: string;
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
  status: 'Active' | 'Canceled' | 'Rescheduled' | 'Completed' | 'Cancelled';
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
 * Convert database row to Booking object
 */
function rowToBooking(row: any, payments: Payment[], addons?: BookingAddon[], rescheduleHistory?: RescheduleHistory[]): Booking {
  return {
    id: row.id,
    created_at: row.created_at,
    status: row.status,
    customer: {
      name: row.customer_name,
      whatsapp: row.customer_whatsapp,
      category: row.customer_category,
      serviceId: row.customer_service_id || undefined,
    },
    booking: {
      date: row.booking_date,
      notes: row.booking_notes || '',
      location_link: row.booking_location_link || '',
    },
    finance: {
      total_price: row.total_price,
      payments,
      service_base_price: row.service_base_price !== null ? row.service_base_price : undefined,
      base_discount: row.base_discount !== null ? row.base_discount : undefined,
      addons_total: row.addons_total !== null ? row.addons_total : undefined,
      coupon_discount: row.coupon_discount !== null ? row.coupon_discount : undefined,
      coupon_code: row.coupon_code || undefined,
    },
    photographer_id: row.photographer_id || undefined,
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
    SELECT date, amount, note, proof_filename
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
  const stmt = db.prepare('SELECT * FROM bookings ORDER BY created_at DESC');
  const rows = stmt.all() as any[];

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
 */
export function writeData(bookings: Booking[]): void {
  const db = getDb();

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
      INSERT INTO payments (booking_id, date, amount, note, proof_filename)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const booking of bookings) {
      // Insert booking
      insertBooking.run(
        booking.id,
        booking.created_at,
        booking.status,
        booking.customer.name,
        booking.customer.whatsapp,
        booking.customer.category,
        booking.customer.serviceId || null,
        booking.booking.date,
        booking.booking.notes || null,
        booking.booking.location_link || null,
        booking.finance.total_price,
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
          payment.amount,
          payment.note || null,
          payment.proof_filename || null
        );
      }
    }
  });

  transaction();
}

/**
 * Create a new booking
 */
export function createBooking(booking: Booking): void {
  const db = getDb();

  const transaction = db.transaction(() => {
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
      booking.status,
      booking.customer.name,
      booking.customer.whatsapp,
      booking.customer.category,
      booking.customer.serviceId || null,
      booking.booking.date,
      booking.booking.notes || null,
      booking.booking.location_link || null,
      booking.finance.total_price,
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
        INSERT INTO payments (booking_id, date, amount, note, proof_filename)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const payment of booking.finance.payments) {
        paymentStmt.run(
          booking.id,
          payment.date,
          payment.amount,
          payment.note || null,
          payment.proof_filename || null
        );
      }
    }

    // Insert add-ons
    if (booking.addons && booking.addons.length > 0) {
      setBookingAddons(booking.id, booking.addons.map(addon => ({
        addon_id: addon.addon_id,
        quantity: addon.quantity,
        price: addon.price_at_booking
      })));
    }
  });

  transaction();
}

/**
 * Update an existing booking
 */
export function updateBooking(booking: Booking): void {
  const db = getDb();

  const transaction = db.transaction(() => {
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
      booking.status,
      booking.customer.name,
      booking.customer.whatsapp,
      booking.customer.category,
      booking.customer.serviceId || null,
      booking.booking.date,
      booking.booking.notes || null,
      booking.booking.location_link || null,
      booking.finance.total_price,
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
        INSERT INTO payments (booking_id, date, amount, note, proof_filename)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const payment of booking.finance.payments) {
        paymentStmt.run(
          booking.id,
          payment.date,
          payment.amount,
          payment.note || null,
          payment.proof_filename || null
        );
      }
    }

    // Update add-ons
    if (booking.addons) {
      setBookingAddons(booking.id, booking.addons.map(addon => ({
        addon_id: addon.addon_id,
        quantity: addon.quantity,
        price: addon.price_at_booking
      })));
    } else {
      // Clear add-ons if not provided
      setBookingAddons(booking.id, []);
    }
  });

  transaction();
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
