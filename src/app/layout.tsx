// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import SiteHeader from "@/components/SiteHeader";

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased overflow-x-hidden flex flex-col">
        <SiteHeader />
        <main className="flex-1 min-h-0">
          {children}
        </main>
        <SpeedInsights />
      </body>
    </html>
  );
}
