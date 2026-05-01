'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { Loader2, ShieldCheck, ShieldAlert, Smartphone, Trash2 } from 'lucide-react';

type Factor = {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: string;
  created_at: string;
};

type EnrollState = {
  factorId: string;
  qrCode: string;
  secret: string;
} | null;

export default function SecuritySettingsPage() {
  const supabase = supabaseBrowser();
  const [loading, setLoading] = useState(true);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enroll, setEnroll] = useState<EnrollState>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const verifiedFactors = factors.filter(f => f.status === 'verified');
  const has2FA = verifiedFactors.length > 0;

  const loadFactors = async () => {
    const { data, error: err } = await supabase.auth.mfa.listFactors();
    if (err) {
      setError(err.message);
      return;
    }
    setFactors(data?.all ?? []);
  };

  useEffect(() => {
    (async () => {
      await loadFactors();
      setLoading(false);
    })();
  }, []);

  const startEnroll = async () => {
    setError(null);
    setInfo(null);
    setBusy(true);
    const { data, error: err } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: `RescueManager ${new Date().toLocaleDateString('it-IT')}`,
    });
    setBusy(false);
    if (err || !data) {
      setError(err?.message || 'Impossibile avviare la registrazione');
      return;
    }
    setEnroll({
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    });
  };

  const verifyEnroll = async () => {
    if (!enroll || code.length < 6) return;
    setError(null);
    setBusy(true);
    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId: enroll.factorId });
    if (cErr || !challenge) {
      setBusy(false);
      setError(cErr?.message || 'Errore creazione challenge');
      return;
    }
    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId: enroll.factorId,
      challengeId: challenge.id,
      code,
    });
    setBusy(false);
    if (vErr) {
      setError(vErr.message || 'Codice non valido');
      return;
    }
    setInfo('2FA attivata con successo.');
    setEnroll(null);
    setCode('');
    await loadFactors();
  };

  const cancelEnroll = async () => {
    if (!enroll) return;
    setBusy(true);
    await supabase.auth.mfa.unenroll({ factorId: enroll.factorId });
    setBusy(false);
    setEnroll(null);
    setCode('');
    await loadFactors();
  };

  const removeFactor = async (factorId: string) => {
    if (!confirm('Sei sicuro di voler disattivare la 2FA?')) return;
    setBusy(true);
    const { error: err } = await supabase.auth.mfa.unenroll({ factorId });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setInfo('2FA disattivata.');
    await loadFactors();
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Sicurezza</h1>
        <p className="mt-1 text-gray-500">Gestisci 2FA, password e sessioni attive.</p>
      </header>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {info && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {info}
        </div>
      )}

      <section className="rounded-lg border bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {has2FA ? (
              <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0" />
            ) : (
              <ShieldAlert className="h-6 w-6 text-amber-500 shrink-0" />
            )}
            <div>
              <h2 className="font-semibold">Autenticazione a due fattori (TOTP)</h2>
              <p className="mt-1 text-sm text-gray-600">
                {has2FA
                  ? 'La 2FA è attiva sul tuo account. Ti verrà richiesto un codice ad ogni accesso.'
                  : 'Aggiungi un livello di sicurezza in più con un\'app authenticator (Google Authenticator, Authy, 1Password, Bitwarden).'}
              </p>
            </div>
          </div>
          {!has2FA && !enroll && (
            <button
              onClick={startEnroll}
              disabled={busy || loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Attiva 2FA'}
            </button>
          )}
        </div>

        {loading && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Caricamento...
          </div>
        )}

        {enroll && (
          <div className="mt-6 border-t pt-6 space-y-4">
            <p className="text-sm text-gray-700">
              1. Scansiona il QR code con la tua app authenticator.
            </p>
            <div
              className="inline-block rounded-md border bg-white p-3"
              dangerouslySetInnerHTML={{ __html: enroll.qrCode }}
            />
            <p className="text-xs text-gray-500">
              Oppure inserisci manualmente questa chiave:
              <code className="ml-1 rounded bg-gray-100 px-2 py-0.5 font-mono">{enroll.secret}</code>
            </p>
            <p className="text-sm text-gray-700">2. Inserisci il codice a 6 cifre generato dall'app:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-32 rounded-md border px-3 py-2 font-mono text-lg tracking-widest"
              />
              <button
                onClick={verifyEnroll}
                disabled={busy || code.length !== 6}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verifica e attiva'}
              </button>
              <button
                onClick={cancelEnroll}
                disabled={busy}
                className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
              >
                Annulla
              </button>
            </div>
          </div>
        )}

        {has2FA && (
          <ul className="mt-5 space-y-2">
            {verifiedFactors.map(f => (
              <li key={f.id} className="flex items-center justify-between rounded-md border bg-gray-50 p-3">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium">{f.friendly_name || 'Authenticator'}</div>
                    <div className="text-xs text-gray-500">
                      Attiva dal {new Date(f.created_at).toLocaleDateString('it-IT')}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeFactor(f.id)}
                  disabled={busy}
                  className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Disattiva
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
