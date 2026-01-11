/**
 * Portfolio Types
 * Centralized type definitions for portfolio images
 */

export interface PortfolioImage {
  /** Unique identifier for the portfolio image */
  id: string;

  /** Service ID this image belongs to */
  service_id: string;

  /** URL to the image */
  image_url: string;

  /** Display order (for sorting) */
  display_order: number;

  /** When the image was added */
  created_at: string;

  /** Visibility status (1=active, 0=inactive) */
  is_active: number;
}

export interface PortfolioFormData {
  /** Service ID selection */
  service_id: string;

  /** Image file to upload */
  image_file?: File;

  /** Display order input */
  display_order: number;
}