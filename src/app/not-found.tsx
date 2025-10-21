"use client";

import Link from "next/link";
import Image from "next/image";
import { 
  Home, 
  ArrowLeft, 
  Search, 
  AlertCircle,
  Zap,
  RefreshCw
} from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50/50 to-white flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Logo */}
        <div className="mb-8">
          <Link href="/" className="inline-block group">
            <div className="relative overflow-hidden rounded-xl">
              <Image 
                src="/logoufficiale_1024.png" 
                alt="RescueManager" 
                width={200} 
                height={53} 
                priority 
                className="transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </Link>
        </div>

        {/* Icona 404 */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-primary/10 to-blue-500/10 flex items-center justify-center mb-6">
            <AlertCircle className="h-12 w-12 text-primary" />
          </div>
        </div>

        {/* Titolo */}
        <h1 className="text-6xl font-bold text-gray-900 mb-4">
          <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">404</span>
        </h1>

        {/* Sottotitolo */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Pagina non trovata
        </h2>

        {/* Descrizione */}
        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          Sembra che la pagina che stai cercando non esista o sia stata spostata. 
          Non preoccuparti, possiamo aiutarti a trovare quello che ti serve.
        </p>

        {/* Azioni */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <Link
            href="/"
            className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white font-medium hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
          >
            <Home className="h-4 w-4" />
            Torna alla Home
          </Link>

          <button
            onClick={() => globalThis.history.back()}
            className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Pagina Precedente
          </button>
        </div>

        {/* Link utili */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Link Utili</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/prodotto"
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-primary/5 hover:border-primary/20 border border-transparent transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Search className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900 text-sm">Prodotto</div>
                <div className="text-xs text-gray-600">Scopri le funzionalità</div>
              </div>
            </Link>

            <Link
              href="/prezzi"
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-primary/5 hover:border-primary/20 border border-transparent transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <RefreshCw className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900 text-sm">Prezzi</div>
                <div className="text-xs text-gray-600">Scegli il tuo piano</div>
              </div>
            </Link>

            <Link
              href="/download"
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-primary/5 hover:border-primary/20 border border-transparent transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Home className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900 text-sm">Download</div>
                <div className="text-xs text-gray-600">Scarica le app</div>
              </div>
            </Link>

            <Link
              href="/demo"
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-primary/5 hover:border-primary/20 border border-transparent transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Zap className="h-4 w-4 text-orange-600" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900 text-sm">Demo</div>
                <div className="text-xs text-gray-600">Prova il prodotto</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-sm text-gray-500">
          Se continui a riscontrare problemi,{" "}
          <Link href="/dashboard/support" className="text-primary hover:underline font-medium">
            contatta il supporto
          </Link>
        </div>
      </div>
    </div>
  );
}
