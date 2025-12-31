/**
 * Payment Types
 * Centralized type definitions for payment-related functionality
 */

export interface PaymentMethod {
  /** Unique identifier for the payment method */
  id: string;
  
  /** Display name of the payment method (e.g., "Bank BCA", "QRIS") */
  name: string;
  
  /** Account holder name */
  account_name: string;
  
  /** Account number or identifier */
  account_number: string;
  
  /** Optional image URL for QR codes */
  image_url?: string;
  
  /** Whether the payment method is active */
  is_active: boolean;
  
  /** When the payment method was created/updated */
  created_at: string;
}

export interface CreatePaymentMethodInput {
  /** Payment method name */
  name: string;
  
  /** Account holder name */
  account_name: string;
  
  /** Account number */
  account_number: string;
  
  /** Optional image URL */
  image_url?: string;
  
  /** Active status */
  is_active?: boolean;
}

export interface UpdatePaymentMethodInput {
  /** Payment method name */
  name?: string;
  
  /** Account holder name */
  account_name?: string;
  
  /** Account number */
  account_number?: string;
  
  /** Optional image URL */
  image_url?: string;
  
  /** Active status */
  is_active?: boolean;
}

export interface PaymentSettings {
  /** Unique identifier */
  id: string;
  
  /** Bank name */
  bank_name: string;
  
  /** Account holder name */
  account_name: string;
  
  /** Account number */
  account_number: string;
  
  /** QRIS image URL (optional) */
  qris_image_url?: string;
  
  /** Last updated timestamp */
  updated_at: string;
}