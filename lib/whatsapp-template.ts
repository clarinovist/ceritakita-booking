/**
 * WhatsApp Template Utility
 * Handles template rendering, validation, and WhatsApp link generation
 */

import { logger } from './logger';

// Allowed variables for security
const ALLOWED_VARIABLES = new Set([
  'customer_name',
  'service',
  'date',
  'time',
  'total_price',
  'booking_id'
]);

/**
 * Escape HTML entities to prevent injection attacks
 */
function escapeHtmlEntities(text: string): string {
  const escapeMap: Record<string, string> = {
    '&': '&',
    '<': '<',
    '>': '>',
    '"': '"',
    "'": "'",
    '/': '/'
  };

  return text.replace(/[&<>"']/g, (char) => escapeMap[char] || char);
}

/**
 * Render template with variables
 * Safe replacement with whitelist validation
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string>,
  options: {
    escapeHtml?: boolean;
    maxLength?: number;
  } = {}
): string {
  const { escapeHtml = true, maxLength = 500 } = options;

  // Validate template length
  if (template.length > maxLength) {
    throw new Error(`Template exceeds maximum length of ${maxLength} characters`);
  }

  // Perform safe variable replacement
  const result = template.replace(/\{\{(\w+)\}\}/g, (_, variableName) => {
    // Check if variable is allowed
    if (!ALLOWED_VARIABLES.has(variableName)) {
      logger.warn(`Unknown variable in template: ${variableName}`);
      return ''; // Return empty for unknown variables
    }

    // Get variable value
    const value = variables[variableName] || '';

    // Apply HTML escaping if enabled
    if (escapeHtml) {
      return escapeHtmlEntities(value);
    }

    return value;
  });

  return result;
}

/**
 * Validate template syntax and required variables
 */
export function validateTemplate(template: string): string[] {
  const errors: string[] = [];

  // Check for required variables
  const requiredVars = ['customer_name', 'service'];
  const foundVars = new Set<string>();

  template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    foundVars.add(varName);
    return match;
  });

  // Check missing required variables
  for (const required of requiredVars) {
    if (!foundVars.has(required)) {
      errors.push(`Missing required variable: ${required}`);
    }
  }

  // Check for unknown variables
  const matches = template.matchAll(/\{\{(\w+)\}\}/g);
  const matchesArray = Array.from(matches);
  for (const match of matchesArray) {
    const varName = match[1];
    if (varName && !ALLOWED_VARIABLES.has(varName)) {
      errors.push(`Unknown variable: ${varName}`);
    }
  }

  // Check length
  if (template.length > 500) {
    errors.push('Template exceeds 500 character limit');
  }

  return errors;
}

/**
 * Normalize phone number for WhatsApp
 * Converts Indonesian formats to international format
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');

  // Handle Indonesian numbers
  if (digits.startsWith('0')) {
    digits = '62' + digits.substring(1);
  } else if (digits.startsWith('62')) {
    // Already in correct format
  } else if (digits.startsWith('+')) {
    // Remove leading +
    digits = digits.substring(1);
  }

  return digits;
}

/**
 * Generate WhatsApp link with pre-filled message
 */
export function generateWhatsAppLink(
  phoneNumber: string,
  message: string
): string {
  // Normalize phone number
  const normalizedNumber = normalizePhoneNumber(phoneNumber);

  // URL encode the message
  const encodedMessage = encodeURIComponent(message);

  // Construct WhatsApp link
  return `https://wa.me/${normalizedNumber}?text=${encodedMessage}`;
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return price.toLocaleString('id-ID');
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Format time for display
 */
export function formatTime(timeString: string): string {
  // Assuming time is in HH:mm format
  return timeString;
}

/**
 * Generate WhatsApp message from booking data
 */
export function generateWhatsAppMessage(
  template: string,
  bookingData: {
    customer_name: string;
    service: string;
    date: string;
    time: string;
    total_price: number;
    booking_id: string;
  }
): string {
  const variables = {
    customer_name: bookingData.customer_name,
    service: bookingData.service,
    date: formatDate(bookingData.date),
    time: formatTime(bookingData.time),
    total_price: formatPrice(bookingData.total_price),
    booking_id: bookingData.booking_id
  };

  return renderTemplate(template, variables);
}

/**
 * Test template with sample data
 */
export function testTemplate(
  template: string,
  whatsappNumber: string
): {
  renderedMessage: string;
  whatsappLink: string;
  errors: string[];
} {
  const errors = validateTemplate(template);

  if (errors.length > 0) {
    return {
      renderedMessage: '',
      whatsappLink: '',
      errors
    };
  }

  // Sample data for testing
  const sampleData = {
    customer_name: 'John Doe',
    service: 'Wedding Photography',
    date: '2024-01-15',
    time: '14:00',
    total_price: 5000000,
    booking_id: 'BK-2024001'
  };

  const renderedMessage = generateWhatsAppMessage(template, sampleData);
  const whatsappLink = generateWhatsAppLink(whatsappNumber, renderedMessage);

  return {
    renderedMessage,
    whatsappLink,
    errors: []
  };
}