/**
 * SQLite-based storage layer for bookings
 * Replaces the file-based JSON storage with a proper database
 */

import getDb from './db';
import type Database from 'better-sqlite3';

export interface Payment {
  date: string;
  amount: number;
  note: string;
  proof_filename?: string;
}

export interface Booking {
  id: string;
  created_at: string;
  status: 'Active' | 'Completed' | 'Cancelled';
  customer: {
    name: string;
    whatsapp: string;
    category: string;
  };
  booking: {
    date: string;
    notes: string;
    location_link: string;
  };
  finance: {
    total_price: number;
    payments: Payment[];
  };
}

/**
 * Convert database row to Booking object
 */
function rowToBooking(row: any, payments: Payment[]): Booking {
  return {
    id: row.id,
    created_at: row.created_at,
    status: row.status,
    customer: {
      name: row.customer_name,
      whatsapp: row.customer_whatsapp,
      category: row.customer_category,
    },
    booking: {
      date: row.booking_date,
      notes: row.booking_notes || '',
      location_link: row.booking_location_link || '',
    },
    finance: {
      total_price: row.total_price,
      payments,
    },
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
 * Read all bookings
 */
export function readData(): Booking[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM bookings ORDER BY created_at DESC');
  const rows = stmt.all() as any[];

  return rows.map(row => {
    const payments = getPaymentsForBooking(row.id);
    return rowToBooking(row, payments);
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
  return rowToBooking(row, payments);
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
        customer_name, customer_whatsapp, customer_category,
        booking_date, booking_notes, booking_location_link,
        total_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        booking.booking.date,
        booking.booking.notes || null,
        booking.booking.location_link || null,
        booking.finance.total_price
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
        customer_name, customer_whatsapp, customer_category,
        booking_date, booking_notes, booking_location_link,
        total_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      booking.id,
      booking.created_at,
      booking.status,
      booking.customer.name,
      booking.customer.whatsapp,
      booking.customer.category,
      booking.booking.date,
      booking.booking.notes || null,
      booking.booking.location_link || null,
      booking.finance.total_price
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
        booking_date = ?,
        booking_notes = ?,
        booking_location_link = ?,
        total_price = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      booking.status,
      booking.customer.name,
      booking.customer.whatsapp,
      booking.customer.category,
      booking.booking.date,
      booking.booking.notes || null,
      booking.booking.location_link || null,
      booking.finance.total_price,
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
    return rowToBooking(row, payments);
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
    return rowToBooking(row, payments);
  });
}
