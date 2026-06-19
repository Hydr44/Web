// Recupera link pratica (F5). Il cliente senza account inserisce l'email e gli
// rimandiamo via email il link /pratica della sua pratica in corso.
'use client';

import { useState } from 'react';

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
    <main className="min-h-screen bg-[#0f172a] text-slate-200 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#1e293b] border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/20">
        <p className="text-xs text-blue-400 font-semibold tracking-[0.2em] uppercase">RescueManager</p>
        <h1 className="text-xl sm:text-2xl font-semibold mt-1.5 text-white">Controlla lo stato della pratica</h1>

        {sent ? (
          <p className="text-sm text-slate-300 mt-4">
            Se esiste una pratica associata a <b className="text-slate-200">{email}</b>, ti abbiamo inviato
            via email il link per controllarne lo stato. Controlla anche lo spam.
          </p>
        ) : (
          <>
            <p className="text-sm text-slate-400 mt-1">
              Inserisci l&apos;email usata per il preventivo: ti rimandiamo il link della tua pratica.
            </p>
            <div className="mt-5">
              <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') submit(); }}
                placeholder="nome@azienda.it"
                className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
              {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
              <button onClick={submit} disabled={busy}
                className="mt-4 w-full px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-50 transition-colors">
                {busy ? 'Invio…' : 'Invia il link via email'}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
