
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'bookings.db');

// Initialize predefined addons with fixed IDs so they can be safely referenced in code
const predefinedAddons = [
    {
        id: "cff63d0e-9eca-49aa-9142-82195ea1d28b",
        name: "Tambah Orang",
        price: 40000,
        applicable_categories: JSON.stringify(["Pas Foto", "Self Photo", "Birthday", "Family"]),
        is_active: 1
    },
    {
        id: "ad642dfe-8538-4148-9861-89c3161938a6",
        name: "Upgrade ke Prewedding Silver",
        price: 280000,  // Selisih Bronze -> Silver
        applicable_categories: JSON.stringify(["Prewedding Bronze"]),
        is_active: 1
    },
    {
        id: "f9ec4884-95af-41e7-bbf6-fb2af429046e",
        name: "Downgrade ke Prewedding Bronze",
        price: -280000,
        applicable_categories: JSON.stringify(["Prewedding Silver"]),
        is_active: 1
    },
    {
        id: "9ee77fe3-d8bb-40a2-bc64-c71f9dd2eb2e",
        name: "Tambah Jam Foto",
        price: 200000,
        applicable_categories: JSON.stringify(["Wedding", "Prewedding Bronze", "Prewedding Silver", "Prewedding Gold"]),
        is_active: 1
    },
    {
        id: "84b453dc-2cba-4369-b034-f900c934acba",
        name: "Percepat Editing (Rush Order)",
        price: 150000,
        applicable_categories: null,
        is_active: 1
    },
    {
        id: "3eb8bfa0-16eb-431b-94fd-1290f81e4ee6",
        name: "Penyesuaian Lainnya",
        price: 0,
        applicable_categories: null,
        is_active: 1
    }
];

console.log(`Connecting to database at ${DB_PATH}...`);

try {
    const db = new Database(DB_PATH);

    // Create addons table if not exists (just in case, though app should have created it)
    db.exec(`
    CREATE TABLE IF NOT EXISTS addons (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      applicable_categories TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // Prepare migration-safe statements
    // 1. Check if addon with this fixed ID already exists
    const checkById = db.prepare('SELECT id FROM addons WHERE id = ?');

    // 2. Check if addon with this name already exists (old random UUID)
    const checkByName = db.prepare('SELECT id FROM addons WHERE name = ?');

    // 3. Migrate booking_addons references from old ID to fixed ID
    const migrateBookingAddons = db.prepare(
        'UPDATE booking_addons SET addon_id = ? WHERE addon_id = ?'
    );

    // 4. Delete old addon row (after booking_addons references migrated)
    const deleteOldAddon = db.prepare('DELETE FROM addons WHERE id = ?');

    // 5. Insert addon with fixed ID
    const insertAddon = db.prepare(`
        INSERT INTO addons (id, name, price, applicable_categories, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    let addedCount = 0;
    let migratedCount = 0;
    let skippedCount = 0;

    db.transaction(() => {
        for (const addon of predefinedAddons) {
            // Case 1: Fixed ID already in DB — nothing to do
            const byId = checkById.get(addon.id);
            if (byId) {
                console.log(`OK '${addon.name}' (fixed ID present)`);
                skippedCount++;
                continue;
            }

            // Case 2: Same name exists with old random ID — migrate
            // Order matters for FK constraints: INSERT new row first,
            // then repoint booking_addons refs, then delete old row.
            const byName = checkByName.get(addon.name);
            if (byName) {
                const oldId = byName.id;
                console.log(`Migrating '${addon.name}': ${oldId} → ${addon.id}`);

                // 1. Insert new row with fixed ID (old row still exists, different PK)
                insertAddon.run(
                    addon.id,
                    addon.name,
                    addon.price,
                    addon.applicable_categories,
                    addon.is_active
                );

                // 2. Repoint booking_addons foreign keys to the new ID
                migrateBookingAddons.run(addon.id, oldId);

                // 3. Remove old addon row (no more references to it)
                deleteOldAddon.run(oldId);

                migratedCount++;
                continue;
            }

            // Case 3: Completely new — insert fresh
            insertAddon.run(
                addon.id,
                addon.name,
                addon.price,
                addon.applicable_categories,
                addon.is_active
            );
            console.log(`Added '${addon.name}'`);
            addedCount++;
        }
    })();

    console.log(`\nDone! Added: ${addedCount}, Migrated: ${migratedCount}, Skipped: ${skippedCount}`);
    db.close();

} catch (error) {
    console.error('Error seeding addons:', error);
    process.exit(1);
}
