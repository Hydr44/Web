// Configurazione dell'azienda (pubblica: il token e' il public_uuid del
// preventivo). Verifica dell'email con il codice, caricamento della visura,
// lettura automatica, controllo dei dati e invio in verifica. La pagina riparte
// da sola dal punto in cui era rimasta, leggendo lo stato della pratica.
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  OnboardingShell,
  Tappe,
  CasellePin,
  COME_LINK,
  IconaFreccia,
} from '@/components/OnboardingShell';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';

// Acronimi forma giuridica (menù a tendina: niente diciture lunghe).
const FORME_GIURIDICHE = ['SRL', 'SRLS', 'SPA', 'SAPA', 'SNC', 'SAS', 'SS', 'Società cooperativa', 'Ditta individuale', 'Altro'];

type FieldType = 'text' | 'select';
const FIELDS: { key: string; label: string; span?: boolean; type?: FieldType; optional?: boolean }[] = [
  { key: 'ragione_sociale', label: 'Ragione sociale', span: true },
  { key: 'partita_iva', label: 'Partita IVA' },
  { key: 'codice_fiscale', label: 'Codice fiscale' },
  { key: 'pec', label: 'PEC', span: true },
  { key: 'forma_giuridica', label: 'Forma giuridica', type: 'select' },
  { key: 'codice_ateco', label: 'Codice ATECO', optional: true },
  { key: 'indirizzo', label: 'Indirizzo', span: true },
  { key: 'citta', label: 'Città' },
  { key: 'provincia', label: 'Provincia' },
  { key: 'cap', label: 'CAP' },
];

// Formattazione/validazione campi (coerente coi formati italiani usati nell'app).
const FMT: Record<string, (v: string) => string> = {
  partita_iva: v => v.replace(/\D/g, '').slice(0, 11),
  cap: v => v.replace(/\D/g, '').slice(0, 5),
  provincia: v => v.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2),
  codice_fiscale: v => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16),
};
const ATTRS: Record<string, { inputMode?: 'numeric' | 'text'; type?: string }> = {
  partita_iva: { inputMode: 'numeric' },
  cap: { inputMode: 'numeric' },
  pec: { type: 'email' },
};

type Phase = 'loading' | 'confirming' | 'pagamento' | 'otp' | 'upload' | 'analyzing' | 'review' | 'submitting' | 'done' | 'elsewhere';

// Riquadro con il titolo e la barretta blu a sinistra.
function Sezione({ titolo, children }: { titolo: string; children: React.ReactNode }) {
  return (
    <section style={{ border: '1px solid var(--border)', marginTop: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px' }}>
        <span style={{ width: 3, height: 13, background: 'var(--brand)' }} aria-hidden="true" />
        <h2 style={{ fontSize: 14 }}>{titolo}</h2>
      </div>
      {children}
    </section>
  );
}

// Riga del riquadro: etichetta a destra, campo a fianco. Quando lo schermo e'
// stretto le due caselle della stessa riga vanno a capo da sole.
function Campo({ etichetta, intero, children }: { etichetta: string; intero?: boolean; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flex: intero ? '1 1 100%' : '1 1 320px',
        minWidth: 0,
        padding: '8px 14px',
        borderTop: '1px solid var(--border)',
      }}
    >
      <span style={{ flex: '0 0 116px', textAlign: 'right', color: 'var(--text-secondary)', fontSize: 12.5 }}>
        {etichetta}
      </span>
      <div style={{ flex: '1 1 auto', minWidth: 0 }}>{children}</div>
    </div>
  );
}

