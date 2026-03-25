'use client';

import * as React from 'react';
import * as LucideIcons from 'lucide-react';
import { useHomepageData } from '@/hooks/useHomepageData';
import { SeasonalOrnaments } from './SeasonalOrnaments';

const iconMap: Record<string, LucideIcons.LucideIcon> = {
    Camera: LucideIcons.Camera,
    Clock: LucideIcons.Clock,
    CreditCard: LucideIcons.CreditCard,
    MapPin: LucideIcons.MapPin,
    Award: LucideIcons.Award,
    Heart: LucideIcons.Heart,
    Star: LucideIcons.Star,
    Shield: LucideIcons.Shield,
    Users: LucideIcons.Users,
    Zap: LucideIcons.Zap
};

export function WhyChooseUsSection() {
    const { data, isLoading } = useHomepageData();

    if (isLoading) {
        return <div className="h-[500px] bg-olive-900 animate-pulse" />;
    }

    const valueProps = data?.valueProps || [];

    return (
        <section className="relative py-24 lg:py-32 overflow-hidden bg-olive-900" id="why-us">
            <SeasonalOrnaments variant="dark" density="sparse" />
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <p className="text-gold-400 tracking-[0.2em] uppercase text-sm font-medium mb-4">
                        Keunggulan Kami
                    </p>
                    <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-cream-100 tracking-wide">
                        Mengapa Memilih CeritaKita?
                    </h2>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {valueProps.map((prop, index) => {
                        const Icon = iconMap[prop.icon] || LucideIcons.Camera;
                        return (
                            <div
                                key={prop.id || index}
                                className="text-center group"
                            >
                                {/* Icon */}
                                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 border border-gold-400/30 group-hover:border-gold-400 group-hover:bg-gold-400/10 transition-all duration-300">
                                    <Icon className="w-7 h-7 text-gold-400" />
                                </div>

                                {/* Content */}
                                <h3 className="font-display text-lg text-cream-100 tracking-wide mb-3">
                                    {prop.title}
                                </h3>
                                <p className="text-cream-300/70 text-sm leading-relaxed">
                                    {prop.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
