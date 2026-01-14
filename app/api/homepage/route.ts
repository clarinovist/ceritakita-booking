import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { HomepageData, HomepageContent, ServiceCategory, Testimonial, ValueProposition, PortfolioImage } from '@/types/homepage';

export const revalidate = 60;

export async function GET() {
    try {
        const db = getDb();

        // Fetch all key-value content
        const contentRows = db.prepare('SELECT * FROM homepage_content').all() as HomepageContent[];

        // Transform content into nested objects
        const contentMap: Record<string, Record<string, string>> = {
            hero: {},
            about: {},
            promo: {},
            cta: {},
            footer: {},
            testimonials_config: {}
        };

        contentRows.forEach(row => {
            // Ensure the section key exists in contentMap before assigning
            const sectionData = contentMap[row.section];
            if (sectionData) {
                sectionData[row.content_key] = row.content_value;
            }
        });

        // Fetch lists
        const categories = db.prepare('SELECT * FROM service_categories WHERE is_active = 1 ORDER BY display_order ASC').all() as ServiceCategory[];
        const testimonials = db.prepare('SELECT * FROM testimonials WHERE is_active = 1 ORDER BY display_order ASC').all() as Testimonial[];
        const valueProps = db.prepare('SELECT * FROM value_propositions WHERE is_active = 1 ORDER BY display_order ASC').all() as ValueProposition[];

        // Fetch portfolio images with service names
        const portfolioImages = db.prepare(`
            SELECT p.id, p.image_url, p.service_id, s.name as service_name, p.display_order
            FROM portfolio_images p
            JOIN service_categories s ON p.service_id = s.id
            WHERE p.is_active = 1 AND s.is_active = 1
            ORDER BY p.display_order ASC
        `).all() as (PortfolioImage & { service_name: string })[];

        const responseData: HomepageData = {
            hero: contentMap.hero || {},
            about: contentMap.about || {},
            promo: contentMap.promo || {},
            cta: contentMap.cta || {},
            footer: contentMap.footer || {},
            testimonials_config: contentMap.testimonials_config || {},
            categories,
            testimonials,
            valueProps,
            portfolioImages
        };

        return NextResponse.json(responseData);
    } catch (error) {
        console.error('Error fetching homepage data:', error);
        return NextResponse.json({ error: 'Failed to fetch homepage data' }, { status: 500 });
    }
}
