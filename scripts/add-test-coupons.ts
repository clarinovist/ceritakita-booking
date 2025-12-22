/**
 * Script to add test coupons to the database
 * Run with: npx tsx scripts/add-test-coupons.ts
 */

import { createCoupon } from '../lib/coupons';

console.log('Adding test coupons...\n');

// Percentage discount coupon
createCoupon({
  code: 'DISKON10',
  discount_type: 'percentage',
  discount_value: 10,
  min_purchase: 0,
  max_discount: 100000,
  usage_limit: 100,
  valid_from: new Date().toISOString(),
  valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  is_active: true
});
console.log('✓ Created coupon: DISKON10 (10% off, max Rp100.000)');

// Fixed amount discount coupon
createCoupon({
  code: 'HEMAT50K',
  discount_type: 'fixed',
  discount_value: 50000,
  min_purchase: 200000,
  usage_limit: 50,
  valid_from: new Date().toISOString(),
  valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  is_active: true
});
console.log('✓ Created coupon: HEMAT50K (Rp50.000 off, min purchase Rp200.000)');

// Large percentage discount
createCoupon({
  code: 'PROMO20',
  discount_type: 'percentage',
  discount_value: 20,
  min_purchase: 300000,
  max_discount: 200000,
  usage_limit: 20,
  valid_from: new Date().toISOString(),
  valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
  is_active: true
});
console.log('✓ Created coupon: PROMO20 (20% off, min purchase Rp300.000, max discount Rp200.000)');

console.log('\nTest coupons added successfully!');
console.log('\nYou can now test these coupons in the booking form:');
console.log('- DISKON10: 10% discount, maximum Rp100.000');
console.log('- HEMAT50K: Rp50.000 flat discount (minimum purchase Rp200.000)');
console.log('- PROMO20: 20% discount, minimum purchase Rp300.000');
