import type { MetadataRoute } from "next";

/**
 * Web App Manifest — Next.js genera `/manifest.webmanifest` da questo file.
 * Abilita "Aggiungi a schermata home" su mobile e installabilità PWA.
 *
 * Icone: usiamo i file già presenti in /public (favicon-32, favicon, logo_512,
 * android-chrome-192). theme/background coerenti col brand (#0f172a navy).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RescueManager — Gestionale soccorso stradale, trasporti e autodemolizione",
    short_name: "RescueManager",
    description:
      "Software gestionale per soccorso stradale e autodemolizioni. Soccorso & trasporti, RVFU, RENTRI, fatturazione SDI.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    orientation: "portrait",
    lang: "it",
    icons: [
      {
        src: "/favicon-32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/favicon-16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo_512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo_512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
