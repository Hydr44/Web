export default function SupportPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Supporto</h1>
        <p className="mt-2 text-gray-600">Apri un ticket o consulta la documentazione.</p>
      </header>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border">
          <div className="text-sm font-medium">Ticket</div>
          <p className="mt-1 text-sm text-gray-600">Assistenza prioritaria per piani Business/Consorzio.</p>
          <button className="mt-3 px-3 py-2 rounded-lg bg-primary text-white text-sm hover:opacity-90">
            Apri ticket
          </button>
        </div>
        <div className="p-4 rounded-xl border">
          <div className="text-sm font-medium">Documentazione</div>
          <p className="mt-1 text-sm text-gray-600">Guide rapide e FAQ.</p>
          <a href="#" className="mt-3 inline-block text-sm text-primary hover:underline">
            Vai alla docs →
          </a>
        </div>
      </div>
    </div>
  );
}