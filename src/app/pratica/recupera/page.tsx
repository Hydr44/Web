// Recupera link pratica (F5). Il cliente senza account inserisce l'email e gli
// rimandiamo via email il link /pratica. Layout split come /login.
'use client';

import { useState } from 'react';
import { OnboardingShell } from '@/components/OnboardingShell';

export default function RecuperaPraticaPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) { setError('Inserisci un indirizzo email valido.'); return; }
    setBusy(true);
    try {
      const r = await fetch('/api/pratica/recover', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const d = await r.json();
      if (!d.ok && d.error) { setError(d.error); return; }
      setSent(true);
    } catch {
      setError('Errore di rete. Riprova.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingShell panelTitle="Ritrova la tua pratica" panelSubtitle="Hai perso il link? Inserisci l’email del preventivo e te lo rimandiamo.">
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Stato pratica</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a]">Controlla lo stato</h1>

        {sent ? (
          <p className="text-sm text-gray-600 mt-4">
            Se esiste una pratica associata a <b className="text-gray-900">{email}</b>, ti abbiamo inviato
            via email il link per controllarne lo stato. Controlla anche lo spam.
          </p>
        ) : (
          <>
            <p className="text-sm text-gray-500 mt-1 mb-6">
              Inserisci l&apos;email usata per il preventivo: ti rimandiamo il link della tua pratica.
            </p>
            <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') submit(); }}
              placeholder="nome@azienda.it"
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <button onClick={submit} disabled={busy}
              className="mt-4 w-full px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:opacity-50 transition-colors">
              {busy ? 'Invio…' : 'Invia il link via email'}
            </button>
          </>
        )}
      </div>
    </OnboardingShell>
  );
}
