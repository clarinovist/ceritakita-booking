/**
 * Migration Script: Convert base64 images to file storage
 *
 * This script migrates all payment proof images from base64 encoding
 * stored in db.txt to separate image files in the uploads directory.
 *
 * Usage: npx tsx scripts/migrate-images.ts
 */

import { readData, writeData, Booking } from '../lib/storage';
import type { Booking as BookingType } from '../lib/storage';
import { saveBase64Image } from '../lib/file-storage';
import fs from 'fs';
import path from 'path';

interface MigrationResult {
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{ bookingId: string; error: string }>;
}

async function migrateImages(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };

  console.log('🚀 Starting image migration...\n');

  try {
    // 1. Create backup of db.txt
    const DB_PATH = path.join(process.cwd(), 'data', 'db.txt');
    const BACKUP_PATH = path.join(process.cwd(), 'data', `db.txt.backup.${Date.now()}`);

    console.log('📦 Creating backup...');
    fs.copyFileSync(DB_PATH, BACKUP_PATH);
    console.log(`✅ Backup created: ${BACKUP_PATH}\n`);

    // 2. Read all bookings
    console.log('📖 Reading bookings...');
    const bookings = readData();
    console.log(`Found ${bookings.length} bookings\n`);

    // 3. Process each booking
    const updatedBookings: Booking[] = [];

    for (const booking of bookings) {
      let bookingModified = false;
      const updatedPayments = [];

      for (let idx = 0; idx < booking.finance.payments.length; idx++) {
        const payment = booking.finance.payments[idx];
        if (!payment) continue;

        // Check if has base64 proof
        if (payment.proof_base64 && payment.proof_base64.startsWith('data:image')) {
          try {
            console.log(`🔄 Processing booking ${booking.id}, payment ${idx}...`);

            // Save base64 as file
            const savedFile = await saveBase64Image(
              payment.proof_base64,
              booking.id,
              idx
            );

            // Update payment record
            updatedPayments.push({
              ...payment,
              proof_filename: savedFile.relativePath,
              proof_base64: undefined // Remove base64
            });

            bookingModified = true;
            result.success++;
            console.log(`  ✅ Saved as: ${savedFile.relativePath}`);
          } catch (error) {
            console.error(`  ❌ Failed: ${error}`);
            result.failed++;
            result.errors.push({
              bookingId: booking.id,
              error: error instanceof Error ? error.message : String(error)
            });

            // Keep original payment on error
            updatedPayments.push(payment);
          }
        } else {
          // No base64 proof or already migrated
          if (!payment.proof_base64 && !payment.proof_filename) {
            result.skipped++;
          }
          updatedPayments.push(payment);
        }
      }

      // Update booking with new payments
      if (bookingModified) {
        const updatedBooking: BookingType = {
          ...booking,
          finance: {
            ...booking.finance,
            payments: updatedPayments
          }
        };
        updatedBookings.push(updatedBooking);
      } else {
        updatedBookings.push(booking);
      }
    }

    // 4. Write updated db.txt atomically
    console.log('\n💾 Writing updated database...');
    await writeData(updatedBookings);
    console.log('✅ Database updated successfully\n');

    // 5. Print summary
    console.log('📊 Migration Summary:');
    console.log(`  ✅ Success: ${result.success}`);
    console.log(`  ❌ Failed: ${result.failed}`);
    console.log(`  ⏭️  Skipped: ${result.skipped}`);

    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach(({ bookingId, error }) => {
        console.log(`  - Booking ${bookingId}: ${error}`);
      });
    }

    console.log(`\n💾 Backup saved at: ${BACKUP_PATH}`);
    console.log('\n✨ Migration complete!\n');

    return result;
  } catch (error) {
    console.error('\n💥 Migration failed catastrophically:', error);
    throw error;
  }
}

// Run migration
migrateImages()
  .then((result) => {
    if (result.failed > 0) {
      console.log('⚠️  Migration completed with errors. Check the logs above.');
      process.exit(1);
    } else {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    }
  })
  .catch((error) => {
    console.error('💥 Fatal error during migration:', error);
    process.exit(1);
  });
