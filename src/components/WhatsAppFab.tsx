"use client";

/**
 * Pulsante sticky WhatsApp (contatto diretto).
 *
 * Reso SOLO sulla home (montato in _HomeClient.tsx). È posizionato in basso
 * a destra, IMPILATO SOPRA la bolla Chatwoot (che sta a bottom:20px/right:20px):
 * per questo usa bottom-24 così da non sovrapporsi al launcher della chat.
 * z-index alto per stare sopra i contenuti, ma sotto la finestra Chatwoot aperta.
 */
export default function WhatsAppFab() {
  const phone = "393921723028";
  const text = encodeURIComponent(
    "Ciao! Vorrei informazioni su RescueManager."
  );
  const href = `https://wa.me/${phone}?text=${text}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Scrivici su WhatsApp"
      className="group fixed bottom-24 right-5 z-[9990] flex items-center"
    >
      {/* Etichetta (solo desktop, appare all'hover) */}
      <span className="pointer-events-none mr-3 hidden translate-x-2 rounded-full bg-[#0f172a] px-3.5 py-1.5 text-sm font-semibold text-white opacity-0 shadow-lg transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 md:block">
        Scrivici su WhatsApp
      </span>

      {/* Bottone tondo */}
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-emerald-900/30 ring-4 ring-[#25D366]/20 transition-transform duration-200 group-hover:scale-105">
        {/* Alone pulsante */}
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#25D366] opacity-40"></span>
        <svg
          viewBox="0 0 24 24"
          className="relative h-7 w-7"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
      </span>
    </a>
  );
}
