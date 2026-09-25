import type { Metadata } from "next";

// La pagina Accessi e' un componente client e non puo' dichiarare i propri
// metadati: li porta questo layout. Senza, ereditava titolo e descrizione
// della home e Google la leggeva come un doppione.
export const metadata: Metadata = {
  alternates: { canonical: "/accessi" },
  title: "Accessi e download",
  description:
    "Da dove si entra in RescueManager: il programma per Windows e Mac, l'app per gli autisti su iPhone e Android, l'area personale sul sito e la pagina per seguire un intervento.",
};

export default function AccessiLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
