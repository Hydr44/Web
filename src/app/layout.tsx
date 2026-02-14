// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import SiteHeader from "@/components/SiteHeader";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

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

/**
 * Verifica se il sito è in manutenzione leggendo da system_settings.
 * Eseguito in Node.js runtime (non Edge), accesso pieno a Supabase.
 */
async function isWebsiteMaintenanceEnabled(): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from("system_settings")
      .select("value")
      .eq("key", "website_maintenance_enabled")
      .single();

    if (error) return false;
    return data?.value === true || data?.value === "true";
  } catch {
    return false;
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Determina il pathname corrente per escludere /staff e /maintenance dal check
  const headersList = await headers();
  const pathname = headersList.get("x-invoke-path") || headersList.get("x-matched-path") || "";

  // Le route staff, API e la pagina manutenzione stessa non vanno bloccate
  const isExcludedFromMaintenance =
    pathname.startsWith("/staff") ||
    pathname.startsWith("/api") ||
    pathname === "/maintenance";

  const showMaintenance = !isExcludedFromMaintenance && (await isWebsiteMaintenanceEnabled());

  return (
    <html lang="it">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased overflow-x-hidden flex flex-col">
        {showMaintenance ? (
          /* Pagina di manutenzione inline — bypass completo del routing */
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
            <div className="max-w-md w-full text-center space-y-6">
              <div className="mx-auto w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.13-5.12a2.25 2.25 0 010-3.18l.34-.35a2.25 2.25 0 013.18 0l1.59 1.6 1.59-1.6a2.25 2.25 0 013.18 0l.34.35a2.25 2.25 0 010 3.18l-5.13 5.12a.75.75 0 01-1.06 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 12a9.75 9.75 0 11-19.5 0 9.75 9.75 0 0119.5 0z" />
                </svg>
              </div>
              <div className="space-y-3">
                <h1 className="text-2xl font-bold text-white">Sito in manutenzione</h1>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Stiamo lavorando per migliorare il servizio.<br />
                  Torneremo online il prima possibile.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 text-xs text-slate-500">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                Manutenzione in corso
              </div>
              <p className="text-xs text-slate-600 pt-4">RescueManager</p>
            </div>
          </div>
        ) : (
          <>
            <SiteHeader />
            <main className="flex-1 min-h-0">
              {children}
            </main>
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  );
}
