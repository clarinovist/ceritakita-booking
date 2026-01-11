'use client';
import Image from 'next/image';
import { useHomepageData } from '@/hooks/useHomepageData';

export function AboutSection() {
    const { data, isLoading } = useHomepageData();

    if (isLoading) {
        return <div className="h-[600px] bg-cream-100 animate-pulse" />;
    }

    const about = data?.about || {};

    return (
        <section id="about" className="bg-cream-100 py-20 lg:py-28">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                        <Image
                            src={about.image || '/images/studio_interior.png'}
                            alt="CeritaKita Studio"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-olive-900/10 to-transparent" />
                    </div>

                    {/* Content */}
                    <div>
                        <p className="text-gold-600 tracking-[0.2em] uppercase text-sm font-medium mb-4">
                            {about.label || 'Tentang Kami'}
                        </p>
                        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-olive-800 tracking-wide mb-6">
                            {about.headline || 'Studio Foto untuk Setiap Cerita Anda'}
                        </h2>
                        <div className="space-y-4 text-olive-600 leading-relaxed">
                            <p>
                                {about.body_1 || 'CeritaKita hadir untuk mengabadikan momen-momen penting dalam hidup Anda.'}
                            </p>
                            <p>
                                {about.body_2 || 'Dengan tim fotografer profesional dan studio yang nyaman, kami memastikan setiap sesi foto menjadi pengalaman yang menyenangkan.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
