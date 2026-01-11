'use client';

import { Camera, Clock, CreditCard, MapPin, Award, Heart, Star, Shield, Users, Zap, type LucideIcon } from 'lucide-react';
import { useHomepageData } from '@/hooks/useHomepageData';

const iconMap: Record<string, LucideIcon> = {
    Camera, Clock, CreditCard, MapPin, Award, Heart, Star, Shield, Users, Zap
};

export function WhyChooseUsSection() {
    const { data, isLoading } = useHomepageData();

    if (isLoading) {
        return <div className="h-[500px] bg-olive-800 animate-pulse" />;
    }

    const valueProps = data?.valueProps || [];

    return (
        <section className="bg-olive-800 py-20 lg:py-28">
            <div className="max-w-7xl mx-auto px-6">
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
                        const Icon = iconMap[prop.icon] || Camera;
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
