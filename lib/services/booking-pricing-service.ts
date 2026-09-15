import 'server-only';
import type { BookingAddon, Service } from '@/lib/types';
import { getAddonById } from '@/lib/repositories/addons';
import { calculateDetailedPricing } from '@/lib/pricing';
import { requireBookingCoupon } from '@/lib/services/coupon-service';
import { AppError } from '@/lib/logger';

/** Authoritative create pricing: clients select IDs/quantities, never monetary values. */
export function priceNewBooking(service: Service, requested: BookingAddon[], code?: string) {
  const seen = new Set<string>();
  const addons = requested.map(item => {
    const addon = getAddonById(item.addon_id);
    if (!addon?.is_active || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || seen.has(item.addon_id)
      || (addon.applicable_categories?.length && !addon.applicable_categories.includes(service.name))) {
      throw new AppError('Add-on tidak tersedia atau jumlah tidak valid', 400, 'INVALID_ADDON');
    }
    seen.add(item.addon_id);
    return { addon_id: addon.id, addon_name: addon.name, quantity: item.quantity, price_at_booking: addon.price };
  });
  const prices = addons.map(a => ({ price: a.price_at_booking, quantity: a.quantity }));
  const subtotal = calculateDetailedPricing(service, prices).total;
  const applied = code?.trim() ? requireBookingCoupon(code, subtotal) : null;
  const breakdown = calculateDetailedPricing(service, prices, applied?.discount ?? 0);
  return { addons, subtotal, applied, breakdown };
}
