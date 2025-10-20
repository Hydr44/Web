// src/app/dashboard/page.tsx
export default function DashboardPanoramica() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Panoramica</h1>
        <p className="mt-1 text-gray-600">
          Benvenuto in RescueManager. Qui trovi riepilogo azienda, messaggi e avvisi rapidi.
        </p>
      </header>

      {/* Blocchi esempio, personalizza a piacere */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border">
          <div className="text-sm font-medium">Stato abbonamento</div>
          <div className="mt-1 text-sm text-gray-600">Trial • 14 giorni rimanenti</div>
          <a href="/dashboard/billing" className="mt-3 inline-block text-sm text-primary hover:underline">
            Gestisci piano →
          </a>
        </div>

        <div className="p-4 rounded-xl border">
          <div className="text-sm font-medium">Ultime novità</div>
          <ul className="mt-2 text-sm list-disc list-inside text-gray-700 space-y-1">
            <li>App desktop aggiornate</li>
            <li>Nuovi permessi per ruoli</li>
            <li>Report ETA migliorati</li>
          </ul>
        </div>

        <div className="p-4 rounded-xl border">
          <div className="text-sm font-medium">Azioni rapide</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <a href="/download" className="px-3 py-2 rounded-lg ring-1 ring-gray-300 text-sm hover:bg-gray-50">
              Scarica app
            </a>
            <a href="/dashboard/team" className="px-3 py-2 rounded-lg ring-1 ring-gray-300 text-sm hover:bg-gray-50">
              Aggiungi utente
            </a>
            <a href="/dashboard/settings" className="px-3 py-2 rounded-lg ring-1 ring-gray-300 text-sm hover:bg-gray-50">
              Impostazioni
            </a>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl border">
        <div className="text-sm font-medium">Messaggi & avvisi</div>
        <div className="mt-2 text-sm text-gray-600">
          Nessun avviso. Tutto ok ✅
        </div>
      </div>
    </div>
  );
}