function Righe({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap' }}>{children}</div>;
}

export default function ConfiguraPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('loading');
  const [company, setCompany] = useState<string | null>(null);
  const [quoteNumber, setQuoteNumber] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [pdfB64, setPdfB64] = useState<string>('');
  const [fileName, setFileName] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [mismatch, setMismatch] = useState(false);
  const [notice, setNotice] = useState('');
  const [progress, setProgress] = useState(0);
  // OTP verifica email
  const [otpCode, setOtpCode] = useState('');
  const [emailMasked, setEmailMasked] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpBusy, setOtpBusy] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  // Polling "confermando pagamento": timer + flag per non aggiornare lo stato dopo l'unmount.
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aliveRef = useRef(true);

  const loadStatus = useCallback(async (retry = 0) => {
    try {
      const r = await fetch(`/api/quotes/${uuid}/pratica-status`);
      const d = await r.json();
      if (!aliveRef.current) return;
      if (!d.ok) { setError(d.error || 'Pratica non trovata.'); setPhase('elsewhere'); return; }
      setCompany(d.company);
      setQuoteNumber(d.quote_number || null);
      if (d.step === 'pagamento') {
        const justPaid = typeof window !== 'undefined' && window.location.search.includes('paid=1');
        if (justPaid && retry < 8) {
          setPhase('confirming');
          pollRef.current = setTimeout(() => loadStatus(retry + 1), 2500);
        } else {
          setPhase('pagamento');
        }
      } else if (d.step === 'carica' || d.step === 'correzione') {
        const otp = await fetch(`/api/quotes/${uuid}/otp/status`).then(r => r.json()).catch(() => ({ verified: false }));
        if (!aliveRef.current) return;
        setPhase(otp.verified ? 'upload' : 'otp');
      } else {
        router.replace(`/pratica/${uuid}`); // in_verifica / attivato → pagina stato
      }
    } catch {
      if (!aliveRef.current) return;
      setError('Errore di rete.'); setPhase('elsewhere');
    }
  }, [uuid, router]);

  useEffect(() => {
    aliveRef.current = true;
    loadStatus();
    return () => { aliveRef.current = false; if (pollRef.current) clearTimeout(pollRef.current); };
  }, [loadStatus]);

  // Barra di avanzamento "finta" durante la lettura della visura (richiede qualche secondo).
  useEffect(() => {
    if (phase !== 'analyzing') { setProgress(0); return; }
    setProgress(10);
    const id = setInterval(() => setProgress(p => (p < 90 ? p + Math.max(1, (90 - p) * 0.08) : p)), 400);
    return () => clearInterval(id);
  }, [phase]);

  const sendOtp = useCallback(async () => {
    setOtpSent(true); setOtpError('');
    setOtpBusy('send');
    try {
      const r = await fetch(`/api/quotes/${uuid}/otp/send`, { method: 'POST' });
      const d = await r.json();
      if (!d.ok) setOtpError(d.error || 'Invio del codice non riuscito.');
      else setEmailMasked(d.email_masked || '');
    } catch {
      setOtpError('Errore di rete. Riprova.');
    } finally {
      setOtpBusy('');
    }
  }, [uuid]);

  const verifyOtp = async () => {
    if (!/^\d{6}$/.test(otpCode)) { setOtpError('Inserisci il codice a 6 cifre.'); return; }
    setOtpBusy('verify'); setOtpError('');
    try {
      const r = await fetch(`/api/quotes/${uuid}/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: otpCode }),
      });
      const d = await r.json();
      if (!d.ok) { setOtpError(d.error || 'Codice errato.'); setOtpCode(''); }
      else setPhase('upload');
    } catch {
      setOtpError('Errore di rete. Riprova.');
    } finally {
      setOtpBusy('');
    }
  };

  // Auto-invio del codice quando si entra nello step verifica (una sola volta).
  useEffect(() => {
    if (phase === 'otp' && !otpSent) sendOtp();
  }, [phase, otpSent, sendOtp]);

  const onFile = (file: File | null) => {
    setError('');
    if (!file) return;
    if (file.type !== 'application/pdf') { setError('Carica un file PDF.'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('Il PDF supera 10MB.'); return; }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setPdfB64(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!pdfB64) { setError('Carica prima la visura (PDF).'); return; }
    setPhase('analyzing'); setError(''); setNotice('');
    try {
      const r = await fetch(`/api/quotes/${uuid}/visura/analyze`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf_base64: pdfB64 }),
      });
      const d = await r.json();
      if (!d.ok) { setError(d.error || 'Analisi non riuscita.'); setPhase('upload'); return; }
      const init: Record<string, string> = {};
      for (const f of FIELDS) init[f.key] = d.fields?.[f.key]?.v || '';
      setValues(init);
      setMismatch(!!d.piva_mismatch);
      if (d.not_a_visura) setNotice('Questo documento non sembra una visura camerale: controlla i dati a mano.');
      else if (d.low_confidence) setNotice('Non siamo riusciti a leggere tutto: controlla e completa i dati.');
      else setNotice('Abbiamo compilato i dati qui sotto: controlla che siano giusti.');
      setPhase('review');
    } catch {
      setError('Errore di rete.'); setPhase('upload');
    }
  };

  const submit = async () => {
    setPhase('submitting'); setError('');
    try {
      const r = await fetch(`/api/quotes/${uuid}/visura/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf_base64: pdfB64, fields: values }),
      });
      const d = await r.json();
      if (!d.ok) { setError(d.error || 'Invio non riuscito.'); setPhase('review'); return; }
      setPhase('done');
    } catch {
      setError('Errore di rete.'); setPhase('review');
    }
  };

  const mostraModulo = phase === 'otp' || phase === 'upload' || phase === 'analyzing' || phase === 'review' || phase === 'submitting';
  const leggendo = phase === 'analyzing';

  return (
    <OnboardingShell riferimento={quoteNumber ? `Pratica ${quoteNumber}` : 'Configurazione'} larghezza={760}>
      <div className="rm-card">
        {phase === 'loading' && <p className="rm-muted">Caricamento in corso.</p>}

        {phase === 'elsewhere' && (
          <>
            <h1>Pratica non disponibile</h1>
            <div className="rm-note rm-note--errore" role="alert" style={{ marginTop: 14 }}>
              {error || 'Questa pratica non è disponibile.'}
            </div>
          </>
        )}

        {phase === 'confirming' && (
          <>
            <h1>Pagamento ricevuto</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
              <span className="rm-spin" aria-hidden="true" />
              <p className="rm-muted">Stiamo confermando il pagamento. Resta su questa pagina.</p>
            </div>
          </>
        )}

        {phase === 'pagamento' && (
          <>
            <h1>Manca il pagamento</h1>
            <p className="rm-muted" style={{ marginTop: 4 }}>{company}</p>
            <div className="rm-note" style={{ marginTop: 16 }}>
              Se hai appena pagato, aspetta qualche minuto e ricarica la pagina. Altrimenti completa prima il
              pagamento del preventivo.
            </div>
          </>
        )}

        {phase === 'done' && (
          <>
            <h1>Pratica inviata</h1>
            <p className="rm-muted" style={{ marginTop: 4 }}>{company}</p>
            <div style={{ marginTop: 18 }}><Tappe corrente={2} /></div>
            <p style={{ marginTop: 18 }}>Ricevi l&apos;esito entro 24 ore, via email. Non devi fare niente.</p>
            <div style={{ marginTop: 20 }}>
              <button onClick={() => router.replace(`/pratica/${uuid}`)} className="rm-btn rm-btn--primary">
                Vai allo stato della pratica <IconaFreccia />
              </button>
            </div>
          </>
        )}

        {mostraModulo && (
          <>
            <h1>Configurazione</h1>
            <p className="rm-muted" style={{ marginTop: 4 }}>
              {[company, 'passo 2 di 4'].filter(Boolean).join(', ')}. Pagamento ricevuto.
            </p>

            <div style={{ marginTop: 18 }}><Tappe corrente={1} /></div>

            {error && (
              <div className="rm-note rm-note--errore" role="alert" style={{ marginTop: 18 }}>{error}</div>
            )}

            {phase === 'otp' && (
              <Sezione titolo="Conferma">
                <Righe>
                  <Campo etichetta="Codice ricevuto via email" intero>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      <CasellePin
                        valore={otpCode}
                        onChange={(v) => { setOtpCode(v); setOtpError(''); }}
                        onInvio={verifyOtp}
                      />
                      <span className="rm-muted">
                        mandato a {emailMasked || 'la tua email'}{' '}
                        <button type="button" style={COME_LINK} onClick={sendOtp} disabled={otpBusy === 'send'}>
                          {otpBusy === 'send' ? 'Invio in corso' : 'Reinvia'}
                        </button>
                      </span>
                    </div>
                  </Campo>
                </Righe>
              </Sezione>
            )}

            {phase === 'otp' && (
              <>
                {otpError && (
                  <div className="rm-note rm-note--errore" role="alert" style={{ marginTop: 16 }}>{otpError}</div>
                )}
                <div style={{ marginTop: 20 }}>
                  <button
                    onClick={verifyOtp}
                    disabled={otpCode.length !== 6 || otpBusy === 'verify'}
                    className="rm-btn rm-btn--primary"
                  >
                    {otpBusy === 'verify' ? 'Verifica in corso' : 'Verifica e continua'} <IconaFreccia />
                  </button>
                </div>
              </>
            )}

            {(phase === 'upload' || phase === 'analyzing' || phase === 'review' || phase === 'submitting') && (
              <Sezione titolo="Visura camerale">
                <Righe>
                  <Campo etichetta="File" intero>
                    {/* A dati letti la visura non si sostituisce al volo: si torna
                        indietro con "Cambia visura", cosi' i campi si rileggono. */}
                    {phase === 'review' || phase === 'submitting' ? (
                      <span>{fileName || 'visura caricata'}</span>
                    ) : (
                    <label
                      onDragOver={(e) => { e.preventDefault(); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (leggendo) return;
                        onFile(e.dataTransfer.files?.[0] || null);
                      }}
                      style={{
                        display: 'block',
                        border: '1px dashed var(--border-strong)',
                        padding: '22px 14px',
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        fontSize: 13,
                        cursor: leggendo ? 'default' : 'pointer',
                      }}
                    >
                      <input
                        type="file"
                        accept="application/pdf"
                        style={{ display: 'none' }}
                        onChange={e => onFile(e.target.files?.[0] || null)}
                        disabled={leggendo}
                      />
                      Trascina qui il PDF della visura, oppure{' '}
                      <span style={{ color: 'var(--brand-text)', textDecoration: 'underline', textUnderlineOffset: 3 }}>scegli il file</span>. Fino a 10 MB.
                    </label>
                    )}
                  </Campo>
                </Righe>

                {(fileName || notice) && (
                  <p
                    className="rm-muted"
                    style={{ borderTop: '1px solid var(--border)', padding: '10px 14px', textAlign: 'center' }}
                  >
                    {fileName ? `Letta ${fileName}. ` : ''}{notice}
                  </p>
                )}

                {leggendo && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '12px 14px' }}>
                    <div className="rm-barra"><span style={{ width: `${progress}%` }} /></div>
                    <p className="rm-muted" style={{ marginTop: 8 }}>
                      Stiamo leggendo la visura. Ci vuole qualche secondo.
                    </p>
                  </div>
                )}
              </Sezione>
            )}

            {(phase === 'upload' || phase === 'analyzing') && (
              <div style={{ marginTop: 20 }}>
                <button onClick={analyze} disabled={!pdfB64 || leggendo} className="rm-btn rm-btn--primary">
                  {leggendo ? 'Lettura in corso' : 'Leggi la visura'} <IconaFreccia />
                </button>
              </div>
            )}

            {(phase === 'review' || phase === 'submitting') && (
              <>
                <Sezione titolo="Verifica dati">
                  <Righe>
                    {FIELDS.map(f => (
                      <Campo
                        key={f.key}
                        intero={f.span}
                        etichetta={f.optional ? `${f.label} (facoltativo)` : f.label}
                      >
                        {f.type === 'select' ? (
                          <select
                            className="rm-input"
                            aria-label={f.label}
                            value={values[f.key] || ''}
                            onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                          >
                            <option value="">— seleziona —</option>
                            {FORME_GIURIDICHE.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : f.key === 'indirizzo' ? (
                          <AddressAutocomplete
                            value={values.indirizzo || ''}
                            onChange={v => setValues(s => ({ ...s, indirizzo: v }))}
                            onPick={p => setValues(s => ({
                              ...s,
                              indirizzo: p.indirizzo || s.indirizzo,
                              citta: p.citta || s.citta,
                              provincia: p.provincia || s.provincia,
                              cap: p.cap || s.cap,
                            }))}
                            className="rm-input"
                          />
                        ) : (
                          <input
                            className="rm-input"
                            aria-label={f.label}
                            value={values[f.key] || ''}
                            onChange={e => setValues(v => ({ ...v, [f.key]: (FMT[f.key] || ((x: string) => x))(e.target.value) }))}
                            inputMode={ATTRS[f.key]?.inputMode}
                            type={ATTRS[f.key]?.type}
                          />
                        )}
                      </Campo>
                    ))}
                  </Righe>

                  {mismatch && (
                    <p
                      className="rm-note rm-note--errore"
                      role="alert"
                      style={{ borderTop: '1px solid var(--border)', textAlign: 'center', color: 'var(--danger)' }}
                    >
                      La partita IVA della visura è diversa da quella del preventivo. Hai caricato il documento giusto?
                    </p>
                  )}
                </Sezione>

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
                  <button onClick={() => setPhase('upload')} className="rm-btn rm-btn--secondary">
                    Cambia visura
                  </button>
                  <button onClick={submit} disabled={phase === 'submitting'} className="rm-btn rm-btn--primary">
                    {phase === 'submitting' ? 'Invio in corso' : 'I dati sono giusti, invia'} <IconaFreccia />
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </OnboardingShell>
  );
}
