// Attivazione dal link ricevuto per email. Due strade, decise dal link stesso:
// l'acquisto porta al pagamento, la prova attiva l'account e mostra il
// riepilogo. La logica del link non cambia: qui cambia solo la pagina.
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { OnboardingShell, Riga, IconaFreccia } from '@/components/OnboardingShell';

export default function ActivatePage() {
  const params = useParams();
  const token = params.token as string;
  const [result, setResult] = useState<{ ok: boolean; message?: string; error?: string; org_name?: string; plan?: string; trial_days?: number; expires_at?: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/activate/${token}/info`)
      .then((r) => r.json())
      .then((info) => {
        if (info.ok && info.type === 'purchase' && info.redirect_url) {
          window.location.href = info.redirect_url;
          return;
        }
        if (info.ok && info.type === 'trial') {
          return fetch(`/api/activate/${token}`).then((r) => r.json());
        }
        setResult({ ok: false, error: info.error || 'Link non valido' });
      })
      .then((data) => {
        if (data && typeof data === 'object' && 'ok' in data) setResult(data);
      })
      .catch(() => setResult({ ok: false, error: 'Errore di connessione' }));
  }, [token]);

  const piano = result?.plan ? result.plan.charAt(0).toUpperCase() + result.plan.slice(1) : null;
  const scadenza = result?.expires_at
    ? new Date(result.expires_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })
    : null;

  return (
    <OnboardingShell riferimento="Attivazione">
      <div className="rm-card">
        {!result && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="rm-spin" aria-hidden="true" />
            <p className="rm-muted">Attivazione in corso. Resta su questa pagina.</p>
          </div>
        )}

        {result?.ok && (
          <>
            <h1>Account attivato</h1>
            <p className="rm-muted" style={{ marginTop: 4 }}>
              {[result.org_name, piano ? `piano ${piano}` : '', result.trial_days ? `prova di ${result.trial_days} giorni` : '']
                .filter(Boolean)
                .join(', ')}
            </p>

            <div className="rm-righe" style={{ marginTop: 20 }}>
              {result.org_name && <Riga etichetta="Azienda" valore={result.org_name} />}
              {piano && <Riga etichetta="Piano" valore={piano} />}
              {scadenza && <Riga etichetta="Prova" valore={`fino al ${scadenza}, poi parte il canone`} />}
              <Riga
                etichetta="Primo passo"
                valore="scegli la password dal link che ricevi per email, poi scarica l'app per il computer"
              />
            </div>

            <div style={{ marginTop: 20 }}>
              <Link href="/dashboard" className="rm-btn rm-btn--primary">
                Entra nell&apos;area personale <IconaFreccia />
              </Link>
            </div>
          </>
        )}

        {result && !result.ok && (
          <>
            <h1>Attivazione non riuscita</h1>
            <div className="rm-note rm-note--errore" role="alert" style={{ marginTop: 16 }}>
              {result.error || 'Link non valido o scaduto.'}
            </div>
            <div style={{ marginTop: 20 }}>
              <Link href="/dashboard" className="rm-btn rm-btn--secondary">
                Entra nell&apos;area personale
              </Link>
            </div>
          </>
        )}
      </div>
    </OnboardingShell>
  );
}
