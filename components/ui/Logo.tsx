'use client';

import { Camera } from 'lucide-react';
import Link from 'next/link';
import { useSettings } from '@/lib/settings-context';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

/**
 * Logo Component for CeritaKita Studio
 * Displays brand identity with camera icon and text
 */
export function Logo({ className = '', size = 'md', showText = true }: LogoProps) {
  const { settings, loading } = useSettings();

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const iconSize = {
    sm: 20,
    md: 24,
    lg: 28,
  };

  const siteName = settings?.site_name || 'Cerita Kita';

  const hasLogo = !!settings?.site_logo;

  if (loading) {
    // Show skeleton while loading
    return (
      <div className={`inline-flex items-center gap-2 ${sizeClasses[size]} ${className}`}>
        <div className="bg-gray-200 rounded-lg animate-pulse" style={{ width: iconSize[size], height: iconSize[size] }} />
        {showText && (
          <div className="flex flex-col leading-tight gap-1">
            <div className="bg-gray-200 h-4 w-20 rounded animate-pulse"></div>
            <div className="bg-gray-200 h-3 w-12 rounded animate-pulse"></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 font-bold transition-all hover:opacity-80 ${sizeClasses[size]} ${className}`}
      aria-label={`${siteName} - Beranda`}
    >
      <div className="relative flex items-center justify-center">
        {hasLogo ? (
          /* Dynamic Logo Image */
          <img
            src={settings?.site_logo}
            alt={siteName}
            className="object-contain"
            style={{
              height: iconSize[size] * 1.5, // Slightly larger than icon
              width: "auto",
              maxWidth: 150
            }}
            onError={(e) => {
              // Fallback to icon if image fails
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}

        {/* Camera Icon (Fallback or Default) */}
        <div className={`${hasLogo ? 'hidden' : ''} bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg p-1.5 shadow-lg`}>
          <Camera
            size={iconSize[size]}
            className="text-white"
            strokeWidth={2.5}
            fill="currentColor"
          />
        </div>
      </div>

      {showText && (
        <span className="flex flex-col leading-tight">
          <span className="text-gray-900">{siteName}</span>
          <span className="text-primary-600 text-xs font-semibold tracking-wide">
            STUDIO
          </span>
        </span>
      )}
    </Link>
  );
}

/**
 * Compact Logo for mobile navigation
 */
export function MobileLogo() {
  const { settings, loading } = useSettings();
  const siteName = settings?.site_name || 'Cerita Kita';

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="bg-gray-200 rounded-lg p-1.5 animate-pulse" style={{ width: 18, height: 18 }} />
        <div className="bg-gray-200 h-3 w-20 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg p-1.5 shadow-md">
        <Camera size={18} className="text-white" strokeWidth={2.5} fill="currentColor" />
      </div>
      <span className="font-bold text-sm text-gray-900">{siteName}</span>
    </div>
  );
}

/**
 * Full Logo with tagline for hero sections
 */
export function HeroLogo() {
  const { settings, loading } = useSettings();
  const siteName = settings?.site_name || 'Cerita Kita';
  const hasLogo = !!settings?.site_logo;

  if (loading) {
    return (
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-3">
          <div className="bg-gray-200 rounded-xl p-3 animate-pulse" style={{ width: 40, height: 40 }} />
          <div className="flex flex-col text-left gap-2">
            <div className="bg-gray-200 h-8 w-32 rounded animate-pulse"></div>
            <div className="bg-gray-200 h-4 w-20 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="bg-gray-200 h-4 w-64 rounded animate-pulse mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="text-center space-y-3">
      <div className="inline-flex items-center gap-3 justify-center">
        {hasLogo ? (
          <img
            src={settings?.site_logo}
            alt={siteName}
            className="object-contain h-16 w-auto"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}

        <div className={`${hasLogo ? 'hidden' : ''} bg-gradient-to-br from-primary-600 to-secondary-600 rounded-xl p-3 shadow-xl`}>
          <Camera size={40} className="text-white" strokeWidth={2} fill="currentColor" />
        </div>

        <div className="flex flex-col text-left">
          <span className="text-3xl font-black text-gray-900 tracking-tight">{siteName}</span>
          <span className="text-lg font-semibold text-primary-600 tracking-wide">STUDIO</span>
        </div>
      </div>
      <p className="text-gray-600 text-sm md:text-base max-w-md mx-auto">
        Abadikan momen terbaik Anda dengan profesional
      </p>
    </div>
  );
}