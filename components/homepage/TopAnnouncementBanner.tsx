'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

export function TopAnnouncementBanner() {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    return (
        <div className="bg-gold-500 text-olive-900 py-3 px-4 relative z-50">
            <div className="max-w-7xl mx-auto flex items-center justify-between text-sm md:text-base font-medium">
                <div className="flex-1 text-center">
                    <span className="mr-2">🎓✨</span>
                    Musim Wisuda & Pernikahan telah tiba! Jadwal April–Juni cepat penuh — booking sekarang.
                </div>
                <button
                    onClick={() => setIsVisible(false)}
                    className="flex-shrink-0 p-1 hover:bg-gold-600 rounded-full transition-colors"
                    aria-label="Tutup banner"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
