// Stato della pratica (pubblica: il token e' il public_uuid del preventivo).
// E' la pagina che il cliente tiene da parte dopo il pagamento: dice a che
// punto siamo e, quando serve, lo rimanda alla configurazione.
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  OnboardingShell,
  Tappe,
  Riga,
  ParlaConNoi,
  IconaFreccia,
  IconaAggiorna,
  IconaEsterno,
} from '@/components/OnboardingShell';

type Step = 'pagamento' | 'carica' | 'in_verifica' | 'correzione' | 'attivato';
type Status = {
  ok: boolean; step: Step;
  label: string; company: string | null; quote_number: string | null;
  paid?: boolean; has_visura?: boolean; error?: string;
};

// Tappa accesa per ogni stato (le quattro tappe sono sempre le stesse).
function stepIndex(step: Step): number {
  if (step === 'pagamento') return 0;
  if (step === 'carica' || step === 'correzione') return 1;
  if (step === 'in_verifica') return 2;
  return 3; // attivato
}

// Titolo, frase e pulsante di ogni stato. `resume` = si torna alla configurazione.
const TESTI: Record<Step, { titolo: string; frase: string; resume: boolean }> = {
  pagamento: {
    titolo: 'In attesa del pagamento',
    frase: 'Appena arriva il pagamento puoi caricare la visura e completare i dati.',
    resume: false,
  },
  carica: {
    titolo: 'Completa la configurazione',
    frase: 'Carica la visura camerale e controlla i dati: sono due minuti.',
    resume: true,
  },
  correzione: {
    titolo: 'Serve una correzione',
    frase: 'Abbiamo trovato una cosa da sistemare nei dati. Riprendi la pratica, correggi e reinvia.',
    resume: true,
  },
  in_verifica: {
    titolo: 'La tua pratica è in verifica',
    frase: 'Ricevi l\'esito entro 24 ore, via email. Non devi fare niente.',
    resume: false,
  },
  attivato: {
    titolo: 'Pratica approvata',
    frase: 'Stiamo attivando l\'account: tra pochi minuti ricevi l\'email per scegliere la password.',
    resume: false,
  },
};

function statoVerifica(step: Step): string {
  if (step === 'attivato') return 'approvata';
  if (step === 'in_verifica') return 'in corso';
  if (step === 'correzione') return 'sospesa, serve una correzione';
  return 'non ancora iniziata';
}

export default function PraticaPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const router = useRouter();
  const [st, setSt] = useState<Status | null>(null);
  const [error, setError] = useState('');
  // Ora dell'ultima lettura: il cliente deve sapere quanto e' fresca la pagina.
  const [aggiornato, setAggiornato] = useState('');

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/quotes/${uuid}/pratica-status`);
      const d = await r.json();
      if (!d.ok) { setError(d.error || 'Pratica non trovata.'); return; }
      setSt(d);
      setError('');
      setAggiornato(new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }));
    } catch { setError('Errore di rete.'); }
  }, [uuid]);

  useEffect(() => { load(); }, [load]);

  const testi = st ? TESTI[st.step] : null;
  const corrente = st ? stepIndex(st.step) : -1;

  // Pulsante di sinistra: uno solo per stato.
  let azione: React.ReactNode = <span />;
  if (testi?.resume) {
    azione = (
      <button onClick={() => router.push(`/configura/${uuid}`)} className="rm-btn rm-btn--primary">
        Riprendi la pratica <IconaFreccia />
      </button>
    );
  } else if (st?.step === 'attivato') {
    azione = (
      <Link href="/login" className="rm-btn rm-btn--primary">
        Vai all&apos;accesso <IconaEsterno />
      </Link>
    );
  } else if (st?.step === 'in_verifica') {
    azione = (
      <button onClick={load} className="rm-btn rm-btn--tertiary">
        Aggiorna stato <IconaAggiorna />
      </button>
    );
  }

  return (
    <OnboardingShell riferimento={st?.quote_number ? `Pratica ${st.quote_number}` : 'Stato pratica'}>
      <div className="rm-card">
        {!st && !error && <p className="rm-muted">Caricamento in corso.</p>}

        {error && !st && (
          <>
            <h1>Pratica non disponibile</h1>
            <div className="rm-note rm-note--errore" role="alert" style={{ marginTop: 14 }}>{error}</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
              <ParlaConNoi />
            </div>
          </>
        )}

        {st && testi && (
          <>
            <h1>{testi.titolo}</h1>
            <p className="rm-muted" style={{ marginTop: 4 }}>
              {[st.company, aggiornato ? `aggiornata oggi alle ${aggiornato}` : ''].filter(Boolean).join(', ')}
            </p>

            <div style={{ marginTop: 18 }}>
              <Tappe corrente={corrente} tutteFatte={st.step === 'attivato'} />
            </div>

            {st.step === 'correzione' && (
              <div
                className="rm-note rm-note--errore"
                role="alert"
                style={{ marginTop: 18, textAlign: 'center', color: 'var(--danger)' }}
              >
                Nella verifica dei dati abbiamo trovato qualcosa che non torna.
              </div>
            )}

            <p style={{ marginTop: 18 }}>{testi.frase}</p>

            <div className="rm-righe" style={{ marginTop: 18 }}>
              <Riga etichetta="Preventivo" valore={st.quote_number || '—'} />
              <Riga etichetta="Pagamento" valore={st.paid ? 'ricevuto' : 'in attesa'} />
              <Riga etichetta="Configurazione" valore={st.has_visura ? 'inviata' : 'da completare'} />
              <Riga etichetta="Verifica" valore={statoVerifica(st.step)} />
            </div>

            {error && (
              <div className="rm-note rm-note--errore" role="alert" style={{ marginTop: 16 }}>{error}</div>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
                marginTop: 20,
              }}
            >
              {azione}
              <ParlaConNoi />
            </div>

            <p className="rm-muted" style={{ marginTop: 14 }}>
              Conserva questo link per controllare lo stato. Se lo perdi, lo recuperi con l&apos;email del preventivo.
            </p>
          </>
        )}
      </div>
    </OnboardingShell>
  );
}
