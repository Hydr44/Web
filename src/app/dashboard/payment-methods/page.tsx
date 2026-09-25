"use client";

import RoleGuard from "@/components/dashboard/RoleGuard";
import { usePageTitle } from "@/hooks/usePageTitle";

/**
 * Metodi di pagamento — gestiti via Stripe Customer Portal (`/api/billing/portal`).
 * Lì l'utente aggiunge/rimuove carte, vede scadenze, imposta il default, ecc.
 * Tenere logica/PCI lato Stripe è la scelta corretta (compliance + UX).
 */
export default function PaymentMethodsPage() {
  usePageTitle("Metodi di pagamento");
  return (
    <RoleGuard
      allow={["owner"]}
      blockedMessage="I metodi di pagamento sono gestiti solo dal titolare dell'azienda."
    >
      <PaymentMethodsContent />
    </RoleGuard>
  );
}

function PaymentMethodsContent() {
  return (
    <>
      <div className="rm-area__intesta">
        <div>
          <h1>Metodi di pagamento</h1>
          <p className="rm-muted" style={{ marginTop: 6 }}>
            Carte, IBAN, scadenze e indirizzo di fatturazione del canone.
          </p>
        </div>
      </div>

      <div className="rm-card">
        <div className="rm-cardhead">
          <h3>Portale di fatturazione</h3>
        </div>
        <p className="rm-muted">
          La gestione dei metodi di pagamento avviene sul portale del nostro
          incaricato dei pagamenti: i dati delle carte non passano dai nostri
          sistemi e non vengono conservati qui.
        </p>
        <p style={{ marginTop: 16 }}>
          <a
            href="/api/billing/portal?return=/dashboard/payment-methods"
            className="rm-btn rm-btn--primary"
          >
            <span>Apri il portale</span>
          </a>
        </p>
      </div>
    </>
  );
}
