import type { Coupon, CouponValidationResult } from '@/lib/repositories/coupons';

/** Date-only promotions use the studio's WIB calendar, including the whole final day. */
function promoBoundary(value: string, end: boolean): number {
  return Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T${end ? '23:59:59.999' : '00:00:00.000'}+07:00`
    : value);
}

export function evaluateCoupon(coupon: Coupon | null, subtotal: number, now = Date.now()): CouponValidationResult {
  const invalid = (error: string): CouponValidationResult => ({ valid: false, error });
  if (!Number.isFinite(subtotal) || subtotal < 0) return invalid('Total pembelian tidak valid');
  if (!coupon?.is_active) return invalid('Kode kupon tidak valid');
  if (coupon.valid_from) {
    const start = promoBoundary(coupon.valid_from, false);
    if (!Number.isFinite(start) || start > now) return invalid('Kupon belum berlaku');
  }
  if (coupon.valid_until) {
    const end = promoBoundary(coupon.valid_until, true);
    if (!Number.isFinite(end) || end < now) return invalid('Kupon sudah kedaluwarsa');
  }
  if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) return invalid('Kupon sudah mencapai batas penggunaan');
  if (coupon.min_purchase && subtotal < coupon.min_purchase) {
    return invalid(`Minimal pembelian Rp ${coupon.min_purchase.toLocaleString('id-ID')}`);
  }
  let discount = coupon.discount_type === 'percentage' ? subtotal * coupon.discount_value / 100 : coupon.discount_value;
  if (coupon.discount_type === 'percentage' && coupon.max_discount) discount = Math.min(discount, coupon.max_discount);
  if (!Number.isFinite(discount) || discount < 0) return invalid('Nilai kupon tidak valid');
  return { valid: true, coupon, discount_amount: Math.min(subtotal, Math.round(discount)) };
}
