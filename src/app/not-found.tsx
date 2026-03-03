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
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Logo */}
        <div className="mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-3 group">
            <div className="relative w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <Image 
                src="/logoufficiale_1024.png" 
                alt="RescueManager" 
                fill
                priority 
                className="object-contain p-1 transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">RESCUE<span className="text-blue-500">MANAGER</span></span>
          </Link>
        </div>

        {/* Icona 404 */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-blue-600/10 flex items-center justify-center mb-6">
            <AlertCircle className="h-12 w-12 text-blue-400" />
          </div>
        </div>

        {/* Titolo */}
        <h1 className="text-6xl font-bold text-white mb-4">
          <span className="text-blue-500">404</span>
        </h1>

        {/* Sottotitolo */}
        <h2 className="text-2xl font-semibold text-white mb-4">
          Pagina non trovata
        </h2>

        {/* Descrizione */}
        <p className="text-lg text-slate-400 mb-8 max-w-md mx-auto">
          Sembra che la pagina che stai cercando non esista o sia stata spostata. 
          Non preoccuparti, possiamo aiutarti a trovare quello che ti serve.
        </p>

        {/* Azioni */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <Link
            href="/"
            className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            <Home className="h-4 w-4" />
            Torna alla Home
          </Link>

          <button
            onClick={() => globalThis.history.back()}
            className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1e293b] border border-slate-700 text-slate-300 font-medium hover:bg-[#243044] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Pagina Precedente
          </button>
        </div>

        {/* Link utili */}
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
              <Zap className="h-4 w-4 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Link Utili</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/prodotto"
              className="flex items-center gap-3 p-3 rounded-xl bg-[#0f172a] hover:bg-[#0a1120] border border-slate-700 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Search className="h-4 w-4 text-blue-400" />
              </div>
              <div className="text-left">
                <div className="font-medium text-white text-sm">Prodotto</div>
                <div className="text-xs text-slate-500">Scopri le funzionalità</div>
              </div>
            </Link>

            <Link
              href="/prezzi"
              className="flex items-center gap-3 p-3 rounded-xl bg-[#0f172a] hover:bg-[#0a1120] border border-slate-700 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <RefreshCw className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-left">
                <div className="font-medium text-white text-sm">Prezzi</div>
                <div className="text-xs text-slate-500">Scegli il tuo piano</div>
              </div>
            </Link>

            <Link
              href="/download"
              className="flex items-center gap-3 p-3 rounded-xl bg-[#0f172a] hover:bg-[#0a1120] border border-slate-700 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Home className="h-4 w-4 text-purple-400" />
              </div>
              <div className="text-left">
                <div className="font-medium text-white text-sm">Download</div>
                <div className="text-xs text-slate-500">Scarica le app</div>
              </div>
            </Link>

            <Link
              href="/contatti"
              className="flex items-center gap-3 p-3 rounded-xl bg-[#0f172a] hover:bg-[#0a1120] border border-slate-700 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Zap className="h-4 w-4 text-amber-400" />
              </div>
              <div className="text-left">
                <div className="font-medium text-white text-sm">Contatti</div>
                <div className="text-xs text-slate-500">Richiedi una demo</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-sm text-slate-500">
          Se continui a riscontrare problemi,{" "}
          <Link href="/dashboard/support" className="text-blue-400 hover:underline font-medium">
            contatta il supporto
          </Link>
        </div>
      </div>
    </div>
  );
}
