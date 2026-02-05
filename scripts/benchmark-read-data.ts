
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
  const { readData } = await import('../lib/repositories/bookings');
  const { getDb } = await import('../lib/db');

  const db = getDb();
  const TEST_COUNT = 3000;
  const ids: string[] = [];
  const addonId = randomUUID();

  console.log(`Preparing to seed ${TEST_COUNT} bookings...`);

  // Ensure an addon exists
  try {
    db.prepare("INSERT INTO addons (id, name, price, is_active) VALUES (?, 'Test Addon', 10000, 1)").run(addonId);
  } catch (e) {
      // ignore
  }

  const now = new Date().toISOString();

  // Create booking objects for writeData
  // We use writeData or direct SQL. direct SQL is faster for seeding.
  // existing benchmark used transaction with direct SQL. Let's do that for speed.

  const insert = db.transaction(() => {
    for (let i = 0; i < TEST_COUNT; i++) {
      const id = randomUUID();
      ids.push(id);
      db.prepare(`
        INSERT INTO bookings (
          id, created_at, status, customer_name, customer_whatsapp, customer_category, booking_date, total_price
        ) VALUES (?, ?, 'Active', ?, ?, ?, ?, ?)
      `).run(
        id, now, `Test Customer ${i}`, '08123456789', 'Wedding', now, 1000000
      );
      // Payments
      const payStmt = db.prepare(`INSERT INTO payments (booking_id, date, amount, note) VALUES (?, ?, ?, ?)`);
      payStmt.run(id, now, 500000, 'DP');
      payStmt.run(id, now, 500000, 'Final');
      // Addons
      db.prepare(`INSERT INTO booking_addons (booking_id, addon_id, quantity, price_at_booking) VALUES (?, ?, 1, 10000)`).run(id, addonId);
    }
  });

  insert();
  console.log('Seeding complete.');

  // Warmup
  console.log('Warming up...');
  readData(undefined, undefined, undefined);

  // Measure Full Fetch
  console.log('Starting measurement (Full Fetch)...');
  const startFull = performance.now();
  const allBookings = readData(); // Fetch all
  const endFull = performance.now();
  const timeFull = endFull - startFull;

  console.log(`[Baseline] Fetched ${allBookings.length} bookings.`);
  console.log(`[Baseline] Time taken: ${timeFull.toFixed(2)}ms`);

  // Future measurement for pagination (placeholder)
  // We will uncomment this or add logic here after implementation to verify

  console.log('Starting measurement (Paginated Fetch - Page 1, Limit 50)...');
  const startPage = performance.now();
  // @ts-ignore
  const pageBookings = readData(undefined, undefined, undefined, 1, 50);
  const endPage = performance.now();
  const timePage = endPage - startPage;

  console.log(`[Optimized] Fetched ${pageBookings.length} bookings.`);
  console.log(`[Optimized] Time taken: ${timePage.toFixed(2)}ms`);
  console.log(`Improvement: ${(timeFull / timePage).toFixed(2)}x faster`);

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

benchmark().catch(err => {
    console.error(err);
    process.exit(1);
});
