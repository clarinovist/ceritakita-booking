import 'server-only';
import { evaluateCoupon } from '@/lib/coupon-rules';
import { getCouponByCode } from '@/lib/repositories/coupons';
import { AppError } from '@/lib/logger';

export function validateBookingCoupon(code: string, subtotal: number) {
  return evaluateCoupon(getCouponByCode(code.trim()), subtotal);
}

export function requireBookingCoupon(code: string, subtotal: number) {
  const result = validateBookingCoupon(code, subtotal);
  if (!result.valid || !result.coupon || result.discount_amount === undefined) {
    throw new AppError(result.error || 'Kupon tidak valid', 400, 'INVALID_COUPON');
  }
  return { coupon: result.coupon, discount: result.discount_amount };
}
