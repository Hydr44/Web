import Link from "next/link";

export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t bg-white">
      <div className="rm-container py-10 grid gap-10 md:grid-cols-4">
        {/* Brand */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 rounded-full bg-primary/15 ring-1 ring-primary/30" />
            <span className="font-semibold tracking-tight">RescueManager</span>
          </div>
          <p className="mt-3 text-sm text-gray-600 max-w-md">
            Il gestionale per il soccorso stradale: dalla chiamata al traino, con
            dispatch su mappa, rapportini, fatture e analisi.
          </p>
        </div>

        {/* Link rapidi */}
        <div>
          <div className="text-sm font-medium">Prodotto</div>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li><Link href="/prodotto" className="hover:underline">Moduli</Link></li>
            <li><Link href="/prezzi" className="hover:underline">Prezzi</Link></li>
            <li><Link href="/download" className="hover:underline">Accessi</Link></li>
            <li><Link href="/contatti" className="hover:underline">Richiedi demo</Link></li>
          </ul>
        </div>

        {/* Legali */}
        <div>
          <div className="text-sm font-medium">Legali</div>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li><Link href="/privacy" className="hover:underline">Privacy</Link></li>
            <li><Link href="/cookie" className="hover:underline">Cookie</Link></li>
            <li><Link href="/termini" className="hover:underline">Termini d’uso</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t">
        <div className="rm-container py-4 text-xs text-gray-500 flex flex-wrap items-center gap-x-4 gap-y-2 justify-between">
          <div>© {year} RescueManager. Tutti i diritti riservati.</div>
          <div className="flex items-center gap-3">
            <a href="mailto:info@rescuemanager.eu" className="hover:underline">info@rescuemanager.eu</a>
            <span className="hidden md:inline select-none">·</span>
            <span>P.IVA 00000000000</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
