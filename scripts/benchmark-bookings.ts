
import Module from 'module';
import { randomUUID } from 'crypto';

// Mock server-only
// @ts-ignore
const originalRequire = Module.prototype.require;
// @ts-ignore
Module.prototype.require = function(id) {
  if (id === 'server-only') {
    return {};
  }
  // @ts-ignore
  return originalRequire.apply(this, arguments);
};

async function benchmark() {
  const { getBookingsByStatus } = await import('../lib/storage-sqlite');
  const { getDb } = await import('../lib/db');

  const db = getDb();
  // Using 100 to be reasonable, 200 was fine but I want it fast enough
  const TEST_COUNT = 2000;
  const ids: string[] = [];

  console.log(`Preparing to seed ${TEST_COUNT} bookings...`);

  const addonId = randomUUID();
  try {
    db.prepare("INSERT INTO addons (id, name, price, is_active) VALUES (?, 'Test Addon', 10000, 1)").run(addonId);
  } catch (e) {
      // ignore
  }

  const insert = db.transaction(() => {
    for (let i = 0; i < TEST_COUNT; i++) {
      const id = randomUUID();
      ids.push(id);
      db.prepare(`
        INSERT INTO bookings (
          id, created_at, status, customer_name, customer_whatsapp, customer_category, booking_date, total_price
        ) VALUES (?, ?, 'Active', ?, ?, ?, ?, ?)
      `).run(
        id, new Date().toISOString(), `Test Customer ${i}`, '08123456789', 'Wedding', new Date().toISOString(), 1000000
      );
      // Payments
      const payStmt = db.prepare(`INSERT INTO payments (booking_id, date, amount, note) VALUES (?, ?, ?, ?)`);
      payStmt.run(id, new Date().toISOString(), 500000, 'DP');
      payStmt.run(id, new Date().toISOString(), 500000, 'Final');
      // Addons
      db.prepare(`INSERT INTO booking_addons (booking_id, addon_id, quantity, price_at_booking) VALUES (?, ?, 1, 10000)`).run(id, addonId);
      // Reschedule
      db.prepare(`INSERT INTO reschedule_history (booking_id, old_date, new_date, rescheduled_at, reason) VALUES (?, ?, ?, ?, ?)`).run(id, '2023-01-01', '2023-01-02', new Date().toISOString(), 'Test Reason');
    }
  });

  insert();
  console.log('Seeding complete.');

  console.log('Starting measurement...');
  const start = performance.now();
  const bookings = getBookingsByStatus('Active');
  const end = performance.now();

  console.log(`Fetched ${bookings.length} bookings.`);
  console.log(`Time taken: ${(end - start).toFixed(2)}ms`);

  // Verification
  console.log('Verifying data integrity...');
  const sampleBooking = bookings.find(b => b.finance.payments.length > 0);
  if (sampleBooking) {
    if (sampleBooking.finance.payments.length !== 2) {
      console.error(`❌ Verification Failed: Expected 2 payments, got ${sampleBooking.finance.payments.length}`);
    } else {
      console.log('✅ Payments count correct.');
    }
    if (sampleBooking.addons?.length !== 1) {
       console.error(`❌ Verification Failed: Expected 1 addon, got ${sampleBooking.addons?.length}`);
    } else {
       console.log('✅ Addons count correct.');
    }
  } else {
      console.error('❌ Verification Failed: No bookings with payments found (unexpected).');
  }

  // Cleanup
  console.log('Cleaning up...');
  const cleanup = db.transaction(() => {
      const placeholders = ids.map(() => '?').join(',');
      db.prepare(`DELETE FROM bookings WHERE id IN (${placeholders})`).run(...ids);
      db.prepare('DELETE FROM addons WHERE id = ?').run(addonId);
  });
  cleanup();

  console.log('Done.');
  process.exit(0);
}

benchmark();
