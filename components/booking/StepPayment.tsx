'use client';

import { useMultiStepForm } from './MultiStepForm';
import { ValidationMessage, FieldValidationWrapper } from '@/components/ui/ValidationMessage';
import { MessageSquare, Upload, Info } from 'lucide-react';
import { fieldValidators } from '@/lib/validation/schemas';
import { useState, useEffect } from 'react';
import Image from 'next/image';

// Countdown Timer Component
function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft('Berakhir');
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setIsUrgent(difference < 24 * 60 * 60 * 1000);

      if (days > 0) {
        setTimeLeft(`${days}h ${hours}j lagi`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}j ${minutes}m lagi`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}d`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <span className={`text-[10px] font-bold ${isUrgent ? 'text-red-600 animate-pulse' : 'text-orange-600'}`}>
      {isUrgent && <span className="inline mr-0.5">🔥</span>}
      {timeLeft}
    </span>
  );
}

export function StepPayment() {
  const { formData, updateFormData, errors, setFieldError, clearFieldError, isSubmitting } = useMultiStepForm();
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [suggestedCoupons, setSuggestedCoupons] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');

  // Sync appliedCoupon state with formData when couponCode is cleared
  // This handles the case where user goes back and changes service
  useEffect(() => {
    if (!formData.couponCode && appliedCoupon) {
      setAppliedCoupon(null);
      setCouponCode('');
      setCouponError('');
    }
  }, [formData.couponCode]);

  // Fetch payment methods
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const res = await fetch('/api/payment-methods?active=true');
        if (res.ok) {
          const methods = await res.json();
          setPaymentMethods(methods);
          // Auto-select first method
          if (methods.length > 0) {
            setSelectedMethod(methods[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch payment methods:', error);
      }
    };

    fetchPaymentMethods();
  }, []);

  // Update formData when selected method changes
  useEffect(() => {
    if (selectedMethod) {
      const method = paymentMethods.find(m => m.id === selectedMethod);
      if (method) {
        updateFormData({
          paymentMethodId: selectedMethod,
          paymentMethodName: method.name,
          paymentProvider: method.provider_name,
          paymentAccountName: method.account_name,
          paymentAccountNumber: method.account_number,
          paymentQrisUrl: method.qris_image_url
        });
      }
    }
  }, [selectedMethod, paymentMethods]);

  // Real-time validation
  useEffect(() => {
    if (touched.dp_amount && formData.dp_amount) {
      const error = fieldValidators.dp_amount(formData.dp_amount, formData.totalPrice);
      if (error) {
        setFieldError('dp_amount', error);
      } else {
        clearFieldError('dp_amount');
      }
    }
  }, [formData.dp_amount, touched.dp_amount, formData.totalPrice]);

  // Fetch coupon suggestions
  useEffect(() => {
    const fetchSuggestions = () => {
      const subtotal = formData.serviceBasePrice + formData.addonsTotal - formData.baseDiscount;
      if (subtotal > 0 && !appliedCoupon) {
        fetch('/api/coupons/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ totalAmount: subtotal })
        })
          .then(res => res.json())
          .then(data => setSuggestedCoupons(data))
          .catch(err => console.error("Failed to fetch suggestions", err));
      } else if (subtotal === 0 || appliedCoupon) {
        setSuggestedCoupons([]);
      }
    };

    fetchSuggestions();
    const interval = setInterval(fetchSuggestions, 30000);
    return () => clearInterval(interval);
  }, [formData.serviceBasePrice, formData.addonsTotal, formData.baseDiscount, appliedCoupon]);

  const handleDpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    updateFormData({ dp_amount: value });
    if (!touched.dp_amount) setTouched(prev => ({ ...prev, dp_amount: true }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    if (file.size > 5 * 1024 * 1024) {
      setFieldError('proofFile', 'File terlalu besar (maks 5MB)');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setFieldError('proofFile', 'Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WEBP');
      return;
    }

    // Store File object
    updateFormData({ proofFile: file });

    // Generate preview
    const reader = new FileReader();
    reader.onloadend = () => {
      updateFormData({ proofPreview: reader.result as string });
    };
    reader.readAsDataURL(file);

    clearFieldError('proofFile');
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Masukkan kode kupon');
      return;
    }

    const subtotal = formData.serviceBasePrice + formData.addonsTotal - formData.baseDiscount;
    if (subtotal === 0) {
      setCouponError('Pilih layanan terlebih dahulu');
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode,
          totalAmount: subtotal
        })
      });

      const data = await res.json();

      if (data.valid) {
        setAppliedCoupon(data);
        setCouponError('');

        // Update form data
        const couponDiscount = data.discount_amount || 0;

        updateFormData({
          couponDiscount,
          couponCode: data.coupon.code,
          // totalPrice will be auto-calculated by useEffect in MultiStepForm
        });
      } else {
        setCouponError(data.error || 'Kupon tidak valid');
        setAppliedCoupon(null);
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      setCouponError('Terjadi kesalahan saat memvalidasi kupon');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');

    updateFormData({
      couponDiscount: 0,
      couponCode: '',
      // totalPrice will be auto-calculated by useEffect in MultiStepForm
    });
  };

  const dpError = errors[5]?.find(e => e.field === 'dp_amount');
  const proofError = errors[5]?.find(e => e.field === 'proofFile');

  // Calculate remaining balance
  const remainingBalance = formData.totalPrice - (Number(formData.dp_amount) || 0);

  // Copy to clipboard handler with visual feedback
  const [copyStatus, setCopyStatus] = useState<Record<string, boolean>>({});
  
  const copyToClipboard = async (text: string, methodId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      
      // Show visual feedback
      setCopyStatus(prev => ({ ...prev, [methodId]: true }));
      
      // Reset after 2 seconds
      setTimeout(() => {
        setCopyStatus(prev => ({ ...prev, [methodId]: false }));
      }, 2000);
      
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Gagal menyalin nomor rekening');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-lg font-bold text-gray-800">
        <MessageSquare className="text-primary-600" size={24} />
        <h2>Pembayaran & Ringkasan</h2>
      </div>

      {/* Order Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border-2 border-blue-100">
        <h3 className="font-black text-gray-800 mb-3">Ringkasan Pesanan</h3>

        {/* Service */}
        <div className="bg-white p-3 rounded-xl border border-blue-100 mb-2">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="font-bold text-gray-800">{formData.serviceName}</p>
              {formData.serviceBasePrice > 0 && (
                <div className="text-sm text-gray-600 mt-1">
                  Rp {formData.serviceBasePrice.toLocaleString('id-ID')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add-ons */}
        {formData.addons.length > 0 && (
          <div className="bg-white p-3 rounded-xl border border-blue-100 mb-2">
            <p className="font-bold text-gray-700 text-sm mb-2">Tambahan:</p>
            {formData.addons.map(addon => (
              <div key={addon.addonId} className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">
                  {addon.addonName} x{addon.quantity}
                </span>
                <span className="font-semibold text-gray-800">
                  Rp {(addon.priceAtBooking * addon.quantity).toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Discounts */}
        {(formData.baseDiscount > 0 || formData.couponDiscount > 0) && (
          <div className="space-y-1 my-2">
            {formData.baseDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Diskon Paket:</span>
                <span className="font-semibold text-red-600">
                  -Rp {formData.baseDiscount.toLocaleString('id-ID')}
                </span>
              </div>
            )}
            {formData.couponDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Diskon Kupon:</span>
                <span className="font-semibold text-red-600">
                  -Rp {formData.couponDiscount.toLocaleString('id-ID')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Total */}
        <div className="border-t-2 border-blue-200 pt-2 mt-2">
          <div className="flex justify-between items-center">
            <span className="font-black text-lg text-gray-900">TOTAL:</span>
            <span className="font-black text-2xl text-primary-600">
              Rp {formData.totalPrice.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Remaining Balance */}
        {formData.dp_amount && Number(formData.dp_amount) > 0 && (
          <div className="mt-3 pt-3 border-t-2 border-blue-200 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Down Payment (DP):</span>
              <span className="font-semibold text-success-600">
                Rp {Number(formData.dp_amount).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-800">Sisa Pembayaran:</span>
              <span className="font-bold text-lg text-orange-600">
                Rp {remainingBalance.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Coupon Section */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200">
        {!appliedCoupon ? (
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-700">Punya Kode Kupon?</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Masukkan kode"
                className="flex-1 p-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none uppercase font-mono touch-target"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={couponLoading}
                className="px-4 py-2.5 bg-success-600 hover:bg-success-700 text-white text-sm font-bold rounded-lg disabled:opacity-50 transition-all touch-target"
              >
                {couponLoading ? '...' : 'Terapkan'}
              </button>
            </div>
            {couponError && (
              <ValidationMessage message={couponError} type="error" />
            )}

            {/* Suggested Coupons */}
            {suggestedCoupons.length > 0 && (
              <div className="space-y-2 mt-3">
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
                      className="w-full text-left p-2.5 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-lg transition-all group touch-target"
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
          <div className="bg-success-50 border-2 border-success-200 rounded-xl p-3">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <p className="text-xs text-success-600 font-medium">Kupon Terapkan:</p>
                <p className="font-black text-success-700 font-mono">{appliedCoupon.coupon.code}</p>
                <p className="text-xs text-success-600 mt-1">
                  {appliedCoupon.coupon.discount_type === 'percentage'
                    ? `Diskon ${appliedCoupon.coupon.discount_value}%`
                    : `Diskon Rp ${appliedCoupon.coupon.discount_value.toLocaleString('id-ID')}`
                  }
                </p>
              </div>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="text-red-600 hover:text-red-700 text-xs font-bold touch-target"
              >
                Hapus
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Methods Selection */}
      {paymentMethods.length > 0 && (
        <div className="space-y-4">
          {/* Selection Header */}
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-primary-600 rounded-full"></div>
            <h4 className="font-bold text-gray-800 text-lg">Pilih Metode Pembayaran</h4>
          </div>

          {/* Compact Selection Chips */}
          <div className="grid grid-cols-2 gap-3">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setSelectedMethod(method.id)}
                className={`relative p-4 rounded-xl border-2 transition-all duration-300 touch-target min-h-[56px] flex items-center justify-center font-bold text-sm ${
                  selectedMethod === method.id
                    ? 'border-primary-600 bg-gradient-to-br from-primary-50 to-primary-100 shadow-md'
                    : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2">
                  {/* Selection Indicator */}
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                    selectedMethod === method.id
                      ? 'border-primary-600 bg-primary-600'
                      : 'border-gray-400'
                  }`}>
                    {selectedMethod === method.id && (
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    )}
                  </div>
                  {/* Provider Name Only */}
                  <span className="text-gray-800">{method.provider_name}</span>
                </div>

                {/* Small QRIS Indicator */}
                {method.qris_image_url && selectedMethod === method.id && (
                  <div className="absolute top-1 right-1 w-5 h-5">
                    <Image
                      src={method.qris_image_url}
                      alt="QRIS"
                      fill
                      className="object-contain opacity-70"
                      sizes="20px"
                      unoptimized
                    />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Focused Detail Card - Only shows when method is selected */}
          {selectedMethod && (() => {
            const method = paymentMethods.find(m => m.id === selectedMethod);
            if (!method) return null;
            
            return (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border-2 border-blue-200 shadow-lg space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                {/* Card Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-blue-700 mb-1 uppercase tracking-wider">Detail Transfer</p>
                    <p className="font-black text-gray-900 text-xl">{method.provider_name}</p>
                  </div>
                  {/* Copy Button - Right aligned, easy to reach */}
                  <button
                    type="button"
                    onClick={() => copyToClipboard(method.account_number, method.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 touch-target min-h-[48px] shadow-sm ${
                      copyStatus[method.id]
                        ? 'bg-success-600 text-white scale-105'
                        : 'bg-primary-600 hover:bg-primary-700 text-white hover:scale-105'
                    }`}
                  >
                    {copyStatus[method.id] ? (
                      <>
                        <span className="text-lg">✓</span>
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <span className="text-lg">📋</span>
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Account Details */}
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded-xl border-2 border-blue-200 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 mb-1">Atas Nama</p>
                    <p className="font-bold text-gray-800 text-lg">{method.account_name}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border-2 border-blue-200 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 mb-1">Nomor Rekening</p>
                    <p className="font-mono text-2xl font-black text-primary-800 tracking-wider">
                      {method.account_number}
                    </p>
                  </div>
                </div>

                {/* QRIS Display - Prominent */}
                {method.qris_image_url && (
                  <div className="bg-white p-5 rounded-2xl border-2 border-blue-200 shadow-sm">
                    <div className="text-center">
                      <p className="text-xs font-bold text-gray-600 mb-3 flex items-center justify-center gap-2">
                        <span className="text-base">📱</span>
                        <span>Scan QRIS untuk Pembayaran Instan</span>
                      </p>
                      <div className="inline-block p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-blue-200 shadow-md">
                        <Image
                          src={method.qris_image_url}
                          alt={`QRIS ${method.provider_name}`}
                          width={240}
                          height={240}
                          className="object-contain rounded-lg"
                          unoptimized
                        />
                      </div>
                      <p className="text-[11px] text-gray-500 mt-2 font-medium">
                        Gunakan aplikasi e-wallet atau mobile banking Anda
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Payment Input Section */}
      <div className="space-y-6 pt-4 border-t-2 border-gray-200">
        {/* DP Amount Input */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <FieldValidationWrapper
            error={dpError?.message || null}
            label="Jumlah DP (Rp)"
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rp</span>
              <input
                required
                type="number"
                name="dp_amount"
                value={formData.dp_amount}
                onChange={handleDpChange}
                onBlur={() => setTouched(prev => ({ ...prev, dp_amount: true }))}
                placeholder="0"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none font-bold text-primary-700 text-lg transition-all touch-target hover:bg-white"
                aria-describedby={dpError ? 'dp_amount-error' : undefined}
                aria-invalid={!!dpError}
                inputMode="numeric"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <span className="text-primary-600 font-semibold">💡</span>
              <span>Minimal Rp 10.000, maksimal Rp {formData.totalPrice.toLocaleString('id-ID')}</span>
            </p>
          </FieldValidationWrapper>
        </div>

        {/* Proof Upload */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <FieldValidationWrapper
            error={proofError?.message || null}
            label="Bukti Transfer"
          >
            <div className="relative group overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-6 transition-all duration-300 hover:border-primary-400 hover:from-primary-50 hover:to-indigo-50">
              <input
                required={!formData.proofPreview}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10 touch-target"
                aria-label="Upload bukti transfer"
              />
              
              {!formData.proofPreview ? (
                <div className="flex flex-col items-center gap-3 text-gray-600">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200">
                    <Upload size={24} strokeWidth={1.5} className="text-primary-600 group-hover:text-primary-700 transition-colors" />
                  </div>
                  <p className="text-sm font-bold text-gray-700">Klik atau seret file di sini</p>
                  <p className="text-[11px] text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                    JPG, PNG, GIF, WEBP • Maks 5MB
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <div className="inline-block relative">
                    <Image
                      src={formData.proofPreview}
                      alt="Preview bukti transfer"
                      width={320}
                      height={180}
                      className="h-40 w-auto rounded-lg object-contain shadow-lg border-4 border-white bg-white"
                      unoptimized
                    />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-success-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md">
                      ✓
                    </div>
                  </div>
                  <p className="text-sm font-bold text-primary-700">Bukti transfer terpilih</p>
                  <p className="text-xs text-gray-500">(Klik untuk mengganti gambar)</p>
                </div>
              )}
            </div>
          </FieldValidationWrapper>
        </div>
      </div>

      {/* Validation Summary */}
      {(dpError || proofError) && (
        <div className="space-y-2">
          {dpError && <ValidationMessage message={dpError.message} type="error" />}
          {proofError && <ValidationMessage message={proofError.message} type="error" />}
        </div>
      )}

      {/* Help Text & Instructions */}
      <div className="space-y-3">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Info size={20} className="text-primary-600 mt-0.5 shrink-0" />
          <div className="flex-1 text-sm text-gray-700 space-y-1">
            <p className="font-bold text-gray-900">Petunjuk Pembayaran:</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs">
              <li>Upload bukti transfer setelah melakukan DP</li>
              <li>Admin akan verifikasi dalam 15 menit</li>
              <li>Konfirmasi jadwal akan dikirim via WhatsApp</li>
            </ul>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4">
          <p className="text-sm font-bold text-purple-900 mb-1">Info Penting:</p>
          <p className="text-xs text-purple-800 leading-relaxed">
            Setelah menekan tombol "Selesaikan", data booking akan terkirim ke admin.
            Anda akan menerima konfirmasi dan detail jadwal melalui WhatsApp.
          </p>
        </div>

        {/* Desktop Instructions */}
        <div className="hidden md:block text-center">
          <p className="text-[11px] text-gray-500 bg-gray-50 inline-block px-4 py-2 rounded-full border border-gray-200">
            💡 Klik "Selesaikan" di navigasi bawah → Dengan menekan tombol, Anda menyetujui semua data yang diisi
          </p>
        </div>
      </div>
    </div>
  );
}