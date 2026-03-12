import type { Metadata } from "next";
import { Suspense } from "react";
import HomeClient from "./_HomeClient";

export const metadata: Metadata = {
  title: "Gestionale soccorso stradale e autodemolizione",
  description:
    "Software per soccorso stradale e autodemolizioni: dispatch su mappa, turni autisti, fatture SDI, radiazioni RVFU e registro RENTRI. Prova gratis 30 giorni, installazione inclusa.",
};

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <HomeClient />
    </Suspense>
  );
}
