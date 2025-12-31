/**
 * Photographer Types
 * Centralized type definitions for photographers
 */

export interface Photographer {
  /** Unique identifier for the photographer */
  id: string;
  
  /** Display name of the photographer */
  name: string;
  
  /** Contact phone number */
  phone?: string;
  
  /** Specialization or expertise */
  specialty?: string;
  
  /** Whether the photographer is currently active */
  is_active: boolean;
  
  /** When the photographer was created */
  created_at: string;
}

export interface PhotographerFormData {
  /** Photographer name input */
  name: string;
  
  /** Phone number input */
  phone: string;
  
  /** Specialty input */
  specialty: string;
  
  /** Active status toggle */
  is_active: boolean;
}