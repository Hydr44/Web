'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function NewsletterForm({ source = 'footer' }: { source?: string }) {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'loading') return;
    if (!consent) {
      setStatus('error');
      setMsg('Accetta il trattamento dei dati per iscriverti.');
      return;
    }
    setStatus('loading');
    setMsg('');
    try {
      const r = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, consent, source }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.success) {
        setStatus('error');
        setMsg(data.error || 'Si è verificato un errore, riprova.');
        return;
      }
      setStatus('ok');
      setMsg(data.already ? 'Sei già iscritto alla newsletter.' : 'Ti abbiamo inviato un\'email: conferma per completare.');
      setEmail('');
      setConsent(false);
    } catch {
      setStatus('error');
      setMsg('Errore di rete, riprova.');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="La tua email"
          className="flex-1 px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 whitespace-nowrap"
        >
          {status === 'loading' ? 'Invio…' : 'Iscriviti'}
        </button>
      </div>

      <label className="flex items-start gap-2 text-[11px] text-slate-500 leading-snug cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-blue-600"
        />
        <span>
          Acconsento al trattamento dei dati per ricevere la newsletter. Vedi la{' '}
          <Link href="/privacy-policy" className="text-slate-400 underline hover:text-white">privacy policy</Link>.
          Puoi disiscriverti in ogni momento.
        </span>
      </label>

      {msg && (
        <p className={`text-xs ${status === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>{msg}</p>
      )}
    </form>
  );
}
