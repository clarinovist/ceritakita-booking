import 'server-only';
import { createHash } from 'crypto';
import { z } from 'zod';
import { readServices } from '@/lib/repositories/services';
import { readBooking } from '@/lib/repositories/bookings';
import { getAddonById } from '@/lib/repositories/addons';
import { getPackageHistory, savePackageChange } from '@/lib/repositories/booking-package';
import { inBookingTransaction } from '@/lib/repositories/transaction';
import { calculateDetailedPricing } from '@/lib/pricing';
import { AppError } from '@/lib/logger';
import type { Booking, PackageSnapshot, PackageChangePreview, Service } from '@/lib/types';

export const packageChangeSchema = z.object({
  bookingId: z.string().uuid(),
  serviceId: z.string().min(1).max(100),
  reason: z.string().trim().min(1, 'Alasan perubahan wajib diisi').max(500),
  previewToken: z.string().length(64).optional(),
});

function snapshot(booking: Booking): PackageSnapshot {
  const { payments: _payments, ...finance } = booking.finance;
  return { serviceId: booking.customer.serviceId, serviceName: booking.customer.category, finance, addons: booking.addons || [] };
}

function buildPreview(bookingId: string, service: Service): PackageChangePreview {
  const booking = readBooking(bookingId);
  if (!booking) throw new AppError('Booking tidak ditemukan', 404, 'BOOKING_NOT_FOUND');
  if (booking.status !== 'Active') throw new AppError('Ganti paket hanya untuk booking Active', 400, 'INVALID_STATUS');
  if (!service.isActive) throw new AppError('Paket tidak aktif', 400, 'SERVICE_INACTIVE');
  if (service.id === booking.customer.serviceId) throw new AppError('Pilih paket yang berbeda', 400, 'SAME_PACKAGE');

  const before = snapshot(booking);
  const removedAddons: PackageChangePreview['removedAddons'] = [];
  const addons = before.addons.filter(item => {
    const addon = getAddonById(item.addon_id);
    const keep = addon?.is_active && item.price_at_booking >= 0
      && !/upgrade|downgrade|penyesuaian/i.test(item.addon_name)
      && (!addon.applicable_categories?.length || addon.applicable_categories.includes(service.name));
    if (!keep) removedAddons.push(item);
    return keep;
  });
  const priced = calculateDetailedPricing(service, addons.map(a => ({ price: a.price_at_booking, quantity: a.quantity })));
  const after: PackageSnapshot = {
    serviceId: service.id, serviceName: service.name, addons,
    finance: { total_price: priced.total, service_base_price: priced.serviceBasePrice, base_discount: priced.baseDiscount,
      addons_total: priced.addonsTotal, coupon_discount: 0 },
  };
  const paid = booking.finance.payments.reduce((sum, p) => sum + p.amount, 0);
  // Includes all booking fields and proof/payment data, not just total price.
  const token = createHash('sha256').update(JSON.stringify({ booking, after, removedAddons })).digest('hex');
  return { token, before, after, removedAddons, paid, balance: Math.max(0, priced.total - paid),
    overpaid: Math.max(0, paid - priced.total), difference: priced.total - before.finance.total_price };
}

export async function changeBookingPackage(input: z.infer<typeof packageChangeSchema>, actor: string) {
  const parsed = packageChangeSchema.parse(input);
  const service = (await readServices()).find(s => s.id === parsed.serviceId);
  if (!service) throw new AppError('Paket tidak ditemukan', 400, 'INVALID_SERVICE');
  return inBookingTransaction(() => {
    const preview = buildPreview(parsed.bookingId, service);
    if (!parsed.previewToken) return { preview };
    if (parsed.previewToken !== preview.token) {
      throw new AppError('Data booking atau harga berubah. Muat ulang preview sebelum menyimpan.', 409, 'STALE_PACKAGE_PREVIEW');
    }
    savePackageChange(parsed.bookingId, preview.before, preview.after, actor, parsed.reason);
    return { preview, booking: readBooking(parsed.bookingId)!, history: getPackageHistory(parsed.bookingId) };
  });
}

export function readBookingPackageHistory(bookingId: string) {
  if (!readBooking(bookingId)) throw new AppError('Booking tidak ditemukan', 404, 'BOOKING_NOT_FOUND');
  return getPackageHistory(bookingId);
}
