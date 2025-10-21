"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { SmoothScrollLink } from "@/components/SmoothScrollLink";
import { 
  Mail, 
  ArrowRight,
  ArrowUp,
  Play,
  Calculator,
  FileText,
  HelpCircle,
  Shield,
  Clock
} from "lucide-react";

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
      
      <div className="relative z-10">
        {/* Main footer content */}
        <div className="rm-container py-16">
          <div className="grid lg:grid-cols-4 gap-12">
        {/* Brand */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <Image 
                    src="/logoufficiale_1024.png" 
                    alt="RescueManager" 
                    width={400} 
                    height={100} 
                    className="h-16 w-auto"
                  />
          </div>
                
                <p className="text-gray-300 mb-6 max-w-sm leading-relaxed">
                  Il gestionale completo per il soccorso stradale: dalla chiamata al traino, 
                  con dispatch su mappa, rapportini, fatture e analisi avanzate.
                </p>

                {/* Contact info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                      <Mail className="h-3 w-3 text-cyan-400" />
                    </div>
                    <a href="mailto:info@rescuemanager.eu" className="hover:text-white transition-colors">
                      info@rescuemanager.eu
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <Clock className="h-3 w-3 text-emerald-400" />
                    </div>
                    <span>Lun-Ven 9:00-18:00</span>
                  </div>
                </div>
              </motion.div>
        </div>

            {/* Prodotto */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-blue-400" />
                </div>
                Prodotto
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/prodotto" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-500/20 flex items-center justify-center">
                      <ArrowRight className="h-2.5 w-2.5 text-blue-400" />
                    </div>
                    Moduli e funzionalità
                  </Link>
                </li>
                <li>
                  <Link href="/prezzi" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-500/20 flex items-center justify-center">
                      <ArrowRight className="h-2.5 w-2.5 text-blue-400" />
                    </div>
                    Piani e prezzi
                  </Link>
                </li>
                <li>
                  <Link href="/download" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-500/20 flex items-center justify-center">
                      <ArrowRight className="h-2.5 w-2.5 text-blue-400" />
                    </div>
                    Accessi e download
                  </Link>
                </li>
                <li>
                  <Link href="/demo" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-500/20 flex items-center justify-center">
                      <Play className="h-2.5 w-2.5 text-green-400" />
                    </div>
                    Richiedi demo
                  </Link>
                </li>
                <li>
                  <Link href="/preventivo" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-orange-500/20 flex items-center justify-center">
                      <Calculator className="h-2.5 w-2.5 text-orange-400" />
                    </div>
                    Preventivo personalizzato
                  </Link>
                </li>
              </ul>
            </motion.div>

            {/* Supporto */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <HelpCircle className="h-4 w-4 text-purple-400" />
                </div>
                Supporto
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/contatti" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-purple-500/20 flex items-center justify-center">
                      <ArrowRight className="h-2.5 w-2.5 text-purple-400" />
                    </div>
                    Contattaci
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-500/20 flex items-center justify-center">
                      <Shield className="h-2.5 w-2.5 text-red-400" />
                    </div>
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms-of-use" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-indigo-500/20 flex items-center justify-center">
                      <FileText className="h-2.5 w-2.5 text-indigo-400" />
                    </div>
                    Termini d'uso
                  </Link>
                </li>
                <li>
                  <Link href="/cookie-policy" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-500/20 flex items-center justify-center">
                      <Shield className="h-2.5 w-2.5 text-yellow-400" />
                    </div>
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </motion.div>

            {/* Azienda */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-emerald-400" />
                </div>
                Azienda
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/chi-siamo" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-emerald-500/20 flex items-center justify-center">
                      <ArrowRight className="h-2.5 w-2.5 text-emerald-400" />
                    </div>
                    Chi siamo
                  </Link>
                </li>
                <li>
                  <Link href="/carriere" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-emerald-500/20 flex items-center justify-center">
                      <ArrowRight className="h-2.5 w-2.5 text-emerald-400" />
                    </div>
                    Carriere
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-emerald-500/20 flex items-center justify-center">
                      <ArrowRight className="h-2.5 w-2.5 text-emerald-400" />
                    </div>
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/press" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-emerald-500/20 flex items-center justify-center">
                      <ArrowRight className="h-2.5 w-2.5 text-emerald-400" />
                    </div>
                    Press
                  </Link>
                </li>
          </ul>
            </motion.div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/20">
          <div className="rm-container py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-400">
                © {year} RescueManager. Tutti i diritti riservati.
              </div>
              <div className="text-sm text-gray-400">
                P.IVA 00000000000
        </div>
      </div>
          </div>
        </div>

        {/* Back to top button */}
        <div className="absolute bottom-6 right-6">
          <SmoothScrollLink
            href="#hero"
            className="group flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 hover:bg-primary/30 text-primary hover:text-white transition-all duration-300 backdrop-blur-sm border border-primary/30"
          >
            <ArrowUp className="h-5 w-5 group-hover:-translate-y-0.5 transition-transform" />
          </SmoothScrollLink>
        </div>
      </div>
    </footer>
  );
}
