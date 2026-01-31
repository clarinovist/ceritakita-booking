import {
  Navbar,
  HeroSection,
  AboutSection,
  PackagesGrid,
  WhyChooseUsSection,
  PromoSection,
  TestimonialsSection,
  CTASection,
  Footer,
  GallerySection,
} from '@/components/homepage';

import JsonLd from '@/components/seo/JsonLd';
import { buildHomeJsonLd } from '@/lib/seo/schema';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

export default function Home() {
  return (
    <main className="bg-olive-900">
      <JsonLd data={buildHomeJsonLd()} />
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <HeroSection />

      {/* About Section */}
      <AboutSection />

      {/* Package Categories Grid */}
      <PackagesGrid />

      {/* Why Choose Us */}
      <WhyChooseUsSection />

      {/* Gallery Section */}
      <GallerySection />

      {/* Promo Section */}
      <PromoSection />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </main>
  );
}
