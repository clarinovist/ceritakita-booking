'use client';

import { Flower2, Sparkles } from 'lucide-react';

interface SeasonalOrnamentsProps {
    /** 'dark' for dark backgrounds, 'light' for cream/light backgrounds */
    variant?: 'dark' | 'light';
    /** 'sparse' renders fewer ornaments, 'normal' renders more */
    density?: 'sparse' | 'normal';
}

export function SeasonalOrnaments({ variant = 'dark', density = 'normal' }: SeasonalOrnamentsProps) {
    const primaryColor = variant === 'dark' ? 'text-gold-400' : 'text-gold-600';
    const accentColor = variant === 'dark' ? 'text-gold-300' : 'text-gold-500';
    const baseOpacity = variant === 'dark' ? 'opacity-25' : 'opacity-15';
    const accentOpacity = variant === 'dark' ? 'opacity-40' : 'opacity-20';

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            {/* Top-left Flower */}
            <Flower2 className={`absolute top-6 left-6 md:left-12 w-10 h-10 md:w-14 md:h-14 ${primaryColor} ${baseOpacity} animate-pulse-slow`} />

            {/* Top-right Sparkles */}
            <Sparkles className={`absolute top-8 right-8 md:right-16 w-5 h-5 md:w-7 md:h-7 ${accentColor} ${accentOpacity} animate-twinkle`} />

            {/* Bottom-left Sparkles */}
            <Sparkles className={`absolute bottom-10 left-12 md:left-20 w-4 h-4 md:w-5 md:h-5 ${accentColor} ${baseOpacity} animate-twinkle`} style={{ animationDelay: '1s' }} />

            {density === 'normal' && (
                <>
                    {/* Bottom-right Flower (smaller) */}
                    <Flower2 className={`absolute bottom-8 right-10 md:right-24 w-8 h-8 md:w-10 md:h-10 ${primaryColor} ${baseOpacity} animate-bounce-subtle`} />

                    {/* Center-left Sparkles */}
                    <Sparkles className={`absolute top-1/2 left-4 md:left-8 w-3 h-3 md:w-4 md:h-4 ${accentColor} ${accentOpacity} animate-twinkle`} style={{ animationDelay: '2s' }} />

                    {/* Center-right Sparkles */}
                    <Sparkles className={`absolute top-1/3 right-4 md:right-10 w-3 h-3 md:w-4 md:h-4 ${accentColor} ${baseOpacity} animate-twinkle`} style={{ animationDelay: '3s' }} />
                </>
            )}
        </div>
    );
}
