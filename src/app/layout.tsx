// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";

import SiteFooter from "@/components/SiteFooter";
import CookieBanner from "@/components/CookieBanner";
import SiteHeader from "@/components/SiteHeader";
import HeaderGate from "@/components/HeaderGate";
import ChatwootWidget from "@/components/ChatwootWidget"; // <- widget chat
import ImagePreloader from "@/components/ImagePreloader";

export const metadata: Metadata = {
  title: "RescueManager — Gestionale soccorso stradale",
  description:
    "Dispatch su mappa, turni, rapportini, fatture e analisi in un'unica piattaforma per il soccorso stradale.",
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    shortcut: "/favicon.ico",
    apple: "/logoufficiale_1024.png",
  },
  // Ottimizzazioni per iOS
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head>
        {/* Preload solo risorse critiche */}
        <link rel="preload" href="/logo-rentri.png" as="image" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased overflow-x-hidden flex flex-col">
        {/* Header pubblico visibile solo FUORI dalla dashboard */}
        <HeaderGate>
          <SiteHeader />
        </HeaderGate>

        {/* Contenuto pagina - flex-1 per occupare spazio rimanente */}
        <main className="flex-1">
          {children}
        </main>

        <SiteFooter />
        <CookieBanner />

        {/* Chatwoot web widget (caricato una volta qui) */}
        <ChatwootWidget />
        
        {/* Precaricamento intelligente delle immagini */}
        <ImagePreloader 
          images={[
            "/mockups/dashboard-mockup.jpg",
            "/670shots_so.png"
          ]}
          preloadOnMount={false}
          preloadOnHover={true}
        />
        
        {/* Vercel Speed Insights per monitoraggio performance */}
        <SpeedInsights />
      </body>
    </html>
  );
}
