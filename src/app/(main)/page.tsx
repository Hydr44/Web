import type { Metadata } from "next";
import { Suspense } from "react";
import HomeClient from "./_HomeClient";

export const metadata: Metadata = {
  // Title bilanciato per non penalizzare gli autodemolitori nei risultati Google.
  // L'ordine delle parole conta: la prima dopo il brand pesa di più.
  title: "Gestionale per autodemolitori, soccorso stradale e officine",
  description:
    "Gestionale per autodemolitori, soccorso stradale, officine e carrozzerie. Registro RENTRI rifiuti, Registro VFU, fatturazione elettronica SDI, dispatch su mappa, gestione piazzale e ricambi. Prova gratis 30 giorni, installazione inclusa.",
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
