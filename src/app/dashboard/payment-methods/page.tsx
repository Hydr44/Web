"use client";

import { ExternalLink } from "lucide-react";
import RoleGuard from "@/components/dashboard/RoleGuard";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Contenuto, DueColonne, Riga, Testata } from "../_ui/cornice";

/**
 * Metodi di pagamento — gestiti sul portale del nostro incaricato dei
 * pagamenti (`/api/billing/portal`): li' si aggiungono e si tolgono le carte,
 * si vedono le scadenze e si sceglie quella predefinita. I dati delle carte
 * non passano dai nostri sistemi.
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
      <Testata
        titolo="Metodi di pagamento"
        sotto="Carte, IBAN, scadenze e indirizzo di fatturazione del canone"
        azioni={
          <a
            href="/api/billing/portal?return=/dashboard/payment-methods"
            className="rm-btn rm-btn--primary"
            style={{ gap: 14 }}
          >
            <span>Apri il portale</span>
            <ExternalLink size={15} />
          </a>
        }
      />

      <Contenuto>
        <DueColonne
          principale={
            <section className="rm-card">
              <div className="rm-cardhead">
                <h2 style={{ fontSize: 14 }}>Dove si cambiano</h2>
              </div>
              <div className="rm-righe">
                <Riga etichetta="Carte" valore="Si aggiungono e si tolgono dal portale" />
                <Riga etichetta="Scadenze" valore="Il portale avvisa prima che la carta scada" />
                <Riga etichetta="Indirizzo di fatturazione" valore="Si cambia dal portale" />
                <Riga etichetta="Ricevute del canone" valore="Restano nel portale" />
              </div>
            </section>
          }
          laterale={
            <section className="rm-card">
              <div className="rm-cardhead">
                <h2 style={{ fontSize: 14 }}>Sicurezza</h2>
              </div>
              <p className="rm-muted">
                I dati delle carte non passano dai nostri sistemi e non vengono
                conservati qui: restano dal nostro incaricato dei pagamenti.
              </p>
            </section>
          }
        />
      </Contenuto>
    </>
  );
}
