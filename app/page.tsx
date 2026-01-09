import {
  Navbar,
  HeroSection,
  PackagesGrid,
  TestimonialsSection,
  WeddingPackagesSection,
  Footer,
} from '@/components/homepage';

export default function Home() {
  return (
    <main className="bg-olive-900">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section with Packages Title */}
      <HeroSection />

      {/* Package Categories Grid */}
      <PackagesGrid />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Wedding Packages Detail */}
      <WeddingPackagesSection />

      {/* Footer */}
      <Footer />
    </main>
  );
}
