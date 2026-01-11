'use client';

import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ValidationMessageProps {
  message: string | null;
  type?: 'error' | 'success' | 'info';
  showIcon?: boolean;
  className?: string;
  dismissible?: boolean;
}

/**
 * ValidationMessage Component
 * Provides inline validation feedback with ARIA support
 */
export function ValidationMessage({
  message,
  type = 'error',
  showIcon = true,
  className = '',
  dismissible = false
}: ValidationMessageProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (message) {
      setIsDismissed(false);
    }
  }, [message]);

  if (!message || isDismissed) return null;

  const styles = {
    error: {
      bg: 'bg-error-50',
      border: 'border-error-200',
      text: 'text-error-700',
      icon: 'text-error-500',
      aria: 'assertive',
    },
    success: {
      bg: 'bg-success-50',
      border: 'border-success-200',
      text: 'text-success-700',
      icon: 'text-success-500',
      aria: 'polite',
    },
    info: {
      bg: 'bg-primary-50',
      border: 'border-primary-200',
      text: 'text-primary-700',
      icon: 'text-primary-500',
      aria: 'polite',
    },
  };

  const currentStyle = styles[type];

  const Icon = () => {
    if (!showIcon) return null;
    if (type === 'success') return <CheckCircle2 size={18} className={currentStyle.icon} />;
    if (type === 'error') return <XCircle size={18} className={currentStyle.icon} />;
    return <AlertCircle size={18} className={currentStyle.icon} />;
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <div
      role="alert"
      aria-live={currentStyle.aria as "assertive" | "polite" | "off"}
      className={`flex items-start gap-2 p-3 rounded-lg border ${currentStyle.bg} ${currentStyle.border} ${currentStyle.text} ${className} animate-fade-in`}
    >
      <Icon />

      <div className="flex-1 text-sm font-medium leading-relaxed">
        {message}
      </div>

      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          className="ml-2 p-1 rounded hover:bg-white/50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-current"
          aria-label="Tutup notifikasi"
        >
          <XCircle size={16} className={currentStyle.icon} />
        </button>
      )}
    </div>
  );
}

/**
 * ValidationSummary Component
 * Shows summary of all validation errors
 */
export function ValidationSummary({ errors }: { errors: { field: string; message: string }[] }) {
  if (!errors || errors.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="bg-error-50 border-error-200 border rounded-lg p-4 animate-slide-up"
    >
      <div className="flex items-center gap-2 mb-2">
        <XCircle size={20} className="text-error-500" />
        <h3 className="font-bold text-error-700">Terdapat {errors.length} kesalahan:</h3>
      </div>

      <ul className="list-disc list-inside space-y-1 ml-6 text-sm text-error-700">
        {errors.map((error, index) => (
          <li key={index} className="pl-1">
            {error.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * FieldValidationWrapper Component
 * Wraps form fields with validation state
 */
export function FieldValidationWrapper({
  children,
  error,
  success = false,
  label,
}: {
  children: React.ReactNode;
  error: string | null;
  success?: boolean;
  label?: string;
}) {
  const hasError = !!error;
  const hasSuccess = success && !hasError;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}

      <div
        className={`
          relative transition-all duration-200
          ${hasError ? 'ring-2 ring-error-300 border-error-400' : ''}
          ${hasSuccess ? 'ring-2 ring-success-300 border-success-400' : ''}
          ${!hasError && !hasSuccess ? 'focus-within:ring-2 focus-within:ring-primary-300' : ''}
        `}
      >
        {children}

        {/* Validation Icons */}
        {hasSuccess && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <CheckCircle2 size={18} className="text-success-500" />
          </div>
        )}

        {hasError && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <XCircle size={18} className="text-error-500" />
          </div>
        )}
      </div>

      {/* Inline Error Message */}
      {hasError && (
        <ValidationMessage
          message={error}
          type="error"
          showIcon={true}
          className="mt-1"
        />
      )}
    </div>
  );
}

/**
 * useFieldValidation Hook
 * Custom hook for managing field validation state
 */
export function useFieldValidation<T>(validator: (value: T) => string | null) {
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const validate = (value: T) => {
    const validationError = validator(value);
    setError(validationError);
    setIsValid(!validationError);
    return !validationError;
  };

  const handleBlur = (value: T) => {
    setTouched(true);
    validate(value);
  };

  const handleChange = (value: T) => {
    // Only validate on blur for better UX, but clear error if it exists
    if (error) {
      const validationError = validator(value);
      setError(validationError);
      setIsValid(!validationError);
    }
  };

  const reset = () => {
    setError(null);
    setTouched(false);
    setIsValid(false);
  };

  return {
    error,
    touched,
    isValid,
    validate,
    handleBlur,
    handleChange,
    reset,
    hasError: touched && !!error,
  };
}