// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

import SiteFooter from "@/components/SiteFooter";
import CookieBanner from "@/components/CookieBanner";
import SiteHeader from "@/components/SiteHeader";
import HeaderGate from "@/components/HeaderGate";
import ChatwootWidget from "@/components/ChatwootWidget"; // <- widget chat

export const metadata: Metadata = {
  title: "RescueManager — Gestionale soccorso stradale",
  description:
    "Dispatch su mappa, turni, rapportini, fatture e analisi in un’unica piattaforma per il soccorso stradale.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
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
      </body>
    </html>
  );
}
