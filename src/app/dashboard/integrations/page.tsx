"use client";
import RoleGuard from "@/components/dashboard/RoleGuard";

export default function IntegrationsPage() {
  return (
    <RoleGuard allow={["owner", "admin"]} blockedMessage="Le integrazioni sono gestite solo da proprietario o amministratore.">
      <IntegrationsContent />
    </RoleGuard>
  );
}

function IntegrationsContent() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Integrazioni</h1>
        <p className="mt-1 text-gray-500">Collega servizi esterni per estendere le funzionalità.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-4  border">
          <div className="text-sm font-medium">Stripe</div>
          <div className="text-sm text-gray-500">Gestisci pagamenti e abbonamenti.</div>
        </div>
        <div className="p-4  border">
          <div className="text-sm font-medium">Chatwoot</div>
          <div className="text-sm text-gray-500">Supporto clienti in tempo reale.</div>
        </div>
      </div>
    </div>
  );
}



