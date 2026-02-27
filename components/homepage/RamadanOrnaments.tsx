'use client';

import { Moon, Star } from 'lucide-react';

interface RamadanOrnamentsProps {
    /** 'dark' for dark backgrounds, 'light' for cream/light backgrounds */
    variant?: 'dark' | 'light';
    /** 'sparse' renders fewer ornaments, 'normal' renders more */
    density?: 'sparse' | 'normal';
}

export function RamadanOrnaments({ variant = 'dark', density = 'normal' }: RamadanOrnamentsProps) {
    const moonColor = variant === 'dark' ? 'text-gold-400' : 'text-gold-600';
    const starColor = variant === 'dark' ? 'text-gold-300' : 'text-gold-500';
    const starFill = variant === 'dark' ? 'fill-gold-300' : 'fill-gold-500';
    const baseOpacity = variant === 'dark' ? 'opacity-25' : 'opacity-15';
    const accentOpacity = variant === 'dark' ? 'opacity-40' : 'opacity-20';

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            {/* Top-left Moon */}
            <Moon className={`absolute top-6 left-6 md:left-12 w-10 h-10 md:w-14 md:h-14 ${moonColor} ${baseOpacity} animate-pulse-slow`} />

            {/* Top-right Star */}
            <Star className={`absolute top-8 right-8 md:right-16 w-5 h-5 md:w-7 md:h-7 ${starColor} ${accentOpacity} animate-twinkle ${starFill}`} />

            {/* Bottom-left Star */}
            <Star className={`absolute bottom-10 left-12 md:left-20 w-4 h-4 md:w-5 md:h-5 ${starColor} ${baseOpacity} animate-twinkle ${starFill}`} style={{ animationDelay: '1s' }} />

            {density === 'normal' && (
                <>
                    {/* Bottom-right Moon (smaller) */}
                    <Moon className={`absolute bottom-8 right-10 md:right-24 w-8 h-8 md:w-10 md:h-10 ${moonColor} ${baseOpacity} animate-bounce-subtle`} />

                    {/* Center-left Star */}
                    <Star className={`absolute top-1/2 left-4 md:left-8 w-3 h-3 md:w-4 md:h-4 ${starColor} ${accentOpacity} animate-twinkle ${starFill}`} style={{ animationDelay: '2s' }} />

                    {/* Center-right Star */}
                    <Star className={`absolute top-1/3 right-4 md:right-10 w-3 h-3 md:w-4 md:h-4 ${starColor} ${baseOpacity} animate-twinkle ${starFill}`} style={{ animationDelay: '3s' }} />
                </>
            )}
        </div>
    );
}
