'use client';

import { useState } from 'react';
import { CountdownTimer } from '../components/CountdownTimer';

interface OrderSummaryProps {
    selectedService: any;
    selectedAddons: Map<string, number>;
    availableAddons: any[];
    appliedCoupon: any;
    couponCode: string;
    setCouponCode: (code: string) => void;
    handleApplyCoupon: () => void;
    handleRemoveCoupon: () => void;
    couponError: string;
    couponLoading: boolean;
    suggestedCoupons: any[];
    formData: {
        dp_amount: string;
    };
    calculateServiceBasePrice: () => number;
    calculateAddonsTotal: () => number;
    calculateBaseDiscount: () => number;
    calculateCouponDiscount: () => number;
    calculateTotal: () => number;
}

export const OrderSummary = ({
    selectedService,
    selectedAddons,
    availableAddons,
    appliedCoupon,
    couponCode,
    setCouponCode,
    handleApplyCoupon,
    handleRemoveCoupon,
    couponError,
    couponLoading,
    suggestedCoupons,
    formData,
    calculateServiceBasePrice,
    calculateAddonsTotal,
    calculateBaseDiscount,
    calculateCouponDiscount,
    calculateTotal
}: OrderSummaryProps) => {
    if (!selectedService) return null;

    return (
        <div className="bg-gradient-to-br from-cream-50 to-olive-50 p-6 rounded-2xl shadow-sm border-2 border-olive-100">
            <h3 className="font-display text-xl font-bold text-olive-900 mb-4">Ringkasan Pesanan</h3>

            {/* Selected Service */}
            <div className="space-y-3 mb-4">
                <div className="bg-white p-4 rounded-xl border border-olive-100">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <p className="font-serif text-lg font-bold text-olive-800">{selectedService.name}</p>
                            {selectedService.badgeText && (
                                <span className="inline-block mt-1 bg-gold-100 text-olive-800 text-[9px] uppercase font-black px-2 py-0.5 rounded">
                                    {selectedService.badgeText}
                                </span>
                            )}
                            {selectedService.discountValue > 0 && (
                                <div className="mt-2 inline-flex items-center gap-1 bg-olive-50 text-olive-700 text-[10px] font-bold px-2 py-1 rounded-full border border-olive-200">
                                    <span className="font-serif">💰 Hemat Rp {selectedService.discountValue.toLocaleString('id-ID')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Add-ons */}
                {selectedAddons.size > 0 && (
                    <div className="bg-white p-4 rounded-xl border border-olive-100">
                        <p className="font-bold text-olive-700 text-sm mb-2">Tambahan:</p>
                        <div className="space-y-2">
                            {Array.from(selectedAddons.entries()).map(([addonId, quantity]) => {
                                const addon = availableAddons.find(a => a.id === addonId);
                                if (!addon) return null;
                                return (
                                    <div key={addonId} className="flex justify-between text-sm">
                                        <span className="text-olive-600 font-serif">
                                            {addon.name} x{quantity}
                                        </span>
                                        <span className="font-semibold text-olive-800 font-serif">
                                            Rp {(addon.price * quantity).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Coupon Section */}
            <div className="mb-4">
                {!appliedCoupon ? (
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-olive-700">Punya Kode Kupon?</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                placeholder="Masukkan kode"
                                className="flex-1 p-2.5 text-sm border border-olive-200 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none uppercase font-mono bg-white"
                            />
                            <button
                                type="button"
                                onClick={handleApplyCoupon}
                                disabled={couponLoading}
                                className="px-4 py-2.5 bg-olive-600 hover:bg-olive-700 text-white text-sm font-bold rounded-lg disabled:opacity-50 transition-all"
                            >
                                {couponLoading ? '...' : 'Terapkan'}
                            </button>
                        </div>
                        {couponError && (
                            <p className="text-xs text-red-600 font-medium">{couponError}</p>
                        )}

                        {/* Suggested Coupons */}
                        {suggestedCoupons.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-gray-600">💡 Kupon yang Tersedia:</p>
                                <div className="space-y-1.5">
                                    {suggestedCoupons.map((coupon) => (
                                        <button
                                            key={coupon.id}
                                            type="button"
                                            onClick={() => {
                                                setCouponCode(coupon.code);
                                                handleApplyCoupon();
                                            }}
                                            className="w-full text-left p-2.5 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-lg transition-all group"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-black text-xs text-yellow-800 font-mono">{coupon.code}</p>
                                                        {coupon.valid_until && (
                                                            <span className="bg-red-100 text-red-600 text-[9px] px-1.5 py-0.5 rounded font-bold">
                                                                🔥 FLASH SALE
                                                            </span>
                                                        )}
                                                    </div>
                                                    {coupon.description && (
                                                        <p className="text-[10px] text-gray-600 mt-0.5">{coupon.description}</p>
                                                    )}
                                                    <p className="text-xs text-green-600 font-bold mt-1">
                                                        {coupon.discount_type === 'percentage'
                                                            ? `Diskon ${coupon.discount_value}%`
                                                            : `Potongan Rp ${coupon.discount_value.toLocaleString('id-ID')}`
                                                        }
                                                        {coupon.max_discount && coupon.discount_type === 'percentage' && (
                                                            ` (maks. Rp ${coupon.max_discount.toLocaleString('id-ID')})`
                                                        )}
                                                    </p>
                                                    {coupon.valid_until && (
                                                        <div className="mt-1">
                                                            <CountdownTimer targetDate={coupon.valid_until} />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-yellow-700 font-bold group-hover:underline">Gunakan</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3">
                        <div className="flex justify-between items-center">
                            <div className="flex-1">
                                <p className="text-xs text-green-600 font-medium">Kupon Terapkan:</p>
                                <p className="font-black text-green-700 font-mono">{appliedCoupon.coupon.code}</p>
                                <p className="text-xs text-green-600 mt-1">
                                    {appliedCoupon.coupon.discount_type === 'percentage'
                                        ? `Diskon ${appliedCoupon.coupon.discount_value}%`
                                        : `Diskon Rp ${appliedCoupon.coupon.discount_value.toLocaleString('id-ID')}`
                                    }
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleRemoveCoupon}
                                className="text-red-600 hover:text-red-700 text-xs font-bold"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Price Summary - Detailed Breakdown */}
            <div className="border-t-2 border-olive-200 pt-4 space-y-2">
                {/* Service Base Price */}
                <div className="flex justify-between text-sm text-olive-700">
                    <span className="text-olive-600">Harga Layanan:</span>
                    <span className="font-semibold text-olive-800 font-serif">
                        Rp {calculateServiceBasePrice().toLocaleString('id-ID')}
                    </span>
                </div>

                {/* Add-ons Total */}
                {calculateAddonsTotal() > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-olive-600">Total Tambahan:</span>
                        <span className="font-semibold text-olive-800 font-serif">
                            + Rp {calculateAddonsTotal().toLocaleString('id-ID')}
                        </span>
                    </div>
                )}

                {/* Base Discount */}
                {calculateBaseDiscount() > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-olive-600">Diskon Paket:</span>
                        <span className="font-semibold text-red-600 font-serif">
                            - Rp {calculateBaseDiscount().toLocaleString('id-ID')}
                        </span>
                    </div>
                )}

                {/* Coupon Discount */}
                {calculateCouponDiscount() > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-olive-600">Diskon Kupon:</span>
                        <span className="font-semibold text-red-600 font-serif">
                            - Rp {calculateCouponDiscount().toLocaleString('id-ID')}
                        </span>
                    </div>
                )}

                {/* Grand Total */}
                <div className="flex justify-between items-center pt-2 border-t-2 border-olive-200">
                    <span className="font-display font-black text-lg text-olive-900">TOTAL:</span>
                    <span className="font-serif font-black text-2xl text-gold-600">
                        Rp {calculateTotal().toLocaleString('id-ID')}
                    </span>
                </div>

                {/* Down Payment & Remaining Balance */}
                {formData.dp_amount && Number(formData.dp_amount) > 0 && (
                    <div className="mt-4 pt-4 border-t-2 border-olive-200 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-olive-600">Down Payment (DP):</span>
                            <span className="font-semibold text-olive-800 font-serif">
                                Rp {Number(formData.dp_amount).toLocaleString('id-ID')}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-olive-800">Sisa Pembayaran:</span>
                            <span className="font-bold text-lg text-olive-600 font-serif">
                                Rp {(calculateTotal() - Number(formData.dp_amount)).toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
