/**
 * Coupon Types
 * Centralized type definitions for discount coupons
 */

export interface Coupon {
  /** Unique identifier for the coupon */
  id: string;
  
  /** Coupon code that users enter */
  code: string;
  
  /** Type of discount */
  discount_type: 'percentage' | 'fixed';
  
  /** Discount value (percentage or fixed amount) */
  discount_value: number;
  
  /** Maximum discount amount (for percentage discounts) */
  max_discount?: number;
  
  /** Minimum purchase amount required */
  min_purchase?: number;
  
  /** Expiration date */
  valid_until?: string;
  
  /** Description of the coupon */
  description?: string;
  
  /** Whether the coupon is currently active */
  is_active: boolean;
}

export interface CouponValidation {
  /** Whether the coupon is valid */
  valid: boolean;
  
  /** The coupon object if valid */
  coupon?: Coupon;
  
  /** Calculated discount amount */
  discount_amount: number;
  
  /** Error message if invalid */
  error?: string;
}

export interface CouponUsage {
  /** Usage record ID */
  id: number;
  
  /** Coupon ID used */
  coupon_id: string;
  
  /** Coupon code used */
  coupon_code: string;
  
  /** Booking ID that used the coupon */
  booking_id: string;
  
  /** Discount amount applied */
  discount_amount: number;
  
  /** When the coupon was used */
  used_at: string;
}