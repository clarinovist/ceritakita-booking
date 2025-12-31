/**
 * Booking Components Barrel Exports
 *
 * This file provides a single entry point for all booking-related components and utilities.
 * Use this to import booking features with clean, short imports.
 *
 * @example
 * ```typescript
 * // Instead of:
 * import { MultiStepBookingForm } from '@/components/booking/MultiStepBookingForm'
 * import { ServiceSelection } from '@/components/booking/steps/ServiceSelection'
 *
 * // Use:
 * import { MultiStepBookingForm, ServiceSelection } from '@/components/booking'
 * ```
 *
 * @note Custom hooks like useBookingForm should be imported directly from their files
 * as they may require 'use client' directives in specific contexts.
 */

// Main Components
/** Main booking form component for single-step booking */
export { default as BookingForm } from './BookingForm';
/** Multi-step booking form component with progressive flow */
export { default as MultiStepBookingForm } from './MultiStepBookingForm';

// Named exports from MultiStepForm
/** Context provider for multi-step form state management */
export { MultiStepFormProvider, useMultiStepForm } from './MultiStepForm';

// Named exports from ProgressIndicator
/** Progress indicator component showing current step */
export { ProgressIndicator, MobileStepNavigation } from './ProgressIndicator';


// Steps
/** Service selection step component */
export { ServiceSelection } from './steps/ServiceSelection';
/** Add-ons selection step component */
export { AddonsSelection } from './steps/AddonsSelection';
/** Portfolio showcase step component */
export { PortfolioShowcase } from './steps/PortfolioShowcase';
/** Customer information step component */
export { CustomerInfo } from './steps/CustomerInfo';
/** Schedule information step component */
export { ScheduleInfo } from './steps/ScheduleInfo';
/** Payment information step component */
export { PaymentInfo } from './steps/PaymentInfo';
/** Order summary step component */
export { OrderSummary } from './steps/OrderSummary';

// Step index (if needed for dynamic step handling)
export * from './steps/index';

// Components
/** Lightbox component for image viewing */
export { Lightbox } from './components/Lightbox';
/** Countdown timer component for booking deadlines */
export { CountdownTimer } from './components/CountdownTimer';
/** Payment details component */
export { PaymentDetails } from './components/PaymentDetails';