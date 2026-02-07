'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function TrafficTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const initialLoadClient = useRef(true);

    useEffect(() => {
        // Generate or retrieve visitor ID
        let visitorId = localStorage.getItem('visitor_id');
        if (!visitorId) {
            visitorId = crypto.randomUUID();
            localStorage.setItem('visitor_id', visitorId);
        }

        // Determine device type (simple check)
        const getDeviceType = () => {
            const ua = navigator.userAgent;
            if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
                return 'tablet';
            }
            if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
                return 'mobile';
            }
            return 'desktop';
        };

        const trackPageView = async () => {
            // Don't track admin pages to avoid inflating stats
            if (pathname?.startsWith('/admin') || pathname?.startsWith('/api')) {
                return;
            }

            try {
                await fetch('/api/analytics/track', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        path: pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : ''),
                        visitor_id: visitorId,
                        user_agent: navigator.userAgent,
                        device_type: getDeviceType(),
                        referer: document.referrer
                    }),
                });
            } catch (error) {
                // Silently fail to avoid disrupting user experience
                console.error('Analytics tracking failed', error);
            }
        };

        if (initialLoadClient.current) {
            initialLoadClient.current = false;
            trackPageView();
        } else {
            trackPageView();
        }

    }, [pathname, searchParams]);

    return null;
}
