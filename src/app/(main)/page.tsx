import type { Metadata } from "next";
import { Suspense } from "react";
import HomeClient from "./_HomeClient";

export const metadata: Metadata = {
  // Focus soccorso stradale + trasporti (prima parola dopo il brand = più peso),
  // poi autodemolitori. Niente officine/carrozzerie (non è il nostro pubblico).
  title: "Gestionale per soccorso stradale, trasporti e autodemolitori",
  description:
    "Gestionale per soccorso stradale, trasporti e autodemolitori. Dispatch interventi su mappa, gestione autisti e mezzi in tempo reale, fatturazione elettronica SDI, Registro RENTRI rifiuti, Registro VFU, custodia veicoli e ricambi. Prova gratis 30 giorni, installazione inclusa.",
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
