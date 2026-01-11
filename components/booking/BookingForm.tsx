'use client';

import { useBookingForm } from './hooks/useBookingForm';

// Steps
import { ServiceSelection } from './steps/ServiceSelection';
import { AddonsSelection } from './steps/AddonsSelection';
import { CustomerInfo } from './steps/CustomerInfo';
import { ScheduleInfo } from './steps/ScheduleInfo';
import { PaymentInfo } from './steps/PaymentInfo';
import { OrderSummary } from './steps/OrderSummary';

export default function BookingForm() {
    const {
        // State
        loading,
        services,
        selectedService,
        proofPreview,
        availableAddons,
        selectedAddons,
        paymentSettings,
        couponCode,
        appliedCoupon,
        couponError,
        couponLoading,
        suggestedCoupons,
        formData,

        // Setters
        setCouponCode,

        // Handlers
        handleChange,
        handleServiceSelect,
        toggleAddon,
        updateAddonQuantity,
        handleApplyCoupon,
        handleRemoveCoupon,
        handleFileChange,
        copyToClipboard,
        handleSubmit,

        // Calculations
        // calculateServiceBasePrice,
        calculateAddonsTotal,
        calculateBaseDiscount,
        calculateCouponDiscount,
        calculateTotal
    } = useBookingForm();

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-blue-900 mb-2">Booking Sesi Foto</h1>
                <p className="text-gray-600">Pilih layanan dan tentukan jadwal sesi foto Anda bersama Cerita Kita.</p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* LEFT: SERVICE SELECTION */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Service Selection */}
                    <ServiceSelection
                        services={services}
                        selectedService={selectedService}
                        handleServiceSelect={handleServiceSelect}
                    />

                    {/* Add-ons Selection */}
                    <AddonsSelection
                        availableAddons={availableAddons}
                        selectedAddons={selectedAddons}
                        toggleAddon={toggleAddon}
                        updateAddonQuantity={updateAddonQuantity}
                    />


                    {/* Location (Outdoor only) */}
                    {selectedService && selectedService.name.toLowerCase().includes('outdoor') && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center gap-2 mb-4 text-gray-800 font-bold">
                                <span>📍</span>
                                <h3>Lokasi Photoshoot</h3>
                            </div>
                            <input
                                required
                                type="url"
                                name="location_link"
                                value={formData.location_link}
                                onChange={handleChange}
                                placeholder="Masukkan link Google Maps lokasi"
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                            />
                        </div>
                    )}
                </div>

                {/* RIGHT: FORM DETAILS */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-8">
                        {/* Data Sesi */}
                        <ScheduleInfo
                            formData={formData}
                            handleChange={handleChange}
                        />

                        {/* Data Diri */}
                        <CustomerInfo
                            formData={formData}
                            handleChange={handleChange}
                        />

                        {/* Pembayaran DP */}
                        <PaymentInfo
                            formData={formData}
                            handleChange={handleChange}
                            proofPreview={proofPreview}
                            handleFileChange={handleFileChange}
                            paymentSettings={paymentSettings || undefined}
                            copyToClipboard={copyToClipboard}
                        />
                    </div>

                    {/* ORDER SUMMARY */}
                    <OrderSummary
                        selectedService={selectedService || null}
                        selectedAddons={selectedAddons}
                        availableAddons={availableAddons}
                        appliedCoupon={appliedCoupon}
                        couponCode={couponCode}
                        setCouponCode={setCouponCode}
                        handleApplyCoupon={handleApplyCoupon}
                        handleRemoveCoupon={handleRemoveCoupon}
                        couponError={couponError}
                        couponLoading={couponLoading}
                        suggestedCoupons={suggestedCoupons}
                        formData={formData}
                        calculateAddonsTotal={calculateAddonsTotal}
                        calculateBaseDiscount={calculateBaseDiscount}
                        calculateCouponDiscount={calculateCouponDiscount}
                        calculateTotal={calculateTotal}
                    />

                    {/* SUBMIT BUTTON */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Memproses...
                                </span>
                            ) : (
                                'Konfirmasi & Kirim Pesanan'
                            )}
                        </button>
                        <p className="text-center text-[10px] text-gray-400 mt-2">Dengan menekan tombol di atas, Anda menyetujui jadwal yang telah dipilih.</p>
                    </div>
                </div>
            </form>

        </div>
    );
}
