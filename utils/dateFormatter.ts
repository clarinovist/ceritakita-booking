/**
 * Date formatting utilities
 * Provides consistent date/time formatting across the application
 * Format: DD-MM-YYYY for Indonesian locale
 */

/**
 * Format date to DD-MM-YYYY
 * @param date - Date string or Date object
 * @returns Formatted date string (DD-MM-YYYY)
 */
export const formatDate = (date: string | Date): string => {
  if (!date) return '-';

  try {
    const d = new Date(date);

    // Check if date is valid
    if (isNaN(d.getTime())) return '-';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};

/**
 * Format date and time to DD-MM-YYYY HH:mm
 * @param date - Date string or Date object
 * @returns Formatted date-time string (DD-MM-YYYY HH:mm)
 */
export const formatDateTime = (date: string | Date): string => {
  if (!date) return '-';

  try {
    const d = new Date(date);

    // Check if date is valid
    if (isNaN(d.getTime())) return '-';

    const dateStr = formatDate(d);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${dateStr} ${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return '-';
  }
};

/**
 * Format time only to HH:mm
 * @param date - Date string or Date object
 * @returns Formatted time string (HH:mm)
 */
export const formatTime = (date: string | Date): string => {
  if (!date) return '-';

  try {
    const d = new Date(date);

    // Check if date is valid
    if (isNaN(d.getTime())) return '-';

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return '-';
  }
};

/**
 * Format date to YYYY-MM-DD (for input fields)
 * @param date - Date string or Date object
 * @returns Formatted date string (YYYY-MM-DD)
 */
export const formatDateForInput = (date: string | Date): string => {
  if (!date) return '';

  try {
    const d = new Date(date);

    // Check if date is valid
    if (isNaN(d.getTime())) return '';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
};

/**
 * Format date with short month name (DD MMM YYYY)
 * @param date - Date string or Date object
 * @returns Formatted date string (e.g., "31 Des 2024")
 */
export const formatDateShort = (date: string | Date): string => {
  if (!date) return '-';

  try {
    const d = new Date(date);

    // Check if date is valid
    if (isNaN(d.getTime())) return '-';

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    return `${day} ${month} ${year}`;
  } catch (error) {
    console.error('Error formatting date short:', error);
    return '-';
  }
};
