/**
 * System Settings - Comprehensive Configuration Interface
 * Organized by category for better maintainability
 */

// 1. Branding & SEO Settings
export interface GeneralSettings {
  site_name: string;
  site_logo: string;
  meta_title: string;
  meta_description: string;
}

// 2. Core Contact Settings (Business Identity / Invoices)
export interface ContactSettings {
  whatsapp_admin_number: string;
  business_email: string;
  business_phone: string;
  business_address: string;
}

// 3. Finance Settings
export interface FinanceSettings {
  bank_name: string;
  bank_number: string;
  bank_holder: string;
  invoice_notes: string;
  requires_deposit: boolean;
  deposit_amount: number; // percentage
  tax_rate: number; // percentage
}

// 4. Booking Rules Settings
export interface BookingRulesSettings {
  min_booking_notice: number; // days
  max_booking_ahead: number; // days
}

// 5. Templates Settings
export interface TemplatesSettings {
  whatsapp_message_template: string;
}

// Combined System Settings Interface
export interface SystemSettings
  extends GeneralSettings,
  ContactSettings,
  FinanceSettings,
  BookingRulesSettings,
  TemplatesSettings { }

// Context Type
export interface SettingsContextType {
  settings: SystemSettings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

// Audit Log Interface
export interface SettingsAuditLog {
  id: number;
  key: string;
  old_value: string | null;
  new_value: string;
  updated_by: string;
  updated_at: string;
}

// API Response Types
export interface SettingsApiResponse {
  success: boolean;
  message: string;
  settings: SystemSettings;
}

// Partial settings for updates
export type SettingsUpdatePayload = Partial<SystemSettings>;
