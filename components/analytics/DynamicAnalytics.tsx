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

              // CAPI Gateway - server-side tracking for deduplication
              (function(){
                function getCookie(n){var m=document.cookie.match(new RegExp('(^| )'+n+'=([^;]+)'));return m?m[2]:null;}
                function capiTrack(evt,data){
                  var eid='capi-'+Date.now()+'-'+Math.random().toString(36).substr(2,9);
                  fbq('track',evt,data||{},{eventID:eid});
                  var p={event_name:evt,event_source_url:location.href,event_id:eid,fbp:getCookie('_fbp'),fbc:getCookie('_fbc'),custom_data:data||{}};
                  if(navigator.sendBeacon)navigator.sendBeacon('/api/capi/events',JSON.stringify(p));
                  else fetch('/api/capi/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p),keepalive:true});
                  return eid;
                }
                window.ckCapi={track:capiTrack,pageView:function(){return capiTrack('PageView')},lead:function(d){return capiTrack('Lead',d)},contact:function(d){return capiTrack('Contact',d)},viewContent:function(d){return capiTrack('ViewContent',d)}};
              })();
            `,
                    }}
                />
            )}
        </>
    );
}
