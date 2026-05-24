import DatabaseConstructor from 'better-sqlite3';

function mockSetBookingAddons(db: any, bookingId: string, addons: { addon_id: string; quantity: number; price: number }[]): void {
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM booking_addons WHERE booking_id = ?').run(bookingId);

    if (addons.length > 0) {
      const insertStmt = db.prepare(`
        INSERT INTO booking_addons (booking_id, addon_id, quantity, price_at_booking)
        VALUES (?, ?, ?, ?)
      `);

      for (const addon of addons) {
        insertStmt.run(bookingId, addon.addon_id, addon.quantity, addon.price);
      }
    }
  });

  transaction();
}

const stmtCache = new Map();

function getStmt(db: any, numParams: number) {
    if (stmtCache.has(numParams)) {
        return stmtCache.get(numParams);
    }
    // Optimization: Create the string more efficiently
    let placeholders = '(?, ?, ?, ?)';
    for (let i = 1; i < numParams; i++) {
        placeholders += ', (?, ?, ?, ?)';
    }
    const stmt = db.prepare(`
      INSERT INTO booking_addons (booking_id, addon_id, quantity, price_at_booking)
      VALUES ${placeholders}
    `);
    stmtCache.set(numParams, stmt);
    return stmt;
}

function optimizedSetBookingAddons4(db: any, bookingId: string, addons: { addon_id: string; quantity: number; price: number }[]): void {
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM booking_addons WHERE booking_id = ?').run(bookingId);

    if (addons.length > 0) {
      const chunkSize = 100;
      for (let i = 0; i < addons.length; i += chunkSize) {
        const chunkEnd = Math.min(i + chunkSize, addons.length);
        const currentChunkSize = chunkEnd - i;

        const params = new Array(currentChunkSize * 4);
        let paramIdx = 0;
        for (let j = i; j < chunkEnd; j++) {
            params[paramIdx++] = bookingId;
            params[paramIdx++] = addons[j].addon_id;
            params[paramIdx++] = addons[j].quantity;
            params[paramIdx++] = addons[j].price;
        }

        const stmt = getStmt(db, currentChunkSize);
        stmt.run(...params);
      }
    }
  });

  transaction();
}

const db = new DatabaseConstructor(':memory:');

db.exec(`
  CREATE TABLE booking_addons (
    booking_id TEXT,
    addon_id TEXT,
    quantity INTEGER,
    price_at_booking REAL
  );
`);

const bookingId = 'test-booking-id';

for (const numAddons of [5, 10, 50, 100, 500, 1000]) {
  const addons = [];
  for (let i = 0; i < numAddons; i++) {
    addons.push({ addon_id: 'test-addon-' + i, quantity: 1, price: 100 });
  }

  const iterations = 1000;

  mockSetBookingAddons(db, bookingId, addons);
  optimizedSetBookingAddons4(db, bookingId, addons);

  const startOriginal = performance.now();
  for (let i = 0; i < iterations; i++) {
    mockSetBookingAddons(db, bookingId, addons);
  }
  const endOriginal = performance.now();
  const timeOriginal = endOriginal - startOriginal;

  const startOptimized = performance.now();
  for (let i = 0; i < iterations; i++) {
    optimizedSetBookingAddons4(db, bookingId, addons);
  }
  const endOptimized = performance.now();
  const timeOptimized = endOptimized - startOptimized;

  console.log(`Addons: ${numAddons} | Original: ${timeOriginal.toFixed(2)}ms | Optimized: ${timeOptimized.toFixed(2)}ms | Improvement: ${((timeOriginal - timeOptimized) / timeOriginal * 100).toFixed(2)}%`);
}
