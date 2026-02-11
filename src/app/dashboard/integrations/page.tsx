export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Integrazioni</h1>
        <p className="mt-1 text-slate-400">Collega servizi esterni per estendere le funzionalità.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-4 rounded-xl border">
          <div className="text-sm font-medium">Stripe</div>
          <div className="text-sm text-slate-400">Gestisci pagamenti e abbonamenti.</div>
        </div>
        <div className="p-4 rounded-xl border">
          <div className="text-sm font-medium">Chatwoot</div>
          <div className="text-sm text-slate-400">Supporto clienti in tempo reale.</div>
        </div>
      </div>
    </div>
  );
}



