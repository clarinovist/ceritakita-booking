
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
  const COUNT_PER_STATUS = 1000;
  const STATUSES = ['Active', 'Completed', 'Cancelled'];
  const ids: string[] = [];

  console.log(`Preparing to seed ${COUNT_PER_STATUS * STATUSES.length} bookings...`);

  const insert = db.transaction(() => {
    for (const status of STATUSES) {
        for (let i = 0; i < COUNT_PER_STATUS; i++) {
          const id = randomUUID();
          ids.push(id);
          // Distribute dates over last 365 days
          const daysAgo = Math.floor(Math.random() * 365);
          const date = new Date();
          date.setDate(date.getDate() - daysAgo);
          const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

          db.prepare(`
            INSERT INTO bookings (
              id, created_at, status, customer_name, customer_whatsapp, customer_category, booking_date, total_price
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            id, new Date().toISOString(), status, `Test Customer ${status} ${i}`, '08123456789', 'Wedding', dateStr, 1000000
          );

          // Add some payments to make it realistic (as readData fetches them)
           db.prepare(`INSERT INTO payments (booking_id, date, amount, note) VALUES (?, ?, ?, ?)`)
             .run(id, new Date().toISOString(), 500000, 'DP');
        }
    }
  });

  insert();
  console.log('Seeding complete.');

  // Test Case: Filter 'Active' bookings in the last 30 days
  const targetStatus = 'Active';
  const endDate = new Date().toISOString().split('T')[0];
  const startDateObj = new Date();
  startDateObj.setDate(startDateObj.getDate() - 30);
  const startDate = startDateObj.toISOString().split('T')[0];

  console.log(`\n--- Baseline: In-Memory Filtering ---`);
  console.log(`Filtering for Status: ${targetStatus}, Date: ${startDate} to ${endDate}`);

  const startBaseline = performance.now();

  // Current implementation logic in app/api/export/bookings/route.ts
  // 1. Fetch all bookings (no args)
  let bookings = readData();
  const afterFetch = performance.now();

  // 2. Apply filters in memory
  bookings = bookings.filter(b => b.status === targetStatus);
  bookings = bookings.filter(b => {
    const bDate = b.booking.date.split('T')[0] ?? '';
    return bDate >= startDate && bDate <= endDate;
  });

  const endBaseline = performance.now();

  console.log(`Found ${bookings.length} bookings.`);
  console.log(`Total Time: ${(endBaseline - startBaseline).toFixed(2)}ms`);
  console.log(`  Fetch Time: ${(afterFetch - startBaseline).toFixed(2)}ms`);
  console.log(`  Filter Time: ${(endBaseline - afterFetch).toFixed(2)}ms`);

  console.log(`\n--- Optimized: Database Filtering ---`);
  console.log(`Filtering for Status: ${targetStatus}, Date: ${startDate} to ${endDate}`);

  const startOptimized = performance.now();

  // Optimized implementation
  // Passing filters directly to DB
  // @ts-ignore
  const optimizedBookings = readData(startDate, endDate, targetStatus);

  const endOptimized = performance.now();

  console.log(`Found ${optimizedBookings.length} bookings.`);
  console.log(`Total Time: ${(endOptimized - startOptimized).toFixed(2)}ms`);

  // Verify results match
  if (bookings.length !== optimizedBookings.length) {
     console.error(`❌ Mismatch! Baseline found ${bookings.length}, Optimized found ${optimizedBookings.length}`);
  } else {
     console.log(`✅ Results match.`);
  }

  // Cleanup
  console.log('\nCleaning up...');
  const cleanup = db.transaction(() => {
      // Chunk deletion to avoid "too many SQL variables"
      const chunkSize = 900;
      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);
        const chunkPlaceholders = chunk.map(() => '?').join(',');
        db.prepare(`DELETE FROM bookings WHERE id IN (${chunkPlaceholders})`).run(...chunk);
      }
  });
  cleanup();

  console.log('Done.');
  process.exit(0);
}

benchmark();
