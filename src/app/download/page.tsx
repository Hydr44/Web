import { permanentRedirect } from "next/navigation";

// Il programma si scarica solo da collegati: /dashboard/download, dentro
// l'area personale. /download resta come scorciatoia per i vecchi
// collegamenti e porta li'; chi non e' collegato passa prima dal login.
export default function Page() {
  permanentRedirect("/dashboard/download");
}
