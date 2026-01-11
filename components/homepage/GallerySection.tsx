'use client';

import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import { useHomepageData } from '@/hooks/useHomepageData';
// import { GalleryImage } from '@/types/homepage';

export function GallerySection() {
    const { data, isLoading } = useHomepageData();

    // Get a curated list of images for preview (max 6, varied categories if possible)
    const previewImages = useMemo(() => {
        if (!data?.portfolioImages) return [];

        const allImages = [...data.portfolioImages];
        // Sort by display order or maybe random shuffle for variety? 
        // Let's stick to display order for consistency
        return allImages
            .sort((a, b) => a.display_order - b.display_order)
            .slice(0, 6); // Take top 6
    }, [data?.portfolioImages]);

    if (isLoading) {
        return <div className="h-[400px] bg-olive-900/50 animate-pulse" />;
    }

    if (previewImages.length === 0) return null;

    return (
        <section id="gallery" className="bg-olive-900 py-20 lg:py-28 overflow-hidden">
            <div className="max-w-6xl mx-auto px-6">

                {/* Section Header */}
                <div className="text-center mb-12">
                    <p className="text-gold-400 tracking-[0.2em] uppercase text-sm font-medium mb-4">
                        Portfolio
                    </p>
                    <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-cream-100 tracking-wide mb-6">
                        Captured Moments
                    </h2>
                    <p className="text-cream-300/60 text-sm max-w-2xl mx-auto text-lg leading-relaxed">
                        Koleksi momen berharga yang telah kami abadikan. Temukan inspirasi untuk acara spesial Anda di galeri lengkap kami.
                    </p>
                </div>

                {/* Preview Grid - Bento Style / Masonry-ish Preview */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-12">
                    {previewImages.map((img, index) => (
                        <div
                            key={img.id}
                            className={`
                                relative overflow-hidden rounded-xl bg-olive-800 shadow-lg group
                                ${index === 0 ? 'col-span-2 row-span-2 aspect-square md:aspect-[4/3]' : 'aspect-square'}
                            `}
                        >
                            <Image
                                src={img.image_url}
                                alt={img.service_name}
                                fill
                                sizes="(max-width: 768px) 100vw, 33vw"
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                                loading="lazy"
                            />
                            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                <span className="text-cream-100 text-xs font-medium tracking-wide border border-cream-100/30 px-2 py-1 rounded-full uppercase">
                                    {img.service_name}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Action Button */}
                <div className="flex justify-center">
                    <Link
                        href="/gallery"
                        className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gold-400 text-olive-900 font-semibold rounded-full overflow-hidden transition-all hover:bg-gold-300 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                    >
                        <span className="relative z-10 tracking-wide">Explore Full Gallery</span>
                        <ArrowRight className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1" />

                        {/* Hover effect overlay */}
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                    </Link>
                </div>

            </div>
        </section>
    );
}
