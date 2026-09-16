import { permanentRedirect } from "next/navigation";

// Il download vive nel portale (con sidebar e gate auth): /dashboard/download.
// /download resta come scorciatoia per i link interni (sidebar portale,
// /accessi, not-found, demo) e per chi ha il vecchio indirizzo.
// Redirect PERMANENTE (308): Google sostituisce la vecchia URL indicizzata
// con la destinazione, che porta X-Robots-Tag noindex, e la toglie dall'indice.
// Un 307 temporaneo la lasciava in indice col titolo vecchio.
export default function Page() {
  permanentRedirect("/dashboard/download");
}
