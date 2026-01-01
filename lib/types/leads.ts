/**
 * Leads Types
 * Centralized type definitions for Leads Management (Mini CRM) system
 */

export type LeadStatus = 'New' | 'Contacted' | 'Follow Up' | 'Won' | 'Lost' | 'Converted';

export type LeadSource = 'Meta Ads' | 'Organic' | 'Referral' | 'Instagram' | 'WhatsApp' | 'Phone Call' | 'Website Form' | 'Other';

export interface Lead {
  /** Unique lead identifier */
  id: string;
  
  /** Lead creation timestamp */
  created_at: string;
  
  /** Last updated timestamp */
  updated_at: string;
  
  /** Lead name */
  name: string;
  
  /** WhatsApp number (primary contact) */
  whatsapp: string;
  
  /** Email (optional) */
  email?: string;
  
  /** Lead status */
  status: LeadStatus;
  
  /** Lead source */
  source: LeadSource;
  
  /** Notes about the lead */
  notes?: string;
  
  /** Assigned staff/admin user ID */
  assigned_to?: string;
  
  /** Booking ID if converted to booking */
  booking_id?: string;
  
  /** Conversion timestamp */
  converted_at?: string;
  
  /** Last contact timestamp */
  last_contacted_at?: string;
  
  /** Next follow-up date */
  next_follow_up?: string;
}

export interface LeadFormData {
  name: string;
  whatsapp: string;
  email?: string;
  source: LeadSource;
  status: LeadStatus;
  notes?: string;
  assigned_to?: string;
  next_follow_up?: string;
}

export interface LeadUpdateData {
  name?: string;
  whatsapp?: string;
  email?: string;
  source?: LeadSource;
  status?: LeadStatus;
  notes?: string;
  assigned_to?: string;
  booking_id?: string;
  converted_at?: string;
  last_contacted_at?: string;
  next_follow_up?: string;
}

export interface LeadFilters {
  status?: LeadStatus;
  source?: LeadSource;
  assigned_to?: string;
  date_range?: {
    start: string;
    end: string;
  };
  search?: string;
}

// UI utility types
export const getLeadStatusColor = (status: LeadStatus): string => {
  switch (status) {
    case 'New':
      return 'bg-blue-100 text-blue-700';
    case 'Contacted':
      return 'bg-cyan-100 text-cyan-700';
    case 'Follow Up':
      return 'bg-amber-100 text-amber-700';
    case 'Won':
      return 'bg-green-100 text-green-700';
    case 'Lost':
      return 'bg-red-100 text-red-700';
    case 'Converted':
      return 'bg-purple-100 text-purple-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export const getLeadSourceIcon = (source: LeadSource): string => {
  switch (source) {
    case 'Meta Ads':
      return '📱';
    case 'Instagram':
      return '📸';
    case 'WhatsApp':
      return '💬';
    case 'Organic':
      return '🌱';
    case 'Referral':
      return '👥';
    case 'Website Form':
      return '🌐';
    case 'Phone Call':
      return '📞';
    default:
      return '📝';
  }
};

export const LEAD_STATUSES: LeadStatus[] = ['New', 'Contacted', 'Follow Up', 'Won', 'Lost', 'Converted'];
export const LEAD_SOURCES: LeadSource[] = ['Meta Ads', 'Organic', 'Referral', 'Instagram', 'WhatsApp', 'Phone Call', 'Website Form', 'Other'];