'use client';

import { useState } from 'react';
import Link from 'next/link';

interface PackageItem {
    id: string;
    title: string;
    duration: string;
    description: string;
    includes: string[];
    price: string;
}

const weddingPackages: PackageItem[] = [
    {
        id: 'half-day',
        title: 'Half Day',
        duration: '6 Hours',
        description: 'Cocok untuk intimate wedding dengan momen-momen essential yang tertangkap sempurna.',
        includes: [
            'Engagement session',
            'Getting ready photos',
            'Full ceremony coverage',
            'Family photos',
            'Reception photos',
        ],
        price: 'Mulai dari Rp 8.500.000',
    },
    {
        id: 'full-day',
        title: 'Full Day',
        duration: '12 Hours',
        description: 'Coverage lengkap dari pagi hingga malam, perfect untuk menangkap setiap detail hari spesial Anda.',
        includes: [
            'Semua yang ada di Half Day',
            'Sunset couple photos',
            'Full reception coverage',
            'Dance floor moments',
            'Send-off documentation',
            'Second photographer',
        ],
        price: 'Mulai dari Rp 15.000.000',
    },
    {
        id: 'premium',
        title: 'Premium Collection',
        duration: '2 Days',
        description: 'Pengalaman photography premium dengan coverage 2 hari untuk destination wedding atau traditional ceremony.',
        includes: [
            'Semua yang ada di Full Day',
            'Pre-wedding session',
            'Rehearsal dinner coverage',
            'Bridal preparation',
            'Custom wedding album',
            'Prints collection',
        ],
        price: 'Mulai dari Rp 25.000.000',
    },
];

export function WeddingPackagesSection() {
    const [openId, setOpenId] = useState<string | null>('half-day');

    return (
        <section id="wedding-packages" className="relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
                {/* Left - Image */}
                <div className="relative h-[50vh] lg:h-auto lg:sticky lg:top-0">
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{
                            backgroundImage: `url('https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1000')`,
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-olive-900/30 to-transparent" />
                    </div>
                </div>

                {/* Right - Content */}
                <div className="bg-cream-100 py-16 lg:py-24 px-6 lg:px-12">
                    <div className="max-w-xl mx-auto lg:mx-0">
                        {/* Header */}
                        <h2 className="font-display text-4xl md:text-5xl text-olive-800 tracking-wide mb-4">
                            Wedding
                        </h2>
                        <h3 className="font-display text-4xl md:text-5xl text-olive-800 tracking-wide mb-8">
                            Packages
                        </h3>
                        <p className="text-olive-600 leading-relaxed mb-12">
                            Tidak peduli bagaimana Anda membayangkan hari pernikahan atau seberapa besar coverage yang diperlukan,
                            kami memiliki paket untuk menangkap setiap momen. Setiap momen spesial akan terabadikan dengan indah
                            untuk Anda nikmati selamanya.
                        </p>

                        {/* What's Included */}
                        <div className="mb-8">
                            <h4 className="text-gold-600 tracking-[0.2em] uppercase text-sm font-medium mb-4">
                                What&apos;s Included?
                            </h4>
                            <p className="text-olive-600 text-sm leading-relaxed">
                                Optional engagement session, getting ready photos, full ceremony coverage,
                                family photos, reception photos, sunset couple photos.
                            </p>
                        </div>

                        {/* Accordion */}
                        <div className="space-y-4">
                            {weddingPackages.map((pkg) => (
                                <div key={pkg.id} className="border-b border-olive-200">
                                    <button
                                        onClick={() => setOpenId(openId === pkg.id ? null : pkg.id)}
                                        className="w-full flex items-center justify-between py-4 text-left group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="text-gold-600 tracking-[0.15em] uppercase text-sm font-medium">
                                                {pkg.title}
                                            </span>
                                            <span className="text-olive-500 text-xs">
                                                ({pkg.duration})
                                            </span>
                                        </div>
                                        <svg
                                            className={`w-5 h-5 text-olive-500 transition-transform duration-300 ${openId === pkg.id ? 'rotate-180' : ''
                                                }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* Expanded Content */}
                                    <div
                                        className={`overflow-hidden transition-all duration-300 ${openId === pkg.id ? 'max-h-96 pb-6' : 'max-h-0'
                                            }`}
                                    >
                                        <p className="text-olive-600 text-sm mb-4">{pkg.description}</p>
                                        <ul className="space-y-2 mb-4">
                                            {pkg.includes.map((item, idx) => (
                                                <li key={idx} className="text-olive-500 text-sm flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                        <p className="text-olive-800 font-medium">{pkg.price}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* CTA */}
                        <Link
                            href="/booking?package=wedding"
                            className="inline-block mt-10 bg-olive-800 hover:bg-olive-900 text-cream-100 px-8 py-4 tracking-[0.15em] uppercase text-sm transition-colors duration-300"
                        >
                            Book Your Session
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
