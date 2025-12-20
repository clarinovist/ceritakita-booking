const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'db.txt');
const backupPath = path.join(process.cwd(), 'data', `db.txt.backup.${Date.now()}`);

console.log('=== DATABASE CLEANUP ===\n');

// Create backup
console.log('📦 Creating backup...');
const originalData = fs.readFileSync(dbPath, 'utf-8');
fs.writeFileSync(backupPath, originalData);
console.log(`✅ Backup created: ${backupPath}\n`);

// Load and fix data
const data = JSON.parse(originalData);
let fixCount = 0;

console.log('🔧 Applying fixes...\n');

data.forEach((booking) => {
  console.log(`Processing: ${booking.customer.name}`);

  // Fix 1: Remove empty proof_base64 fields
  booking.finance.payments.forEach((payment, idx) => {
    if (payment.proof_base64 !== undefined) {
      if (payment.proof_base64 === '') {
        console.log(`  ✓ Removed empty proof_base64 from payment ${idx + 1}`);
        delete payment.proof_base64;
        fixCount++;
      } else if (payment.proof_base64.length > 0) {
        console.log(`  ⚠️ Payment ${idx + 1} still has base64 data - manual review needed`);
      }
    }
  });

  // Fix 2: Report total_price = 0 issues (requires manual fix)
  const totalPaid = booking.finance.payments.reduce((sum, p) => sum + p.amount, 0);
  if (booking.finance.total_price === 0 && totalPaid > 0) {
    console.log(`  ⚠️ Total price is 0 but paid ${totalPaid.toLocaleString()} - please set total_price manually`);
  }

  console.log('');
});

// Write fixed data
fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

console.log('=== SUMMARY ===');
console.log(`✅ Applied ${fixCount} automatic fixes`);
console.log(`📄 Data saved to: ${dbPath}`);
console.log(`💾 Backup saved to: ${backupPath}\n`);

console.log('⚠️ MANUAL FIXES REQUIRED:');
console.log('- Booking "Filia": Set total_price to the actual service price (currently 0)');
