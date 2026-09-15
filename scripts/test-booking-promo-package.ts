/** Run: NODE_OPTIONS=--conditions=react-server npx tsx scripts/test-booking-promo-package.ts
 * All writes use a temporary cwd/database. No live data, uploads or external APIs.
 */
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Booking, Service } from '../lib/types';
import type { Coupon } from '../lib/repositories/coupons';

async function main() {
  const cwd = process.cwd();
  const temp = mkdtempSync(join(tmpdir(), 'ck-booking-regression-'));
  mkdirSync(join(temp, 'data'));
  process.chdir(temp);
  // Notifications must never leave the test process, even if env happens to be configured.
  globalThis.fetch = async () => { throw new Error('External requests disabled in regression'); };
  for (const key of ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID', 'META_ACCESS_TOKEN', 'META_ACCESS_TOKEN_CK', 'RESEND_API_KEY']) delete process.env[key];

  let close: (() => void) | undefined;
  let checks = 0;
  function check(name: string, work: () => void) { work(); checks++; console.log(`PASS ${name}`); }
  try {
    const { evaluateCoupon } = await import('../lib/coupon-rules');
    const coupon: Coupon = { id: randomUUID(), code: 'TEST', discount_type: 'percentage', discount_value: 10, usage_count: 0, is_active: true, created_at: '' };
    check('percentage', () => assert.equal(evaluateCoupon(coupon, 200000).discount_amount, 20000));
    check('fixed capped to subtotal', () => assert.equal(evaluateCoupon({ ...coupon, discount_type: 'fixed', discount_value: 500000 }, 200000).discount_amount, 200000));
    check('percentage capped to subtotal', () => assert.equal(evaluateCoupon({ ...coupon, discount_value: 150 }, 200000).discount_amount, 200000));
    check('maximum discount', () => assert.equal(evaluateCoupon({ ...coupon, max_discount: 10000 }, 200000).discount_amount, 10000));
    check('minimum purchase', () => assert.equal(evaluateCoupon({ ...coupon, min_purchase: 300000 }, 200000).valid, false));
    check('inactive/invalid/quota', () => {
      assert.equal(evaluateCoupon(null, 100).valid, false);
      assert.equal(evaluateCoupon({ ...coupon, is_active: false }, 100).valid, false);
      assert.equal(evaluateCoupon({ ...coupon, usage_limit: 1, usage_count: 1 }, 100).valid, false);
    });
    check('full WIB end day / start day', () => {
      const dated = { ...coupon, valid_from: '2026-09-15', valid_until: '2026-09-15' };
      assert.equal(evaluateCoupon(dated, 100, Date.parse('2026-09-14T16:59:59Z')).valid, false);
      assert.equal(evaluateCoupon(dated, 100, Date.parse('2026-09-14T17:00:00Z')).valid, true);
      assert.equal(evaluateCoupon(dated, 100, Date.parse('2026-09-15T16:59:59Z')).valid, true);
      assert.equal(evaluateCoupon(dated, 100, Date.parse('2026-09-15T17:00:00Z')).valid, false);
    });
    check('invalid subtotal and zero total', () => {
      assert.equal(evaluateCoupon(coupon, -1).valid, false);
      assert.equal(evaluateCoupon(coupon, NaN).valid, false);
      assert.equal(evaluateCoupon(coupon, 0).discount_amount, 0);
    });
    const { fieldValidators } = await import('../lib/validation/schemas');
    check('DP: zero, small total, excessive', () => {
      assert.equal(fieldValidators.dp_amount('0', 0), null);
      assert.equal(fieldValidators.dp_amount('5000', 5000), null);
      assert.ok(fieldValidators.dp_amount('10000', 5000));
    });

    const { getDb, closeDb } = await import('../lib/db');
    close = closeDb;
    const db = getDb();
    check('fresh history migration', () => assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE name='booking_package_history'").get()));
    // Exercise existing database path (baseline no longer runs).
    db.exec('DROP TABLE booking_package_history'); closeDb();
    const liveDb = getDb();
    check('existing DB migration', () => assert.ok(liveDb.prepare("SELECT name FROM sqlite_master WHERE name='booking_package_history'").get()));

    const services: Service[] = [
      { id: 'basic', name: 'Basic', basePrice: 200000, discountValue: 0, isActive: true },
      { id: 'premium', name: 'Premium', basePrice: 350000, discountValue: 0, isActive: true },
      { id: 'mini', name: 'Mini', basePrice: 50000, discountValue: 0, isActive: true },
      { id: 'off', name: 'Off', basePrice: 100000, discountValue: 0, isActive: false },
    ];
    const catalog = join(temp, 'data/services.json');
    writeFileSync(catalog, JSON.stringify(services));
    const { createCoupon, getCouponByCode, getCouponUsageHistory } = await import('../lib/repositories/coupons');
    const { createAddon } = await import('../lib/repositories/addons');
    const { createBooking, readBooking } = await import('../lib/repositories/bookings');
    const { changeBookingPackage, readBookingPackageHistory } = await import('../lib/services/booking-package-service');
    const { bookingService } = await import('../lib/services/booking-service');
    const { priceNewBooking } = await import('../lib/services/booking-pricing-service');
    const normal = createAddon({ name: 'Print', price: 30000, is_active: true });
    const incompatible = createAddon({ name: 'Basic only', price: 10000, is_active: true, applicable_categories: ['Basic'] });
    const adjustment = createAddon({ name: 'Upgrade lama', price: 20000, is_active: true });
    const item = (addon: typeof normal) => ({ addon_id: addon.id, addon_name: addon.name, quantity: 1, price_at_booking: addon.price });
    check('catalog addon price overrides browser price', () => assert.equal(priceNewBooking(services[0]!, [{ ...item(normal), price_at_booking: -900000 }]).breakdown.total, 230000));
    check('invalid addon, duplicate, fraction rejected', () => {
      assert.throws(() => priceNewBooking(services[1]!, [item(incompatible)]));
      assert.throws(() => priceNewBooking(services[0]!, [item(normal), item(normal)]));
      assert.throws(() => priceNewBooking(services[0]!, [{ ...item(normal), quantity: 0.5 }]));
    });
    const promoId = createCoupon({ code: 'ONCE', discount_type: 'percentage', discount_value: 10, usage_limit: 1, is_active: true });
    let day = 3;
    const input = (code = '') => {
      const date = new Date(); date.setDate(date.getDate() + day++);
      return {
        customer: { name: 'Regression', whatsapp: '081234567890', category: 'Forged', serviceId: 'basic' },
        booking: { date: `${date.toISOString().slice(0, 10)}T12:00`, notes: '' },
        finance: { total_price: 1, payments: [{ date: '2026-09-15', amount: 100000, note: 'DP', proof_base64: '', proof_filename: '' }], coupon_code: code, coupon_discount: 999999 },
      };
    };
    const created = await bookingService.createBooking(input(' once '));
    check('server promo amount/category and persisted price', () => {
      assert.equal(created.finance.total_price, 180000);
      assert.equal(readBooking(created.id)?.customer.category, 'Basic');
      assert.equal(getCouponByCode('ONCE')?.usage_count, 1);
      assert.equal(getCouponUsageHistory(promoId).length, 1);
    });
    await assert.rejects(bookingService.createBooking(input('ONCE')), /batas penggunaan/); checks++;
    const without = await bookingService.createBooking(input());
    check('discount amount without code ignored', () => assert.equal(without.finance.total_price, 200000));
    const tooMuch = input(); tooMuch.finance.payments[0]!.amount = 500000;
    await assert.rejects(bookingService.createBooking(tooMuch), /melebihi total/); checks++;
    createCoupon({ code: 'BAD', discount_type: 'fixed', discount_value: 10000, is_active: false });
    await assert.rejects(bookingService.createBooking(input('BAD')), /tidak valid/); checks++;
    const rollbackId = createCoupon({ code: 'ROLLBACK', discount_type: 'fixed', discount_value: 10000, is_active: true });
    const beforeCount = (liveDb.prepare('SELECT count(*) AS n FROM bookings').get() as { n: number }).n;
    liveDb.exec("CREATE TRIGGER fail_coupon_usage BEFORE INSERT ON coupon_usage BEGIN SELECT RAISE(ABORT, 'test rollback'); END");
    await assert.rejects(bookingService.createBooking(input('ROLLBACK')), /test rollback/);
    liveDb.exec('DROP TRIGGER fail_coupon_usage');
    check('coupon write failure rolls back booking/payments/quota', () => {
      assert.equal((liveDb.prepare('SELECT count(*) AS n FROM bookings').get() as { n: number }).n, beforeCount);
      assert.equal(getCouponByCode('ROLLBACK')?.usage_count, 0);
      assert.equal(getCouponUsageHistory(rollbackId).length, 0);
    });
    createCoupon({ code: 'RACE', discount_type: 'fixed', discount_value: 10000, usage_limit: 1, is_active: true });
    const races = await Promise.allSettled([bookingService.createBooking(input('RACE')), bookingService.createBooking(input('RACE'))]);
    check('two competing creates only consume last coupon once', () => assert.equal(races.filter(r => r.status === 'fulfilled').length, 1));
    createCoupon({ code: 'FREE', discount_type: 'fixed', discount_value: 900000, is_active: true });
    const free = input('FREE'); free.finance.payments = [];
    const freeBooking = await bookingService.createBooking(free);
    check('free booking without transfer', () => assert.equal(freeBooking.finance.total_price, 0));

    const base: Booking = {
      id: randomUUID(), created_at: new Date().toISOString(), status: 'Active',
      customer: { name: 'Package test', whatsapp: '081234567890', category: 'Basic', serviceId: 'basic' },
      booking: { date: '2026-09-20T15:00', notes: 'Keep me', location_link: '' },
      finance: { total_price: 240000, service_base_price: 200000, base_discount: 0, addons_total: 60000, coupon_discount: 20000, coupon_code: 'OLD',
        payments: [{ date: '2026-09-15', amount: 100000, note: 'DP original', proof_url: 'https://example.test/proof.jpg', storage_backend: 'b2' }] },
      addons: [item(normal), item(incompatible), item(adjustment)],
    };
    createBooking(base);
    const payBefore = liveDb.prepare('SELECT * FROM payments WHERE booking_id = ?').all(base.id);
    const request = { bookingId: base.id, serviceId: 'premium', reason: 'Customer upgrade' };
    const preview = (await changeBookingPackage(request, 'test-admin')).preview;
    check('preview preserves compatible addon, removes promo/adjustment', () => {
      assert.equal(preview.after.finance.total_price, 380000);
      assert.equal(preview.balance, 280000);
      assert.equal(preview.removedAddons.length, 2);
      assert.equal(preview.after.finance.coupon_discount, 0);
      assert.equal(readBookingPackageHistory(base.id).length, 0);
    });
    liveDb.exec("CREATE TRIGGER fail_package_history BEFORE INSERT ON booking_package_history BEGIN SELECT RAISE(ABORT, 'history rollback'); END");
    await assert.rejects(changeBookingPackage({ ...request, previewToken: preview.token }, 'test-admin'), /history rollback/);
    liveDb.exec('DROP TRIGGER fail_package_history');
    check('package history failure rolls back package/addons', () => {
      assert.equal(readBooking(base.id)?.customer.serviceId, 'basic');
      assert.equal(readBooking(base.id)?.addons?.length, 3);
    });
    const committed = await changeBookingPackage({ ...request, previewToken: preview.token }, 'test-admin');
    check('commit changes package, history, preserves payment rows exactly', () => {
      assert.equal(committed.booking?.customer.serviceId, 'premium');
      assert.deepEqual(liveDb.prepare('SELECT * FROM payments WHERE booking_id = ?').all(base.id), payBefore);
      assert.equal(committed.booking?.booking.notes, 'Keep me');
      assert.equal(readBookingPackageHistory(base.id)[0]?.actor, 'test-admin');
    });
    const downRequest = { ...request, serviceId: 'mini', reason: 'Downgrade' };
    const down = (await changeBookingPackage(downRequest, 'test-admin')).preview;
    check('downgrade flags overpayment', () => assert.equal(down.overpaid, 20000));
    liveDb.prepare('UPDATE payments SET amount = amount + 1000 WHERE booking_id = ?').run(base.id);
    await assert.rejects(changeBookingPackage({ ...downRequest, previewToken: down.token }, 'test-admin'), /berubah/); checks++;
    const changedPayment = (await changeBookingPackage(downRequest, 'test-admin')).preview;
    services[2]!.basePrice = 60000; writeFileSync(catalog, JSON.stringify(services));
    await assert.rejects(changeBookingPackage({ ...downRequest, previewToken: changedPayment.token }, 'test-admin'), /berubah/); checks++;
    for (const status of ['Completed', 'Cancelled', 'Rescheduled']) {
      liveDb.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, base.id);
      await assert.rejects(changeBookingPackage(downRequest, 'test-admin'), /Active/); checks++;
    }
    liveDb.prepare("UPDATE bookings SET status = 'Active' WHERE id = ?").run(base.id);
    await assert.rejects(changeBookingPackage({ ...request, serviceId: 'off' }, 'test-admin'), /tidak aktif/); checks++;
    await assert.rejects(changeBookingPackage({ ...request, serviceId: 'missing' }, 'test-admin'), /tidak ditemukan/); checks++;
    await assert.rejects(changeBookingPackage(request, 'test-admin'), /berbeda/); checks++;
    await assert.rejects(bookingService.updateBooking(base.id, { customer: { serviceId: 'mini' } }), /Ganti Paket/); checks++;
    liveDb.prepare('UPDATE bookings SET customer_service_id = NULL WHERE id = ?').run(base.id);
    check('legacy package without serviceId previews', () => assert.equal(readBooking(base.id)?.customer.serviceId, undefined));
    assert.ok((await changeBookingPackage(downRequest, 'test-admin')).preview); checks++;
    console.log(`\n${checks} regression checks passed. Temporary DB only.`);
  } finally {
    close?.(); process.chdir(cwd); rmSync(temp, { recursive: true, force: true });
  }
}
// Imported legacy notification/rate-limit modules own recurring timers; all assertions
// and cleanup have completed before explicitly ending this standalone process.
main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
