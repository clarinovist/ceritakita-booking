'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Package {
    id: string;
    title: string;
    image: string;
}

const packages: Package[] = [
    {
        id: 'weddings',
        title: 'Weddings',
        image: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=500',
    },
    {
        id: 'elopements',
        title: 'Elopements',
        image: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?q=80&w=500',
    },
    {
        id: 'intimate',
        title: 'Intimate',
        image: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?q=80&w=500',
    },
    {
        id: 'adventure',
        title: 'Adventure',
        image: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=500',
    },
    {
        id: 'lifestyle',
        title: 'Lifestyle',
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=500',
    },
];

export function PackagesGrid() {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    return (
        <section id="packages" className="bg-olive-900 py-20 px-6">
            <div className="max-w-7xl mx-auto">
                {/* Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {packages.map((pkg) => (
                        <Link
                            key={pkg.id}
                            href={`/booking?package=${pkg.id}`}
                            className="group relative aspect-[3/4] overflow-hidden"
                            onMouseEnter={() => setHoveredId(pkg.id)}
                            onMouseLeave={() => setHoveredId(null)}
                        >
                            {/* Image */}
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                                style={{ backgroundImage: `url('${pkg.image}')` }}
                            />

                            {/* Overlay */}
                            <div
                                className={`absolute inset-0 transition-all duration-500 ${hoveredId === pkg.id
                                        ? 'bg-olive-900/60'
                                        : 'bg-gradient-to-t from-olive-900/80 via-olive-900/20 to-transparent'
                                    }`}
                            />

                            {/* Content */}
                            <div className="absolute inset-0 flex flex-col items-center justify-end pb-6 px-4">
                                <h3 className="font-display text-lg md:text-xl text-cream-100 tracking-wider text-center uppercase mb-3">
                                    {pkg.title}
                                </h3>

                                {/* Learn More Button */}
                                <span
                                    className={`text-xs tracking-[0.2em] uppercase border border-cream-300/50 px-4 py-2 text-cream-200 transition-all duration-300 ${hoveredId === pkg.id
                                            ? 'opacity-100 translate-y-0 bg-cream-100/10'
                                            : 'opacity-0 translate-y-4'
                                        }`}
                                >
                                    Learn More
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
