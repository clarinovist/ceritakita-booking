'use client';

import { useState, useEffect } from 'react';
import { useHomepageData } from '@/hooks/useHomepageData';
import { RamadanOrnaments } from './RamadanOrnaments';

export function TestimonialsSection() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const { data, isLoading } = useHomepageData();

    const testimonials = data?.testimonials || [];

    useEffect(() => {
        if (testimonials.length === 0) return;

        const interval = setInterval(() => {
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % testimonials.length);
                setIsAnimating(false);
            }, 500);
        }, 6000);
        return () => clearInterval(interval);
    }, [testimonials.length]);

    if (isLoading) {
        return <div className="h-[600px] bg-olive-900 animate-pulse" />;
    }

    if (testimonials.length === 0) return null;

    const current = testimonials[currentIndex];

    return (
        <section className="relative py-32 overflow-hidden">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: `url('${data?.testimonials_config?.background_image || '/images/family.png'}')`,
                }}
            >
                <div className="absolute inset-0 bg-ramadan-900/85" />
            </div>
            <RamadanOrnaments variant="dark" density="normal" />

            {/* Content */}
            <div className="relative max-w-4xl mx-auto px-6 text-center">
                {/* Title */}
                <p className="text-gold-400 tracking-[0.2em] uppercase text-sm font-medium mb-4">
                    Testimonials
                </p>
                <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-cream-100 tracking-wide mb-16">
                    Cerita dari Pelanggan Kami
                </h2>

                {/* Quote */}
                <div
                    className={`transition-all duration-500 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
                        }`}
                >
                    <p className="font-serif text-lg md:text-xl text-cream-200 leading-relaxed mb-8 italic">
                        &ldquo;{current?.quote}&rdquo;
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <div className="h-px w-12 bg-gold-400" />
                        <span className="font-display text-cream-100 tracking-wide">
                            {current?.author_name}
                        </span>
                        <div className="h-px w-12 bg-gold-400" />
                    </div>
                    <p className="text-cream-300/70 text-sm mt-2 tracking-wider uppercase">
                        {current?.author_title}
                    </p>
                </div>

                {/* Dots Navigation */}
                <div className="flex justify-center gap-3 mt-12">
                    {testimonials.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                setIsAnimating(true);
                                setTimeout(() => {
                                    setCurrentIndex(index);
                                    setIsAnimating(false);
                                }, 300);
                            }}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentIndex
                                ? 'bg-gold-400 w-6'
                                : 'bg-cream-300/40 hover:bg-cream-300/60'
                                }`}
                            aria-label={`Go to testimonial ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
