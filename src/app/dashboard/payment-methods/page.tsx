export default function PaymentMethodsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Metodi di pagamento</h1>
        <p className="mt-2 text-gray-600">Aggiungi, rimuovi o imposta il metodo predefinito.</p>
      </header>

      <div className="p-4 rounded-xl border">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Carta terminante in 4242</div>
            <div className="text-xs text-gray-500">Scadenza 12/27 • Predefinita</div>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded-lg ring-1 ring-gray-300 text-sm hover:bg-gray-50">Rimuovi</button>
          </div>
        </div>

        <button className="mt-4 px-3 py-2 rounded-lg bg-primary text-white text-sm hover:opacity-90">
          Aggiungi metodo
        </button>
      </div>
    </div>
  );
}