/**
 * Migration Script: Convert JSON file database to SQLite
 *
 * This script migrates all booking data from data/db.txt (JSON)
 * to the new SQLite database (data/bookings.db)
 *
 * Usage: npx tsx scripts/migrate-to-sqlite.ts
 */

import fs from 'fs';
import path from 'path';
import { createBooking, readData as readSQLite } from '../lib/storage-sqlite';
import type { Booking } from '../lib/storage-sqlite';

const JSON_DB_PATH = path.join(process.cwd(), 'data', 'db.txt');
const SQLITE_DB_PATH = path.join(process.cwd(), 'data', 'bookings.db');

console.log('=== SQLite Migration Tool ===\n');

// Check if JSON file exists
if (!fs.existsSync(JSON_DB_PATH)) {
  console.log('ℹ️  No JSON database found at:', JSON_DB_PATH);
  console.log('✅ Nothing to migrate. SQLite database is ready to use.\n');
  process.exit(0);
}

// Check if SQLite database already has data
const existingBookings = readSQLite();
if (existingBookings.length > 0) {
  console.log('⚠️  SQLite database already contains data!');
  console.log(`   Found ${existingBookings.length} existing booking(s)\n`);
  console.log('Options:');
  console.log('1. Delete data/bookings.db to start fresh');
  console.log('2. The migration will append to existing data\n');

  const answer = process.argv.includes('--force');
  if (!answer) {
    console.log('Run with --force to proceed with migration (will append data)');
    process.exit(1);
  }
}

// Read JSON data
console.log('📖 Reading JSON database...');
const jsonData = JSON.parse(fs.readFileSync(JSON_DB_PATH, 'utf-8')) as Booking[];
console.log(`   Found ${jsonData.length} booking(s)\n`);

if (jsonData.length === 0) {
  console.log('✅ No bookings to migrate. Database is empty.\n');
  process.exit(0);
}

// Create backup
const backupPath = `${JSON_DB_PATH}.backup.${Date.now()}`;
console.log('💾 Creating backup...');
fs.copyFileSync(JSON_DB_PATH, backupPath);
console.log(`   Backup saved to: ${backupPath}\n`);

// Migrate data
console.log('🔄 Migrating bookings to SQLite...\n');

let successCount = 0;
let errorCount = 0;
const errors: Array<{ booking: string; error: string }> = [];

for (const booking of jsonData) {
  try {
    console.log(`   Processing: ${booking.customer.name} (${booking.id})`);

    // Clean up old proof_base64 fields if present
    const cleanedPayments = booking.finance.payments.map((payment: any) => {
      const { proof_base64, ...rest } = payment;
      return rest;
    });

    const cleanedBooking: Booking = {
      ...booking,
      finance: {
        ...booking.finance,
        payments: cleanedPayments
      }
    };

    createBooking(cleanedBooking);
    successCount++;
  } catch (error) {
    errorCount++;
    const errorMsg = error instanceof Error ? error.message : String(error);
    errors.push({
      booking: `${booking.customer.name} (${booking.id})`,
      error: errorMsg
    });
    console.error(`   ❌ Error: ${errorMsg}`);
  }
}

console.log('\n=== MIGRATION COMPLETE ===\n');
console.log(`✅ Successfully migrated: ${successCount} booking(s)`);
if (errorCount > 0) {
  console.log(`❌ Failed: ${errorCount} booking(s)\n`);
  console.log('Errors:');
  errors.forEach((err, idx) => {
    console.log(`${idx + 1}. ${err.booking}`);
    console.log(`   ${err.error}\n`);
  });
}

console.log('\n📊 Verification:');
const finalBookings = readSQLite();
console.log(`   Total bookings in SQLite: ${finalBookings.length}`);

console.log('\n📁 Files:');
console.log(`   JSON backup: ${backupPath}`);
console.log(`   SQLite database: ${SQLITE_DB_PATH}`);

console.log('\n✨ Migration complete! Your app now uses SQLite.\n');
console.log('Next steps:');
console.log('1. Test your application to ensure everything works');
console.log('2. If everything looks good, you can delete the JSON backup');
console.log('3. The old data/db.txt file is no longer used\n');
