'use client';

import { MultiStepFormProvider, useMultiStepForm } from './MultiStepForm';
import { ProgressIndicator, MobileStepNavigation } from './ProgressIndicator';
import { ServiceSelection } from './steps/ServiceSelection';
import { AddonsSelection } from './steps/AddonsSelection';
import { ScheduleInfo } from './steps/ScheduleInfo';
import { CustomerInfo } from './steps/CustomerInfo';
import { PaymentInfo } from './steps/PaymentInfo';
import { ValidationSummary } from '@/components/ui/ValidationMessage';
import { Lightbox } from './components/Lightbox';
import { useEffect } from 'react';

// Step content component
function StepContent() {
  const { currentStep } = useMultiStepForm();

  switch (currentStep) {
    case 1:
      return <ServiceSelection />;
    case 2:
      return <AddonsSelection />;
    case 3:
      return <ScheduleInfo />;
    case 4:
      return <CustomerInfo />;
    case 5:
      return <PaymentInfo />;
    default:
      return null;
  }
}

// Main form wrapper
function MultiStepBookingFormContent() {
  const {
    currentStep,
    totalSteps,
    errors,
    isSubmitting,
    nextStep,
    prevStep,
    submitForm,
    validateCurrentStep,
    isMobile,
    formData,
    selectedPortfolioImage,
    closeLightbox
  } = useMultiStepForm();

  const stepLabels = [
    'Layanan',
    'Tambahan',
    'Jadwal',
    'Kontak',
    'Pembayaran'
  ];

  const handleNext = () => {
    if (currentStep === totalSteps) {
      submitForm();
    } else {
      nextStep();
    }
  };

  const handleBack = () => {
    prevStep();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === totalSteps) {
      submitForm();
    } else {
      if (validateCurrentStep()) {
        nextStep();
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      if (e.key === 'ArrowRight' && currentStep < totalSteps) {
        e.preventDefault();
        if (validateCurrentStep()) {
          nextStep();
        }
      } else if (e.key === 'ArrowLeft' && currentStep > 1) {
        e.preventDefault();
        prevStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, totalSteps, nextStep, prevStep, validateCurrentStep]);

  const currentErrors = errors[currentStep] || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-display text-olive-900 mb-2">
          Booking Sesi Foto
        </h1>
        <p className="text-olive-600 text-sm md:text-base">
          Proses 5 langkah mudah untuk booking sesi foto Anda bersama CeritaKita
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <ProgressIndicator
          currentStep={currentStep}
          totalSteps={totalSteps}
          stepLabels={stepLabels}
          isLoading={isSubmitting}
        />
      </div>

      {/* Form Content */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        {/* Main Content */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-olive-200 animate-slide-up">
            <StepContent />
          </div>

          {/* Validation Errors */}
          {currentErrors.length > 0 && (
            <div className="animate-fade-in">
              <ValidationSummary errors={currentErrors} />
            </div>
          )}
        </div>

        {/* Sidebar - Order Summary */}
        <div className="lg:col-span-5 space-y-6">
          {/* Mobile: Show summary only on payment step */}
          {(!isMobile || currentStep === 5) && (
            <div className="bg-gradient-to-br from-cream-100 to-cream-200 p-6 rounded-2xl shadow-sm border-2 border-olive-200 sticky top-4">
              <h3 className="font-display text-lg text-olive-800 mb-4">Ringkasan Sementara</h3>

              {/* Dynamic Summary */}
              <div className="space-y-3 text-sm">
                {/* Service */}
                {currentStep >= 1 && (
                  <div className="flex justify-between items-start">
                    <span className="text-olive-600">Layanan:</span>
                    <span className="font-bold text-olive-800 text-right">
                      {formData.serviceName || '-'}
                    </span>
                  </div>
                )}

                {/* Add-ons */}
                {currentStep >= 2 && formData.addons.length > 0 && (
                  <div className="flex justify-between items-start">
                    <span className="text-olive-600">Tambahan:</span>
                    <span className="font-bold text-olive-800 text-right">
                      {formData.addons.length} item
                    </span>
                  </div>
                )}

                {/* Schedule */}
                {currentStep >= 3 && (formData.date || formData.time) && (
                  <div className="flex justify-between items-start">
                    <span className="text-olive-600">Jadwal:</span>
                    <span className="font-bold text-olive-800 text-right">
                      {formData.date} {formData.time}
                    </span>
                  </div>
                )}

                {/* Customer */}
                {currentStep >= 4 && formData.name && (
                  <div className="flex justify-between items-start">
                    <span className="text-olive-600">Nama:</span>
                    <span className="font-bold text-olive-800 text-right">
                      {formData.name}
                    </span>
                  </div>
                )}

                {/* Total */}
                {currentStep >= 1 && formData.totalPrice > 0 && (
                  <div className="border-t-2 border-olive-300 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-display text-olive-900">Total:</span>
                      <span className="font-display text-gold-600 text-lg">
                        Rp {formData.totalPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Tips */}
              <div className="mt-4 p-3 bg-white rounded-lg border border-olive-200">
                <p className="text-xs text-olive-600">
                  <strong className="text-gold-600">Tips:</strong> {getStepTip(currentStep)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons - Inside Form */}
        <div className="lg:col-span-12">
          <MobileStepNavigation
            currentStep={currentStep}
            totalSteps={totalSteps}
            onBack={handleBack}
            onNext={handleNext}
            isNextDisabled={isSubmitting || currentErrors.length > 0}
          />
        </div>
      </form>

      {/* Keyboard Shortcuts Info */}
      <div className="hidden md:block mt-8 text-center text-xs text-olive-500">
        <p>
          <kbd className="px-2 py-1 bg-cream-200 border border-olive-300 rounded">←</kbd>
          <span className="mx-1">Kembali</span>
          <kbd className="px-2 py-1 bg-cream-200 border border-olive-300 rounded">→</kbd>
          <span className="mx-1">Lanjut</span>
          <span className="ml-4">Gunakan tombol panah keyboard untuk navigasi</span>
        </p>
      </div>

      {/* Lightbox Modal */}
      <Lightbox
        imageUrl={selectedPortfolioImage}
        onClose={closeLightbox}
      />
    </div>
  );
}

// Helper function to get step tips
function getStepTip(step: number): string {
  switch (step) {
    case 1:
      return 'Pilih layanan utama yang sesuai dengan kebutuhan Anda';
    case 2:
      return 'Tambahkan layanan tambahan jika diperlukan (opsional)';
    case 3:
      return 'Pilih tanggal dan jam yang nyaman untuk Anda';
    case 4:
      return 'Pastikan nomor WhatsApp aktif untuk konfirmasi';
    case 5:
      return 'Upload bukti transfer setelah melakukan DP';
    default:
      return 'Lengkapi semua langkah untuk booking yang sukses';
  }
}

// Main exported component
export default function MultiStepBookingForm() {
  return (
    <MultiStepFormProvider>
      <MultiStepBookingFormContent />
    </MultiStepFormProvider>
  );
}