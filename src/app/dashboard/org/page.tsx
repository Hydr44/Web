export default function OrgPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Azienda</h1>
        <p className="mt-2 text-gray-600">
          Ragione sociale, P.IVA, indirizzi di fatturazione e preferenze.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border">
          <div className="text-sm font-medium">Dati aziendali</div>
          <p className="mt-1 text-sm text-gray-600">Ragione sociale, P.IVA, SDI/PEC.</p>
          <button className="mt-3 px-3 py-2 rounded-lg ring-1 ring-gray-300 text-sm hover:bg-gray-50">
            Modifica
          </button>
        </div>
        <div className="p-4 rounded-xl border">
          <div className="text-sm font-medium">Indirizzi di fatturazione</div>
          <p className="mt-1 text-sm text-gray-600">Aggiungi o aggiorna gli indirizzi.</p>
          <button className="mt-3 px-3 py-2 rounded-lg ring-1 ring-gray-300 text-sm hover:bg-gray-50">
            Gestisci indirizzi
          </button>
        </div>
      </div>
    </div>
  );
}