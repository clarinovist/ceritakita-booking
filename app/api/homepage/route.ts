import { NextResponse } from 'next/server';
import { HomepageData } from '@/types/homepage';
import { createErrorResponse } from '@/lib/logger';
import {
  getAllHomepageContent,
  getActiveServiceCategories,
  getActiveTestimonials,
  getActiveValuePropositions,
  getActivePortfolioImagesWithService
} from '@/lib/repositories/homepage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const contentRows = getAllHomepageContent();

    const contentMap: Record<string, Record<string, string>> = {
      hero: {},
      about: {},
      promo: {},
      cta: {},
      footer: {},
      testimonials_config: {}
    };

    contentRows.forEach(row => {
      const sectionData = contentMap[row.section];
      if (sectionData) {
        sectionData[row.content_key] = row.content_value;
      }
    });

    const categories = getActiveServiceCategories();
    const testimonials = getActiveTestimonials();
    const valueProps = getActiveValuePropositions();
    const portfolioImages = getActivePortfolioImagesWithService();

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
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
