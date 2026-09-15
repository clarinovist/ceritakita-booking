'use client';

import { useEffect, useRef, useState } from 'react';
import { useMultiStepForm } from '../MultiStepForm';

export function BookingCoupon() {
  const { formData, updateFormData, isSubmitting, setCouponLoading } = useMultiStepForm();
  const [code, setCode] = useState(formData.couponCode);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const request = useRef(0);
  const subtotal = Math.max(0, formData.serviceBasePrice - formData.baseDiscount + formData.addonsTotal);
  const pricingKey = JSON.stringify([formData.serviceId, subtotal, formData.addons]);

  useEffect(() => {
    request.current += 1;
    setLoading(false);
    setCouponLoading(false);
    setError('');
    return () => { request.current += 1; setCouponLoading(false); };
  }, [pricingKey, setCouponLoading]);

  async function apply() {
    const id = ++request.current;
    setLoading(true);
    setCouponLoading(true);
    setError('');
    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), totalAmount: subtotal }),
      });
      const result = await response.json();
      if (id !== request.current) return;
      if (!response.ok || !result.valid) throw new Error(result.error || 'Kode promo tidak dapat diterapkan');
      updateFormData({ couponCode: result.coupon.code, couponDiscount: result.discount_amount });
      setCode(result.coupon.code);
    } catch (err) {
      if (id === request.current) setError(err instanceof Error ? err.message : 'Gagal memvalidasi promo');
    } finally {
      if (id === request.current) { setLoading(false); setCouponLoading(false); }
    }
  }

  return (
    <section className="rounded-xl border border-olive-200 bg-cream-50 p-4 space-y-2" aria-label="Kode promo">
      <label htmlFor="booking-coupon" className="block text-sm font-semibold text-olive-800">Kode promo / voucher</label>
      {formData.couponCode ? (
        <div className="flex justify-between items-center gap-2 text-sm">
          <p className="text-green-700" role="status"><strong>{formData.couponCode}</strong> · Hemat Rp {formData.couponDiscount.toLocaleString('id-ID')}</p>
          <button type="button" disabled={isSubmitting} onClick={() => {
            request.current += 1;
            updateFormData({ couponCode: '', couponDiscount: 0 });
            setCode(''); setError('');
          }} className="text-red-700 underline disabled:opacity-50">Hapus</button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input id="booking-coupon" value={code} maxLength={100} disabled={loading || isSubmitting}
            onChange={e => { setCode(e.target.value); setError(''); }}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (code.trim() && !loading) void apply(); } }}
            placeholder="Masukkan kode promo" autoCapitalize="characters" aria-describedby={error ? 'booking-coupon-error' : undefined}
            className="min-w-0 flex-1 rounded-lg border border-olive-200 p-2 text-sm uppercase" />
          <button type="button" onClick={apply} disabled={!code.trim() || loading || isSubmitting || !formData.serviceId}
            className="rounded-lg bg-olive-800 px-3 py-2 text-sm text-white disabled:opacity-50">{loading ? 'Memeriksa…' : 'Terapkan'}</button>
        </div>
      )}
      {error && <p id="booking-coupon-error" role="alert" className="text-xs text-red-700">{error}</p>}
      <p className="text-xs text-olive-600">Promo diperiksa lagi saat booking dikirim. Perubahan paket atau tambahan akan melepas promo.</p>
    </section>
  );
}
