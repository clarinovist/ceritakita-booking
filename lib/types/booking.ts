/**
 * Booking Types
 * Centralized type definitions for booking system
 */

import { Service } from './service';
import { Addon, BookingAddon } from './addon';

// Payment Types
export interface Payment {
  /** Date of payment */
  date: string;
  
  /** Payment amount */
  amount: number;
  
  /** Payment note/description */
  note: string;
  
  /** Base64 encoded proof (deprecated, kept for backward compatibility) */
  proof_base64?: string;
  
  /** Relative path to uploaded proof file */
  proof_filename?: string;
}

export interface FinanceData {
  /** Total price for the booking */
  total_price: number;
  
  /** Array of payments made */
  payments: Payment[];
  
  /** Service base price before discount */
  service_base_price?: number;
  
  /** Service discount value */
  base_discount?: number;
  
  /** Total from all add-ons */
  addons_total?: number;
  
  /** Coupon discount applied */
  coupon_discount?: number;
  
  /** Coupon code used (if any) */
  coupon_code?: string;
}

// Customer Types
export interface CustomerData {
  /** Customer name */
  name: string;
  
  /** WhatsApp contact number */
  whatsapp: string;
  
  /** Service category */
  category: 'Indoor' | 'Indoor Studio' | 'Outdoor' | 'Outdoor / On Location' | 'Wedding' | 'Prewedding Bronze' | 'Prewedding Gold' | 'Prewedding Silver' | 'Wisuda' | 'Family' | 'Birthday' | 'Pas Foto' | 'Self Photo';
  
  /** Service ID (optional) */
  serviceId?: string;
}

// Booking Data Types
export interface BookingData {
  /** Booking date */
  date: string;
  
  /** Booking notes */
  notes: string;
  
  /** Location link */
  location_link: string;
}

export interface RescheduleHistory {
  /** History entry ID */
  id?: number;
  
  /** Original date */
  old_date: string;
  
  /** New date after reschedule */
  new_date: string;
  
  /** When the reschedule occurred */
  rescheduled_at: string;
  
  /** Reason for reschedule */
  reason?: string;
}

export interface Booking {
  /** Unique booking identifier */
  id: string;
  
  /** Creation timestamp */
  created_at: string;
  
  /** Booking status */
  status: 'Active' | 'Cancelled' | 'Rescheduled' | 'Completed';
  
  /** Customer information */
  customer: CustomerData;
  
  /** Booking details */
  booking: BookingData;
  
  /** Financial information */
  finance: FinanceData;
  
  /** Assigned photographer ID */
  photographer_id?: string;
  
  /** Selected add-ons */
  addons?: BookingAddon[];
  
  /** Reschedule history */
  reschedule_history?: RescheduleHistory[];
}

// Form Data Types
export interface BookingFormData {
  /** Customer name */
  name: string;
  
  /** WhatsApp number */
  whatsapp: string;
  
  /** Booking date */
  date: string;
  
  /** Booking time */
  time: string;
  
  /** Service category */
  category: string;
  
  /** Location link */
  location_link: string;
  
  /** Booking notes */
  notes: string;
  
  /** Down payment amount */
  dp_amount: string;
}

export interface BookingPayload {
  /** Customer data */
  customer: {
    name: string;
    whatsapp: string;
    category: string;
    serviceId?: string;
  };
  
  /** Booking data */
  booking: {
    date: string;
    notes: string;
    location_link: string;
  };
  
  /** Financial data */
  finance: {
    total_price: number;
    payments: Array<{
      date: string;
      amount: number;
      note: string;
      proof_base64?: string;
    }>;
    service_base_price: number;
    base_discount: number;
    addons_total: number;
    coupon_discount: number;
    coupon_code?: string;
  };
  
  /** Add-ons */
  addons?: Array<{
    addon_id: string;
    addon_name: string;
    quantity: number;
    price_at_booking: number;
  }>;
}

export interface RescheduleFormData {
  /** New date for booking */
  newDate: string;
  
  /** New time for booking */
  newTime: string;
  
  /** Reason for reschedule */
  reason: string;
}

// Status and Utility Types
export type BookingStatus = 'Active' | 'Cancelled' | 'Rescheduled' | 'Completed';

export const getBookingStatusColor = (status: BookingStatus): string => {
  switch (status) {
    case 'Active':
      return 'bg-green-100 text-green-700';
    case 'Cancelled':
      return 'bg-red-100 text-red-700';
    case 'Rescheduled':
      return 'bg-orange-100 text-orange-700';
    case 'Completed':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

// Export BookingAddon from addon.ts for backward compatibility
export type { BookingAddon } from './addon';