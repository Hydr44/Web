"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, Phone } from "lucide-react";

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <Image 
                src="/logoufficiale_1024.png" 
                alt="RescueManager" 
                width={200} 
                height={50} 
                className="h-10 w-auto"
              />
            </div>
            <p className="text-sm text-gray-400 mb-5 leading-relaxed">
              Gestionale per autodemolizioni e soccorso stradale. 
              RVFU, SDI, RENTRI integrati.
            </p>
            <div className="space-y-2 text-sm">
              <a href="mailto:info@rescuemanager.eu" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <Mail className="h-4 w-4" />
                info@rescuemanager.eu
              </a>
              <a href="tel:+393921723028" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <Phone className="h-4 w-4" />
                392 172 3028
              </a>
            </div>
          </div>

          {/* Prodotto */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300 mb-4">Prodotto</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/prodotto" className="text-gray-400 hover:text-white transition-colors">Moduli e funzionalità</Link></li>
              <li><Link href="/prezzi" className="text-gray-400 hover:text-white transition-colors">Piani e prezzi</Link></li>
              <li><Link href="/download" className="text-gray-400 hover:text-white transition-colors">Accessi e download</Link></li>
              <li><Link href="/contatti" className="text-gray-400 hover:text-white transition-colors">Richiedi demo</Link></li>
            </ul>
          </div>

          {/* Supporto */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300 mb-4">Supporto</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/contatti" className="text-gray-400 hover:text-white transition-colors">Contattaci</Link></li>
              <li><Link href="/chi-siamo" className="text-gray-400 hover:text-white transition-colors">Chi siamo</Link></li>
            </ul>
          </div>

          {/* Legale */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300 mb-4">Legale</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms-of-use" className="text-gray-400 hover:text-white transition-colors">Termini d&apos;uso</Link></li>
              <li><Link href="/cookie-policy" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <span>&copy; {year} RescueManager. Tutti i diritti riservati.</span>
            <span>P.IVA 02166430856</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
