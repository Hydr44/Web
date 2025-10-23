// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";

import SiteFooter from "@/components/SiteFooter";
import CookieBanner from "@/components/CookieBanner";
import SiteHeader from "@/components/SiteHeader";
import HeaderGate from "@/components/HeaderGate";
import ChatwootWidget from "@/components/ChatwootWidget"; // <- widget chat

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
        {/* Preload risorse critiche */}
        <link rel="preload" href="/mockups/dashboard-mockup.jpg" as="image" />
        <link rel="preload" href="/670shots_so.png" as="image" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        {/* Header pubblico visibile solo FUORI dalla dashboard */}
        <HeaderGate>
          <SiteHeader />
        </HeaderGate>

        {/* Contenuto pagina */}
        {children}

        <SiteFooter />
        <CookieBanner />

        {/* Chatwoot web widget (caricato una volta qui) */}
        <ChatwootWidget />
        
        {/* Vercel Speed Insights per monitoraggio performance */}
        <SpeedInsights />
      </body>
    </html>
  );
}
