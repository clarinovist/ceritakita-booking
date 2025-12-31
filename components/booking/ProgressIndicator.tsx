'use client';

'use client';

import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
  isLoading?: boolean;
}

/**
 * ProgressIndicator Component
 * Shows step-by-step progress with visual feedback
 * Optimized for mobile with touch-friendly targets and ARIA support
 */
export function ProgressIndicator({ 
  currentStep, 
  totalSteps, 
  stepLabels,
  isLoading = false 
}: ProgressIndicatorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Prevent hydration mismatch
    return (
      <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex justify-between items-center">
          {[...Array(totalSteps)].map((_, i) => (
            <div key={i} className="flex-1 h-2 bg-gray-200 rounded-full mx-1" />
          ))}
        </div>
      </div>
    );
  }

  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div 
      className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6"
      role="navigation"
      aria-label={`Langkah ${currentStep} dari ${totalSteps}`}
    >
      {/* Progress Bar */}
      <div className="relative mb-6">
        <div className="absolute top-1/2 left-0 w-full h-2 bg-gray-200 rounded-full -translate-y-1/2" />
        <div 
          className="absolute top-1/2 left-0 h-2 bg-primary-600 rounded-full -translate-y-1/2 transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
          role="progressbar"
          aria-valuenow={progressPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress: ${Math.round(progressPercentage)}%`}
        />
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-primary-50 px-3 py-1 rounded-full animate-pulse">
            <Loader2 size={14} className="text-primary-600 animate-spin" />
            <span className="text-xs font-semibold text-primary-700">Memproses...</span>
          </div>
        )}
      </div>

      {/* Step Indicators */}
      <div 
        className="flex justify-between items-start gap-2"
        role="list"
        aria-label="Daftar langkah booking"
      >
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <div 
              key={label}
              className="flex-1 flex flex-col items-center gap-2 min-w-0"
              role="listitem"
              aria-current={isCurrent ? 'step' : undefined}
              aria-label={`Langkah ${stepNumber}: ${label}`}
            >
              {/* Step Circle */}
              <div className="relative flex items-center justify-center">
                {isCompleted && (
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-success-100 border-2 border-success-300">
                    <CheckCircle2 
                      size={18} 
                      className="text-success-600" 
                      aria-hidden="true"
                    />
                  </div>
                )}
                
                {isCurrent && (
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 border-2 border-primary-700 shadow-md animate-bounce-subtle">
                    <span className="text-white font-bold text-sm" aria-hidden="true">
                      {stepNumber}
                    </span>
                  </div>
                )}
                
                {isUpcoming && (
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 border-2 border-gray-300">
                    <Circle 
                      size={16} 
                      className="text-gray-400" 
                      aria-hidden="true"
                    />
                  </div>
                )}
              </div>

              {/* Step Label */}
              <div className="flex-1 min-w-0 text-center">
                <span
                  className={`text-xs font-medium block truncate ${
                    isCompleted
                      ? 'text-success-700'
                      : isCurrent
                      ? 'text-primary-700 font-bold'
                      : isUpcoming
                      ? 'text-gray-400'
                      : ''
                  }`}
                >
                  {label}
                </span>
                
                {/* Mobile: Show only current step number */}
                <span className="md:hidden text-[10px] text-gray-500 font-mono mt-0.5">
                  {stepNumber}/{totalSteps}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Screen Reader Only: Current Status */}
      <div className="sr-only" role="status" aria-live="polite">
        Langkah {currentStep} dari {totalSteps}: {stepLabels[currentStep - 1]}
      </div>
    </div>
  );
}

/**
 * MobileStepNavigation Component
 * Touch-optimized navigation buttons for mobile
 */
export function MobileStepNavigation({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onSkip,
  canSkip = false,
  isNextDisabled = false,
}: {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onSkip?: () => void;
  canSkip?: boolean;
  isNextDisabled?: boolean;
}) {
  const showBack = currentStep > 1;
  const showNext = currentStep < totalSteps;
  const showSkip = canSkip && currentStep < totalSteps;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-area-inset-bottom md:relative md:bg-transparent md:border-none md:p-0 md:mt-6"
      role="toolbar"
      aria-label="Navigasi langkah"
    >
      <div className="flex gap-3 max-w-6xl mx-auto">
        {/* Back Button */}
        {showBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex-1 md:flex-none px-6 py-3 md:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all active:scale-95 touch-target"
            aria-label="Kembali ke langkah sebelumnya"
          >
            Kembali
          </button>
        )}

        {/* Skip Button */}
        {showSkip && onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="flex-1 md:flex-none px-6 py-3 md:py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium rounded-xl transition-all active:scale-95 touch-target"
            aria-label="Lewati langkah ini"
          >
            Lewati
          </button>
        )}

        {/* Next/Selesai Button */}
        {showNext ? (
          <button
            type="button"
            onClick={onNext}
            disabled={isNextDisabled}
            className={`flex-1 md:flex-none px-6 py-4 md:py-3 font-bold rounded-xl transition-all active:scale-95 touch-target flex items-center justify-center gap-2 ${
              isNextDisabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-200'
            }`}
            aria-label="Lanjut ke Langkah Berikutnya"
            aria-disabled={isNextDisabled}
          >
            <span>Lanjut</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          // Last step - Selesai button
          <button
            type="submit"
            disabled={isNextDisabled}
            className={`flex-1 md:flex-none px-6 py-4 md:py-3 font-bold rounded-xl transition-all active:scale-95 touch-target flex items-center justify-center gap-2 ${
              isNextDisabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-success-600 hover:bg-success-700 text-white shadow-lg shadow-success-200'
            }`}
            aria-label="Selesaikan Booking"
            aria-disabled={isNextDisabled}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Selesaikan</span>
          </button>
        )}
      </div>
    </div>
  );
}