'use client';

import { useEffect, useState } from 'react';

export function HeroSection() {
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <section className="relative h-screen overflow-hidden">
            {/* Background Image with Parallax */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070')`,
                    transform: `translateY(${scrollY * 0.3}px)`,
                }}
            >
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-olive-900/40 via-olive-900/30 to-olive-900/70" />
            </div>

            {/* Content */}
            <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
                <p className="text-cream-300 text-sm tracking-[0.3em] uppercase mb-4 animate-fade-in">
                    Explore The
                </p>
                <h2 className="font-display text-5xl md:text-7xl lg:text-8xl text-cream-100 tracking-wide animate-slide-up">
                    PACKAGES
                </h2>

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
