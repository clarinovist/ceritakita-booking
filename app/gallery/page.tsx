'use client';

import { useState, useMemo } from 'react';
import { Search, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useHomepageData } from '@/hooks/useHomepageData';
// import { GalleryImage } from '@/types/homepage';

export default function GalleryPage() {
    const { data, isLoading } = useHomepageData();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    // Derived state for categories and images
    const { categories, displayedImages } = useMemo(() => {
        const allImages = data?.portfolioImages || [];

        // Extract unique categories from images
        const cats = Array.from(new Set(allImages.map(img => img.service_name))).sort();

        // Filter images based on search and selected category
        const filtered = allImages.filter(img => {
            const matchesSearch = searchQuery === '' ||
                img.service_name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'All' ||
                img.service_name === selectedCategory;

            return matchesSearch && matchesCategory;
        });

        // Sort by display order
        filtered.sort((a, b) => a.display_order - b.display_order);

        return { categories: ['All', ...cats], displayedImages: filtered };
    }, [data?.portfolioImages, searchQuery, selectedCategory]);

    // Handle image click (simple lightbox or expand - for now just no-op/visual feedback)
    // Could be enhanced later with the same modal from original gallery if needed

    return (
        <main className="min-h-screen bg-gray-50 pb-20">
            {/* Sticky Header with Search */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 gap-4">
                        <Link href="/" className="p-2 -ml-2 text-gray-600 hover:text-gray-900 transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>

                        <h1 className="text-xl font-display font-bold text-gray-900 hidden sm:block">
                            Discover
                        </h1>

                        <div className="flex-1 max-w-md relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-gold-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-full leading-5 bg-gray-100 text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-gold-400 focus:border-transparent sm:text-sm transition-all"
                                placeholder="Search moments..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Category Pills (Horizontal Scroll) */}
                    <div className="py-4 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                        <div className="flex space-x-4 min-w-max">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`
                                        flex flex-col items-center gap-2 group cursor-pointer transition-all
                                        ${selectedCategory === cat ? 'opacity-100 scale-105' : 'opacity-60 hover:opacity-100'}
                                    `}
                                >
                                    <div className={`
                                        w-16 h-16 rounded-full overflow-hidden border-2 transition-all p-0.5
                                        ${selectedCategory === cat ? 'border-gold-500 shadow-md' : 'border-transparent group-hover:border-gray-200'}
                                    `}>
                                        <div className="w-full h-full rounded-full bg-gray-200 overflow-hidden relative">
                                            {/* We try to find the first image for this category to use as thumbnail */}
                                            {/* For "All", we might pick a random one or generic icon */}
                                            {cat === 'All' ? (
                                                <div className="w-full h-full flex items-center justify-center bg-gold-100 text-gold-600">
                                                    <div className="grid grid-cols-2 gap-0.5 p-3 w-full h-full opacity-60">
                                                        <div className="bg-current rounded-sm"></div>
                                                        <div className="bg-current rounded-sm"></div>
                                                        <div className="bg-current rounded-sm"></div>
                                                        <div className="bg-current rounded-sm"></div>
                                                    </div>
                                                </div>
                                            ) : (
                                                (() => {
                                                    const thumbDetails = data?.portfolioImages?.find(img => img.service_name === cat);
                                                    return thumbDetails ? (
                                                        <Image
                                                            src={thumbDetails.image_url}
                                                            alt={cat}
                                                            fill
                                                            className="object-cover"
                                                            sizes="64px"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-200" />
                                                    )
                                                })()
                                            )}
                                        </div>
                                    </div>
                                    <span className={`
                                        text-xs font-medium whitespace-nowrap px-2 py-0.5 rounded-full transition-colors
                                        ${selectedCategory === cat ? 'bg-gray-900 text-white' : 'text-gray-600 group-hover:bg-gray-100'}
                                    `}>
                                        {cat}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* Masonry Grid Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="aspect-[3/4] bg-gray-200 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : displayedImages.length > 0 ? (
                    <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                        {displayedImages.map((img) => (
                            <div
                                key={img.id}
                                className="break-inside-avoid relative group rounded-xl overflow-hidden bg-gray-100 mb-4 shadow-sm hover:shadow-lg transition-all duration-300"
                            >
                                <Image
                                    src={img.image_url}
                                    alt={img.service_name}
                                    width={500}
                                    height={750}
                                    className="w-full h-auto object-cover transform sm:group-hover:scale-105 transition-transform duration-500"
                                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                    <p className="text-white text-sm font-medium">{img.service_name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No photos found</h3>
                        <p className="text-gray-500 mt-1">Try adjusting your search or filter</p>
                    </div>
                )}
            </div>

        </main>
    );
}
