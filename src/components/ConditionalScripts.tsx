// src/components/ConditionalScripts.tsx
"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { useCookieConsent } from "@/hooks/useCookieConsent";

// Google Analytics ID - sostituisci con il tuo
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-XXXXXXXXXX";

export default function ConditionalScripts() {
  const { preferences, hasConsent } = useCookieConsent();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Non renderizzare nulla fino a quando non siamo sicuri del consenso
  if (!mounted || !hasConsent) return null;

  return (
    <>
      {/* Google Analytics 4 - solo se analytics è abilitato */}
      {preferences.analytics && GA_MEASUREMENT_ID !== "G-XXXXXXXXXX" && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              
              // Configurazione con IP anonimizzato per GDPR
              gtag('config', '${GA_MEASUREMENT_ID}', {
                anonymize_ip: true,
                cookie_flags: 'SameSite=None;Secure',
                page_path: window.location.pathname,
              });
            `}
          </Script>
        </>
      )}

      {/* Meta Pixel - solo se marketing è abilitato */}
      {preferences.marketing && process.env.NEXT_PUBLIC_META_PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {/* Hotjar - solo se analytics è abilitato */}
      {preferences.analytics && process.env.NEXT_PUBLIC_HOTJAR_ID && (
        <Script id="hotjar" strategy="afterInteractive">
          {`
            (function(h,o,t,j,a,r){
              h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
              h._hjSettings={hjid:${process.env.NEXT_PUBLIC_HOTJAR_ID},hjsv:6};
              a=o.getElementsByTagName('head')[0];
              r=o.createElement('script');r.async=1;
              r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
              a.appendChild(r);
            })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
          `}
        </Script>
      )}

      {/* Listener per cambiamenti consenso */}
      <ConsentChangeListener />
    </>
  );
}

// Componente per ascoltare cambiamenti di consenso e ricaricare pagina
function ConsentChangeListener() {
  useEffect(() => {
    const handleConsentChange = () => {
      // Ricarica la pagina per applicare le nuove preferenze
      setTimeout(() => {
        window.location.reload();
      }, 500);
    };

    window.addEventListener("cookieConsentChanged", handleConsentChange);
    return () => window.removeEventListener("cookieConsentChanged", handleConsentChange);
  }, []);

  return null;
}
