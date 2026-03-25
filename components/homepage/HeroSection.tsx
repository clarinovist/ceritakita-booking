'use client';
import { useHomepageData } from '@/hooks/useHomepageData';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flower2, Sparkles } from 'lucide-react';

export function HeroSection() {
    const [scrollY, setScrollY] = useState(0);
    const { data, isLoading } = useHomepageData();

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (isLoading) {
        return <div className="h-screen bg-olive-900 animate-pulse" />;
    }

    const hero = data?.hero || {};

    return (
        <section className="relative h-screen overflow-hidden">
            {/* Background Image with Parallax */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: `url('${hero.background_image || '/images/hero_photography.png'}')`,
                    transform: `translateY(${scrollY * 0.3}px)`,
                }}
            >
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-olive-900/50 via-olive-900/40 to-olive-900/80" />
            </div>

            {/* Outer Decorative Ornaments (Larger, more visible) */}
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                <Flower2 className="absolute top-1/4 left-10 md:left-20 w-16 h-16 md:w-24 md:h-24 text-gold-400 opacity-30 animate-pulse-slow" />
                <Sparkles className="absolute top-1/3 right-12 md:right-24 w-8 h-8 md:w-12 md:h-12 text-gold-300 opacity-40 animate-bounce-subtle" />
                <Sparkles className="absolute bottom-1/4 left-1/4 w-6 h-6 text-gold-500 opacity-50 animate-pulse-slow" />
                <Sparkles className="absolute top-1/2 right-1/3 w-4 h-4 text-cream-200 opacity-60 animate-bounce-subtle" />
            </div>

            {/* Content */}
            <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-6">
                <div className="relative inline-block">
                    <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-cream-100 tracking-wide mb-6 animate-slide-up relative z-10">
                        {hero.tagline || 'Abadikan Setiap Momen Berharga dalam Hidupmu'}
                    </h1>
                </div>
                <p className="font-serif text-lg md:text-xl text-cream-200 max-w-3xl leading-relaxed mb-10 animate-fade-in relative">
                    {hero.subtagline || 'Dari wisuda hingga pernikahan — CeritaKita hadir untuk mengabadikan pencapaian dan kebahagiaan terbaik dalam hidupmu.'}
                </p>

                {/* CTA Button */}
                <Link
                    href="/booking"
                    className="inline-block bg-gold-500 hover:bg-gold-600 text-olive-900 font-medium px-8 py-4 tracking-[0.15em] uppercase text-sm transition-all duration-300 hover:scale-105 animate-fade-in"
                >
                    {hero.cta_text || 'Booking Sekarang'}
                </Link>

                {/* Scroll Indicator */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce-subtle">
                    <div className="w-6 h-10 border-2 border-cream-300/50 rounded-full flex justify-center pt-2">
                        <div className="w-1 h-3 bg-cream-300/70 rounded-full animate-pulse" />
                    </div>
                </div>
            </div>
        </section>
    );
}
