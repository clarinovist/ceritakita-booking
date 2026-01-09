'use client';

import { useState, useEffect } from 'react';

interface Testimonial {
    id: number;
    quote: string;
    author: string;
    event: string;
}

const testimonials: Testimonial[] = [
    {
        id: 1,
        quote: "CeritaKita benar-benar membuat kami merasa seperti sedang bersama teman baik yang datang untuk mengabadikan momen spesial kami. Semua orang bertanya bagaimana kami bisa menemukan fotografer yang luar biasa ini. Terima kasih untuk setiap momen yang tak terlupakan.",
        author: "Sarah & Andi",
        event: "Wedding Photography",
    },
    {
        id: 2,
        quote: "Hasil fotonya melebihi ekspektasi kami. Setiap gambar menceritakan kisah yang indah. Tim CeritaKita sangat profesional namun tetap hangat dan menyenangkan.",
        author: "Maya & Dimas",
        event: "Pre-Wedding Session",
    },
    {
        id: 3,
        quote: "Momen intimate kami tertangkap dengan sangat natural dan elegan. Tidak ada pose yang dipaksakan, semuanya mengalir begitu indah.",
        author: "Ratna & Budi",
        event: "Engagement Session",
    },
];

export function TestimonialsSection() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % testimonials.length);
                setIsAnimating(false);
            }, 500);
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    const current = testimonials[currentIndex];

    return (
        <section className="relative py-32 overflow-hidden">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=2000')`,
                }}
            >
                <div className="absolute inset-0 bg-olive-900/75" />
            </div>

            {/* Content */}
            <div className="relative max-w-4xl mx-auto px-6 text-center">
                {/* Title */}
                <h2 className="font-script text-4xl md:text-5xl lg:text-6xl text-cream-100 mb-16">
                    &ldquo;Memorable Moments&rdquo;
                </h2>

                {/* Quote */}
                <div
                    className={`transition-all duration-500 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
                        }`}
                >
                    <p className="font-serif text-lg md:text-xl text-cream-200 leading-relaxed mb-8 italic">
                        &ldquo;{current.quote}&rdquo;
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <div className="h-px w-12 bg-gold-400" />
                        <span className="font-display text-cream-100 tracking-wide">
                            {current.author}
                        </span>
                        <div className="h-px w-12 bg-gold-400" />
                    </div>
                    <p className="text-cream-300/70 text-sm mt-2 tracking-wider uppercase">
                        {current.event}
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
