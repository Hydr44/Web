// src/components/CookieSettingsButton.tsx
"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import { useCookieConsent } from "@/hooks/useCookieConsent";

export default function CookieSettingsButton() {
  const { hasConsent } = useCookieConsent();
  const [showModal, setShowModal] = useState(false);

  // Mostra solo se l'utente ha già dato il consenso
  if (!hasConsent) return null;

  return (
    <>
      {/* Bottone fisso in basso a sinistra */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-lg shadow-lg border border-slate-700 transition-all hover:scale-105"
        aria-label="Gestisci preferenze cookie"
      >
        <Settings className="h-4 w-4" />
        <span className="text-sm font-medium hidden sm:inline">Cookie</span>
      </button>

      {/* Modal preferenze */}
      {showModal && (
        <CookieSettingsModal onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

// Modal per modificare le preferenze
function CookieSettingsModal({ onClose }: { onClose: () => void }) {
  const { preferences, savePreferences } = useCookieConsent();
  const [localPrefs, setLocalPrefs] = useState(preferences);

  const handleSave = () => {
    savePreferences(localPrefs);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0f172a] px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div>
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Privacy</p>
            <h2 className="text-lg font-extrabold text-white">Preferenze Cookie</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-2xl font-bold leading-none"
            aria-label="Chiudi"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Gestisci le tue preferenze sui cookie. Puoi modificarle in qualsiasi momento.
          </p>

          {/* Cookie Essenziali (sempre attivi) */}
          <div className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Settings className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Essenziali</p>
                <p className="text-xs text-gray-500">Necessari per il funzionamento</p>
              </div>
            </div>
            <div className="w-10 h-5 bg-slate-500 rounded-full flex items-center justify-end px-0.5">
              <div className="w-4 h-4 bg-white rounded-full" />
            </div>
          </div>

          {/* Cookie Analytics */}
          <div className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Analytics</p>
                <p className="text-xs text-gray-500">Statistiche anonimizzate</p>
              </div>
            </div>
            <button
              onClick={() => setLocalPrefs(p => ({ ...p, analytics: !p.analytics }))}
              className={`w-10 h-5 rounded-full flex items-center transition-colors px-0.5 ${
                localPrefs.analytics ? "bg-blue-600 justify-end" : "bg-gray-300 justify-start"
              }`}
            >
              <div className="w-4 h-4 bg-white rounded-full" />
            </button>
          </div>

          {/* Cookie Funzionali */}
          <div className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Funzionali</p>
                <p className="text-xs text-gray-500">Preferenze e lingua</p>
              </div>
            </div>
            <button
              onClick={() => setLocalPrefs(p => ({ ...p, functional: !p.functional }))}
              className={`w-10 h-5 rounded-full flex items-center transition-colors px-0.5 ${
                localPrefs.functional ? "bg-emerald-600 justify-end" : "bg-gray-300 justify-start"
              }`}
            >
              <div className="w-4 h-4 bg-white rounded-full" />
            </button>
          </div>

          {/* Cookie Marketing */}
          <div className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Marketing</p>
                <p className="text-xs text-gray-500">Pubblicità personalizzata</p>
              </div>
            </div>
            <button
              onClick={() => setLocalPrefs(p => ({ ...p, marketing: !p.marketing }))}
              className={`w-10 h-5 rounded-full flex items-center transition-colors px-0.5 ${
                localPrefs.marketing ? "bg-purple-600 justify-end" : "bg-gray-300 justify-start"
              }`}
            >
              <div className="w-4 h-4 bg-white rounded-full" />
            </button>
          </div>

          {/* Bottoni azione */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm rounded-lg transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition-colors"
            >
              Salva
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center pt-2">
            Le modifiche saranno applicate immediatamente
          </p>
        </div>
      </div>
    </div>
  );
}
