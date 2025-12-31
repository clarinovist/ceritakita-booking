/**
 * Addon Types
 * Centralized type definitions for booking add-ons
 */

export interface Addon {
  /** Unique identifier for the addon */
  id: string;
  
  /** Display name of the addon */
  name: string;
  
  /** Price of the addon */
  price: number;
  
  /** Categories that this addon applies to */
  applicable_categories?: string[];
  
  /** Whether the addon is currently active */
  is_active: boolean;
  
  /** When the addon was created */
  created_at?: string;
}

export interface AddonFormData {
  /** Addon name input */
  name: string;
  
  /** Price input */
  price: number;
  
  /** Applicable categories */
  applicable_categories: string[];
  
  /** Active status toggle */
  is_active: boolean;
}

export interface BookingAddon {
  /** ID of the addon being booked */
  addon_id: string;
  
  /** Name of the addon at time of booking */
  addon_name: string;
  
  /** Quantity of this addon */
  quantity: number;
  
  /** Price per unit at booking time */
  price_at_booking: number;
}