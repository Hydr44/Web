"use client";

import RoleGuard from "@/components/dashboard/RoleGuard";
import { CreditCard, ExternalLink, Shield } from "lucide-react";

/**
 * Metodi di pagamento — gestiti via Stripe Customer Portal (`/api/billing/portal`).
 * Lì l'utente aggiunge/rimuove carte, vede scadenze, imposta il default, ecc.
 * Tenere logica/PCI lato Stripe è la scelta corretta (compliance + UX).
 */
export default function PaymentMethodsPage() {
  return (
    <RoleGuard
      allow={["owner"]}
      blockedMessage="I metodi di pagamento sono gestiti solo dal proprietario dell'organizzazione."
    >
      <PaymentMethodsContent />
    </RoleGuard>
  );
}

function PaymentMethodsContent() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Metodi di pagamento</h1>
        <p className="mt-2 text-gray-500">
          Aggiungi, rimuovi o imposta il metodo predefinito tramite il portale sicuro Stripe.
        </p>
      </header>

      <div className="p-6 bg-white border border-gray-200 rounded">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded bg-blue-50 flex items-center justify-center shrink-0">
            <CreditCard className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">Portale di fatturazione</h2>
            <p className="mt-1 text-sm text-gray-500">
              Gestisci carte, IBAN, scadenze e indirizzi di fatturazione. La gestione avviene
              sul portale Stripe per garantire la conformità PCI-DSS — nessun dato di carta
              transita o viene salvato da noi.
            </p>

            <a
              href="/api/billing/portal?return=/dashboard/payment-methods"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded bg-primary text-gray-900 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Apri portale Stripe
            </a>
          </div>
        </div>
      </div>

      <div className="p-4 rounded bg-blue-50 border border-blue-200 flex items-start gap-3">
        <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-medium">Sicurezza</p>
          <p className="mt-0.5 text-blue-800">
            I dati delle carte sono gestiti esclusivamente da Stripe (certificato PCI-DSS Level 1).
            RescueManager non memorizza numeri di carta, CVV o token completi.
          </p>
        </div>
      </div>
    </div>
  );
}
