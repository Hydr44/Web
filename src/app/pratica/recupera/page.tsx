// Recupero dello stato della pratica: il cliente che ha perso il link scrive
// l'email del preventivo, riceve un codice a sei cifre e arriva alla sua pagina.
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingShell, CasellePin, COME_LINK, IconaFreccia } from '@/components/OnboardingShell';

export default function RecuperaPraticaPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [emailMasked, setEmailMasked] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  // Ora dell'invio: serve a dire da quando valgono i dieci minuti.
  const [inviatoAlle, setInviatoAlle] = useState('');

  const sendCode = async () => {
    setError('');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) { setError('Inserisci un indirizzo email valido.'); return; }
    setBusy('send');
    try {
      const r = await fetch('/api/pratica/recover', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const d = await r.json();
      if (!d.ok && d.error) { setError(d.error); return; }
      setEmailMasked(d.email_masked || '');
      setInviatoAlle(new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }));
      setStep('otp');
    } catch {
      setError('Errore di rete. Riprova.');
    } finally {
      setBusy('');
    }
  };

  const verifyCode = async () => {
    setError('');
    if (!/^\d{6}$/.test(code)) { setError('Inserisci il codice a 6 cifre.'); return; }
    setBusy('verify');
    try {
      const r = await fetch('/api/pratica/recover/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code }),
      });
      const d = await r.json();
      if (!d.ok) { setError(d.error || 'Codice errato.'); setCode(''); return; }
      router.push(`/pratica/${d.uuid}`);
    } catch {
      setError('Errore di rete. Riprova.');
    } finally {
      setBusy('');
    }
  };

  // Se l'email cambia dopo l'invio, il codice ricevuto non vale piu': si torna
  // al primo passo invece di far fallire la verifica.
  const cambiaEmail = (v: string) => {
    setEmail(v);
    setError('');
    if (step === 'otp') { setStep('email'); setCode(''); }
  };

  return (
    <OnboardingShell riferimento="Stato pratica">
      <div className="rm-card">
        <h1>Controlla lo stato della tua pratica</h1>
        <p className="rm-muted" style={{ marginTop: 4 }}>
          Scrivi l&apos;email usata per il preventivo: ti mandiamo un codice a sei cifre.
        </p>

        <div className="rm-field" style={{ marginTop: 20 }}>
          <label className="rm-label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="rm-input"
            value={email}
            onChange={(e) => cambiaEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && step === 'email') sendCode(); }}
            placeholder="nome@azienda.it"
            autoComplete="email"
          />
        </div>

        {step === 'otp' && (
          <div className="rm-field" style={{ marginTop: 18 }}>
            <span className="rm-label">Codice ricevuto</span>
            <CasellePin valore={code} onChange={(v) => { setCode(v); setError(''); }} onInvio={verifyCode} />
            <p className="rm-muted">
              Mandato alle {inviatoAlle}{emailMasked ? ` a ${emailMasked}` : ''}. Vale per 10 minuti.{' '}
              <button type="button" style={COME_LINK} onClick={sendCode} disabled={busy === 'send'}>
                {busy === 'send' ? 'Invio in corso' : 'Reinvia'}
              </button>
            </p>
          </div>
        )}

        {error && <div className="rm-note rm-note--errore" role="alert" style={{ marginTop: 16 }}>{error}</div>}

        <div style={{ marginTop: 20 }}>
          {step === 'email' ? (
            <button onClick={sendCode} disabled={busy === 'send'} className="rm-btn rm-btn--primary">
              {busy === 'send' ? 'Invio in corso' : 'Invia il codice'} <IconaFreccia />
            </button>
          ) : (
            <button
              onClick={verifyCode}
              disabled={code.length !== 6 || busy === 'verify'}
              className="rm-btn rm-btn--primary"
            >
              {busy === 'verify' ? 'Verifica in corso' : 'Controlla lo stato'} <IconaFreccia />
            </button>
          )}
        </div>
      </div>
    </OnboardingShell>
  );
}
