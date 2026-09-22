// src/components/ConditionalScripts.tsx
"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { useCookieConsent } from "@/hooks/useCookieConsent";

// ID di misurazione del tag Google (GA4) di rescuemanager.eu.
// È un identificativo pubblico (compare comunque nell'HTML della pagina), quindi
// vive qui e non in una variabile d'ambiente: un solo posto da aggiornare e
// nessuna divergenza tra ambienti Vercel.
export const GA_MEASUREMENT_ID = "G-930BEG250B";

// Il tag Google parte solo sul dominio pubblico: staging, anteprime Vercel e
// localhost non devono finire nelle statistiche della proprietà GA4.
const GA_PRODUCTION_HOSTS = ["rescuemanager.eu", "www.rescuemanager.eu"];
function isGaProductionHost(): boolean {
  return typeof window !== "undefined" && GA_PRODUCTION_HOSTS.includes(window.location.hostname);
}

export default function ConditionalScripts() {
  const { preferences, hasConsent } = useCookieConsent();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Non renderizzare nulla fino a quando non siamo sicuri del consenso
  if (!mounted || !hasConsent) return null;

  // Consent Mode v2: mappa le categorie del banner cookie sui segnali Google
  const marketingConsent = preferences.marketing ? "granted" : "denied";
  const functionalConsent = preferences.functional ? "granted" : "denied";

  return (
    <>
      {/* Google tag (gtag.js) - solo se analytics è abilitato e siamo sul dominio pubblico */}
      {preferences.analytics && isGaProductionHost() && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}

              // Consent Mode v2 (richiesto da Google per gli utenti SEE):
              // default tutto negato, poi aggiornato con le scelte del banner.
              // Questo script parte solo dopo il consenso analytics, quindi
              // analytics_storage qui è sempre concesso.
              gtag('consent', 'default', {
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
                analytics_storage: 'denied',
                functionality_storage: 'denied',
                personalization_storage: 'denied',
                security_storage: 'granted',
              });
              gtag('consent', 'update', {
                analytics_storage: 'granted',
                ad_storage: '${marketingConsent}',
                ad_user_data: '${marketingConsent}',
                ad_personalization: '${marketingConsent}',
                functionality_storage: '${functionalConsent}',
                personalization_storage: '${functionalConsent}',
              });

              gtag('js', new Date());

              // GA4 anonimizza già l'IP; cookie SameSite=None;Secure per GDPR
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
