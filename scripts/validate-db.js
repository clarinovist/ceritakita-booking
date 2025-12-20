const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'db.txt');
const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

console.log('=== DATABASE VALIDATION ===\n');

const allIssues = [];

data.forEach((booking, idx) => {
  console.log(`Booking ${idx + 1}: ${booking.customer.name}`);
  console.log(`  ID: ${booking.id}`);
  console.log(`  Status: ${booking.status}`);
  console.log(`  Total Price: Rp ${booking.finance.total_price.toLocaleString()}`);

  const totalPaid = booking.finance.payments.reduce((sum, p) => sum + p.amount, 0);
  console.log(`  Total Paid: Rp ${totalPaid.toLocaleString()}`);
  console.log(`  Balance: Rp ${(booking.finance.total_price - totalPaid).toLocaleString()}`);

  // Check for issues
  const issues = [];

  // Issue 1: Total price is 0 but has payments
  if (booking.finance.total_price === 0 && totalPaid > 0) {
    issues.push({
      severity: 'warning',
      message: 'Total price is 0 but has payments',
      booking: booking.customer.name,
      fix: 'Set total_price to actual service price'
    });
  }

  // Issue 2: Overpaid
  if (totalPaid > booking.finance.total_price && booking.finance.total_price > 0) {
    issues.push({
      severity: 'warning',
      message: 'Payment exceeds total price',
      booking: booking.customer.name,
      fix: 'Verify total_price is correct'
    });
  }

  // Issue 3: Check payment proofs
  booking.finance.payments.forEach((payment, pidx) => {
    // Has old base64 data
    if (payment.proof_base64 !== undefined && payment.proof_base64.length > 0) {
      issues.push({
        severity: 'error',
        message: `Payment ${pidx + 1} still has base64 data (migration incomplete)`,
        booking: booking.customer.name,
        fix: 'Run migration script or remove proof_base64 field'
      });
    }

    // Empty proof_base64 field (should be removed)
    if (payment.proof_base64 !== undefined && payment.proof_base64 === '') {
      issues.push({
        severity: 'info',
        message: `Payment ${pidx + 1} has empty proof_base64 field`,
        booking: booking.customer.name,
        fix: 'Remove proof_base64 field to clean up data'
      });
    }
  });

  // Display issues
  if (issues.length > 0) {
    console.log('  Issues:');
    issues.forEach(i => {
      const icon = i.severity === 'error' ? '❌' : i.severity === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`    ${icon} ${i.message}`);
      allIssues.push(i);
    });
  } else {
    console.log('  ✅ No issues found');
  }
  console.log('');
});

console.log('=== SUMMARY ===');
console.log(`Total bookings: ${data.length}`);
console.log(`Issues found: ${allIssues.length}\n`);

if (allIssues.length > 0) {
  console.log('RECOMMENDED FIXES:');
  allIssues.forEach((issue, idx) => {
    console.log(`${idx + 1}. [${issue.booking}] ${issue.message}`);
    console.log(`   Fix: ${issue.fix}\n`);
  });
}
