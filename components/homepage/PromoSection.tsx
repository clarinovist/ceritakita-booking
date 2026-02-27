'use client';

import { Gift, Moon } from 'lucide-react';
import { useHomepageData } from '@/hooks/useHomepageData';
import { RamadanOrnaments } from './RamadanOrnaments';

export function PromoSection() {
    const { data, isLoading } = useHomepageData();

    if (isLoading) return null; // Don't show loading state for optional section

    const promo = data?.promo || {};
    const footer = data?.footer || {};

    if (promo.is_active !== 'true') return null;

    const whatsappNumber = footer.whatsapp || '6281234567890';
    const whatsappMessage = encodeURIComponent(`Halo CeritaKita, saya tertarik dengan promo: ${promo.title}`);

    return (
        <section className="relative py-20 lg:py-24 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gold-500 via-gold-600 to-gold-500" />
            <RamadanOrnaments variant="light" density="sparse" />

            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
                <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full border border-white" />
                <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full border border-white" />
            </div>

            {/* Content */}
            <div className="relative max-w-4xl mx-auto px-6 text-center">
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-white/20 backdrop-blur-sm rounded-full">
                    <Gift className="w-8 h-8 text-white" />
                </div>

                {/* Title */}
                <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-olive-900 tracking-wide mb-4 inline-flex items-center gap-3">
                    <Moon className="w-8 h-8 md:w-10 md:h-10 text-olive-800 opacity-70" />
                    {promo.title || 'Promo Berkah Ramadan'}
                </h2>

                {/* Description */}
                <p className="text-olive-800 text-lg leading-relaxed max-w-2xl mx-auto mb-8">
                    {promo.description || 'Dapatkan Diskon 20% untuk Paket Keluarga dan Abadikan Momen Berhargamu!'}
                </p>

                {/* CTA */}
                <a
                    href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-olive-900 hover:bg-olive-800 text-cream-100 px-8 py-4 tracking-[0.15em] uppercase text-sm font-medium transition-all duration-300 hover:scale-105"
                >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Tanya Promo via WhatsApp
                </a>
            </div>
        </section>
    );
}
