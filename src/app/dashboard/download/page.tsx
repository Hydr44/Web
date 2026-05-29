"use client";

import { usePageTitle } from "@/hooks/usePageTitle";
import DownloadPage from "@/app/download/DownloadPage";

/**
 * Pagina download dashboard.
 *
 * Riusa 1:1 il componente pubblico DownloadPage (src/app/download/DownloadPage.tsx).
 * Decisione pragmatica: la versione custom dashboard aveva un bug per cui
 * il bottone "Scarica" non avviava il download su alcuni browser (URL appariva
 * brevemente nella barra e spariva senza salvataggio), mentre la pagina
 * pubblica funzionava regolarmente. Sostituiamo l'intera UI per allineare il
 * comportamento e abbiamo un solo componente da manutenere.
 */
export default function DashboardDownloadPage() {
  usePageTitle("Download");
  return <DownloadPage />;
}
