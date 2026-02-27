'use client';

import Link from 'next/link';
import { useHomepageData } from '@/hooks/useHomepageData';
import { RamadanOrnaments } from './RamadanOrnaments';

export function CTASection() {
    const { data, isLoading } = useHomepageData();

    if (isLoading) {
        return <div className="h-[400px] bg-olive-900 animate-pulse" />;
    }

    const cta = data?.cta || {};
    const footer = data?.footer || {};

    const whatsappNumber = footer.whatsapp || '6281234567890';
    const whatsappMessage = encodeURIComponent('Halo CeritaKita, saya ingin konsultasi untuk sesi foto. Bisa dibantu?');

    return (
        <section className="relative py-24 lg:py-32 overflow-hidden">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: `url('${cta.background_image || '/images/studio_interior.png'}')`,
                }}
            >
                <div className="absolute inset-0 bg-ramadan-800/85" />
            </div>
            <RamadanOrnaments variant="dark" density="normal" />

            {/* Content */}
            <div className="relative max-w-4xl mx-auto px-6 text-center">
                {/* Title */}
                <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-cream-100 tracking-wide mb-6">
                    {cta.headline || 'Siap Mengabadikan Momen Anda?'}
                </h2>

                {/* Description */}
                <p className="font-serif text-lg md:text-xl text-cream-200 leading-relaxed max-w-2xl mx-auto mb-10">
                    {cta.description || 'Pilih layanan, tentukan jadwal, dan biarkan kami mengurus sisanya.'}
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    {/* Primary CTA */}
                    <Link
                        href="/booking"
                        className="inline-block bg-gold-500 hover:bg-gold-600 text-olive-900 font-medium px-8 py-4 tracking-[0.15em] uppercase text-sm transition-all duration-300 hover:scale-105"
                    >
                        {cta.primary_button || 'Mulai Booking'}
                    </Link>

                    {/* Secondary CTA */}
                    <a
                        href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 border border-cream-300/50 hover:border-cream-300 text-cream-100 px-8 py-4 tracking-[0.15em] uppercase text-sm transition-all duration-300 hover:bg-cream-100/10"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        {cta.secondary_button || 'Konsultasi via WhatsApp'}
                    </a>
                </div>
            </div>
        </section>
    );
}
