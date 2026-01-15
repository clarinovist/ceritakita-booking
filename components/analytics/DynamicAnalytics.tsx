'use client';

import Script from 'next/script';
import { GoogleAnalytics } from '@next/third-parties/google';
import type { SeoSettings } from '@/lib/types/settings';

interface DynamicAnalyticsProps {
    seoSettings?: SeoSettings;
}

export default function DynamicAnalytics({ seoSettings }: DynamicAnalyticsProps) {
    // Don't render anything if no settings are provided
    if (!seoSettings) {
        return null;
    }

    const { googleAnalyticsId, metaPixelId } = seoSettings;

    return (
        <>
            {/* Google Analytics */}
            {googleAnalyticsId && (
                <GoogleAnalytics gaId={googleAnalyticsId} />
            )}

            {/* Meta Pixel */}
            {metaPixelId && (
                <Script
                    id="meta-pixel"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaPixelId}');
              fbq('track', 'PageView');
            `,
                    }}
                />
            )}
        </>
    );
}
