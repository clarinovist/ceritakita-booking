import { PortfolioImage } from '@/lib/types';

export type { PortfolioImage };

export interface HomepageContent {
    id: string;
    section: 'hero' | 'about' | 'cta' | 'footer' | 'promo' | 'testimonials_config';
    content_key: string;
    content_value: string;
}

export interface ServiceCategory {
    id: string;
    name: string;
    slug: string;
    description?: string;
    thumbnail_url?: string;
    display_order: number;
    is_active: number; // SQLite stores booleans as 0/1
}

export interface Testimonial {
    id: string;
    quote: string;
    author_name: string;
    author_title?: string;
    display_order: number;
    is_active: number;
}

export interface ValueProposition {
    id: string;
    title: string;
    description: string;
    icon: string;
    display_order: number;
    is_active: number;
}

// GalleryImage removed in favor of PortfolioImage

export interface HomepageData {
    hero: Record<string, string>;
    about: Record<string, string>;
    promo: Record<string, string>;
    cta: Record<string, string>;
    footer: Record<string, string>;
    testimonials_config: Record<string, string>;
    categories: ServiceCategory[];
    testimonials: Testimonial[];
    valueProps: ValueProposition[];
    portfolioImages: (PortfolioImage & { service_name: string })[];
}
