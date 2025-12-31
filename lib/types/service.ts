/**
 * Service Types
 * Centralized type definitions for photography services
 */

export interface Service {
  /** Unique identifier for the service */
  id: string;
  
  /** Display name of the service */
  name: string;
  
  /** Base price before any discounts */
  basePrice: number;
  
  /** Discount value to be applied */
  discountValue: number;
  
  /** Whether the service is currently active */
  isActive: boolean;
  
  /** Optional badge text to display (e.g., "Popular", "New") */
  badgeText?: string;
}

export interface ServiceFormData {
  /** Service name input */
  name: string;
  
  /** Base price input */
  basePrice: number;
  
  /** Discount value input */
  discountValue: number;
  
  /** Active status toggle */
  isActive: boolean;
  
  /** Optional badge text */
  badgeText: string;
}