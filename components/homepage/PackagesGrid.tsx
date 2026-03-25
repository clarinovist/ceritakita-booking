'use client';

import { useState } from 'react';
import Link from 'next/link';

import { useHomepageData } from '@/hooks/useHomepageData';
import { SeasonalOrnaments } from './SeasonalOrnaments';

export function PackagesGrid() {
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const { data, isLoading } = useHomepageData();

    if (isLoading) {
        return <div className="h-[800px] bg-olive-900 animate-pulse" />;
    }

    const categories = data?.categories || [];

    return (
        <section id="packages" className="bg-olive-900 py-20 px-6 relative overflow-hidden">
            <SeasonalOrnaments variant="dark" density="sparse" />
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <p className="text-gold-400 tracking-[0.2em] uppercase text-sm font-medium mb-4">
                        Layanan Kami
                    </p>
                    <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-cream-100 tracking-wide">
                        Kategori Layanan
                    </h2>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
                    {categories.map((pkg) => (
                        <Link
                            key={pkg.id}
                            href={`/booking?package=${pkg.slug}`}
                            className="group relative aspect-[3/4] overflow-hidden"
                            onMouseEnter={() => setHoveredId(pkg.id)}
                            onMouseLeave={() => setHoveredId(null)}
                        >
                            {/* Image */}
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                                style={{ backgroundImage: `url('${pkg.thumbnail_url || '/images/placeholder.jpg'}')` }}
                            />

                            {/* Overlay */}
                            <div
                                className={`absolute inset-0 transition-all duration-500 ${hoveredId === pkg.id
                                    ? 'bg-olive-900/70'
                                    : 'bg-gradient-to-t from-olive-900/90 via-olive-900/40 to-transparent'
                                    }`}
                            />

                            {/* Content */}
                            <div className="absolute inset-0 flex flex-col items-center justify-end pb-6 px-4">
                                <h3 className="font-display text-xl md:text-2xl text-cream-100 tracking-wider text-center uppercase mb-2">
                                    {pkg.name}
                                </h3>

                                {/* Description - shows on hover */}
                                <p
                                    className={`text-cream-300 text-sm text-center mb-4 transition-all duration-300 ${hoveredId === pkg.id
                                        ? 'opacity-100 translate-y-0'
                                        : 'opacity-0 translate-y-2'
                                        }`}
                                >
                                    {pkg.description}
                                </p>

                                {/* Book Now Button */}
                                <span
                                    className={`text-xs tracking-[0.2em] uppercase border border-gold-400/70 px-4 py-2 text-gold-400 transition-all duration-300 ${hoveredId === pkg.id
                                        ? 'opacity-100 translate-y-0 bg-gold-400/10'
                                        : 'opacity-0 translate-y-4'
                                        }`}
                                >
                                    Pilih Paket
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
