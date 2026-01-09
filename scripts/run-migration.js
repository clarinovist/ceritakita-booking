
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Configuration
const DB_PATH = path.join(process.cwd(), 'data', 'bookings.db');
const MIGRATION_PATH = path.join(__dirname, 'migrate-settings.sql');

console.log('🔄 Sytem Settings Migration Tool');
console.log('--------------------------------');
console.log(`Database: ${DB_PATH}`);
console.log(`Migration: ${MIGRATION_PATH}`);

if (!fs.existsSync(DB_PATH)) {
    console.error('❌ Error: Database file not found!');
    process.exit(1);
}

if (!fs.existsSync(MIGRATION_PATH)) {
    console.error('❌ Error: Migration file not found!');
    process.exit(1);
}

try {
    const db = new Database(DB_PATH);
    const sql = fs.readFileSync(MIGRATION_PATH, 'utf-8');

    console.log('Running migration...');

    // Execute the SQL script
    db.exec(sql);

    console.log('✅ Migration executed successfully!');

    // Optional: Verify count
    const count = db.prepare('SELECT COUNT(*) as count FROM system_settings').get();
    console.log(`📊 Total settings keys currently in DB: ${count.count}`);

} catch (error) {
    console.error('❌ Migration Failed:', error.message);
    process.exit(1);
}
