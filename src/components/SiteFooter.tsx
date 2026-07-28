"use client";

import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import NewsletterForm from "./NewsletterForm";

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#0f172a] text-white">
      {/* Newsletter */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-10 grid md:grid-cols-2 gap-6 items-center">
          <div>
            <h3 className="text-lg font-bold text-white">Resta aggiornato</h3>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">
              Novità di prodotto e aggiornamenti normativi (RENTRI, SDI, RVFU) direttamente nella tua casella. Niente spam.
            </p>
          </div>
          <NewsletterForm source="footer" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <img
                src="/assets/logos/logo-principale-a-colori.svg"
                alt="RescueManager"
                width={160}
                height={53}
                className="h-10 w-auto"
              />
            </div>
            <p className="text-sm text-slate-400 mb-5 leading-relaxed">
              Software gestionale per autodemolizioni e soccorso stradale. 
              Registro Veicoli Fuori Uso, Fatturazione Elettronica, RENTRI integrati.
            </p>
            <div className="space-y-2 text-sm">
              <a href="mailto:info@rescuemanager.eu" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <Mail className="h-4 w-4" />
                info@rescuemanager.eu
              </a>
              <a href="tel:+393921723028" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <Phone className="h-4 w-4" />
                +39 392 172 3028
              </a>
              <a
                href="https://wa.me/393921723028"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
                WhatsApp
              </a>
            </div>
          </div>

          {/* Moduli */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-white mb-4">Moduli</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/moduli/trasporti" className="text-slate-400 hover:text-white transition-colors">Soccorso & trasporti & Tracking</Link></li>
              <li><Link href="/moduli/clienti" className="text-slate-400 hover:text-white transition-colors">Clienti & CRM</Link></li>
              <li><Link href="/moduli/piazzale" className="text-slate-400 hover:text-white transition-colors">Custodia veicoli & Deposito</Link></li>
              <li><Link href="/moduli/rvfu" className="text-slate-400 hover:text-white transition-colors">Registro Veicoli Fuori Uso</Link></li>
              <li><Link href="/moduli/rentri" className="text-slate-400 hover:text-white transition-colors">Rifiuti RENTRI</Link></li>
              <li><Link href="/moduli/sdi" className="text-slate-400 hover:text-white transition-colors">Fatturazione Elettronica</Link></li>
            </ul>
          </div>

          {/* Supporto */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-white mb-4">Supporto</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/contatti" className="text-slate-400 hover:text-white transition-colors">Contattaci</Link></li>
              <li><Link href="/chi-siamo" className="text-slate-400 hover:text-white transition-colors">Chi siamo</Link></li>
              <li><Link href="/demo" className="text-slate-400 hover:text-white transition-colors">Richiedi Demo</Link></li>
              <li>
                <a
                  href="https://stats.uptimerobot.com/vqC6fnBuTL"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  </span>
                  Stato servizi
                </a>
              </li>
            </ul>
          </div>

          {/* Legale */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-white mb-4">Legale</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/privacy-policy" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms-of-use" className="text-slate-400 hover:text-white transition-colors">Termini d&apos;uso</Link></li>
              <li><Link href="/cookie-policy" className="text-slate-400 hover:text-white transition-colors">Cookie Policy</Link></li>
              <li><Link href="/dpa" className="text-slate-400 hover:text-white transition-colors">DPA</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex flex-col gap-3 text-xs text-slate-500">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <span className="font-semibold text-slate-300">RescueManager S.r.l.</span>
              <span className="text-slate-600">&copy; {year} &middot; Tutti i diritti riservati</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500">
              <span>Via dello Smeraldo 18, 93012 Gela (CL)</span>
              <span>P.IVA 02176370852</span>
              <span>Capitale sociale &euro; 100,00</span>
              <span>PEC <a href="mailto:rescuemanager@legalmail.it" className="hover:text-slate-300">rescuemanager@legalmail.it</a></span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
