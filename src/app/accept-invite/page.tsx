/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Proprietario',
  admin: 'Amministratore',
  manager: 'Responsabile',
  operator: 'Operatore',
  viewer: 'Visualizzatore',
};

// L'intestazione del sito e' fissa in alto e alta 112 px: la cornice parte sotto.

function Lato({ orgName }: { orgName?: string | null }) {
  return (
    <aside className="rm-gate__lato">
      <Link href="/" className="inline-flex" style={{ textDecoration: 'none' }}>
        <img src="/assets/logos/logo-principale-bianco.svg" alt="RescueManager" width={160} height={53} />
      </Link>

      <div>
        <h2>{orgName ? `Entra in ${orgName}` : 'Entra nel team'}</h2>
        <p style={{ marginTop: 14, maxWidth: '38ch' }}>
          Completa la registrazione: trovi subito le chiamate, i mezzi e le pratiche della tua azienda.
        </p>
        <ul>
          <li>Soccorso e trasporti con posizione dei mezzi</li>
          <li>Magazzino ricambi</li>
          <li>RENTRI, SDI e RVFU collegati</li>
          <li>App per gli autisti, compresa nel canone</li>
        </ul>
      </div>

      <p style={{ fontSize: 12.5, color: 'var(--sidebar-muted)' }}>
        © {new Date().getFullYear()} RescueManager · rescuemanager.eu
      </p>
    </aside>
  );
}

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<any>(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'loading' | 'register' | 'success' | 'error'>('loading');

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accepting, setAccepting] = useState(false);

  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!token) {
      setError('Il link non contiene il codice dell\'invito. Chiedi che ti venga inviato di nuovo.');
      setStep('error');
      setLoading(false);
      return;
    }
    loadInvite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadInvite() {
    try {
      setLoading(true);
      const { data, error: rpcError } = await supabase.rpc('verify_team_invite', { p_token: token });
      if (rpcError || !data?.success) {
        setError(data?.error || 'Invito non trovato oppure già usato. Chiedi un nuovo invito.');
        setStep('error');
        return;
      }
      setInvite({ id: data.id, org_id: data.org_id, role: data.role, email: data.email, orgName: data.org_name });
      setStep('register');
    } catch (err: any) {
      console.error('Error loading invite:', err);
      setError("Non è stato possibile leggere l'invito. Riprova fra poco.");
      setStep('error');
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return setError('Inserisci nome e cognome.');
    if (password.length < 8) return setError('La password deve avere almeno 8 caratteri.');
    if (password !== confirmPassword) return setError('Le due password non coincidono. Riscrivile uguali.');

    try {
      setAccepting(true);
      setError('');
      const res = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, fullName: fullName.trim(), password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Non è stato possibile accettare l'invito. Riprova fra poco.");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: json.email || invite.email,
        password,
      });
      setStep('success');
      setTimeout(() => router.push(signInError ? '/login' : '/dashboard'), 1800);
    } catch (err: any) {
      console.error('Accept invite error:', err);
      setError(err.message || "Non è stato possibile accettare l'invito. Riprova fra poco.");
    } finally {
      setAccepting(false);
    }
  }

  // — Stati semplici —
  if (loading) {
    return (
      <div className="rm-prod">
        <div className="rm-gate" >
          <Lato />
          <main className="rm-gate__corpo">
            <div className="rm-gate__modulo">
              <h1>Apertura dell&apos;invito</h1>
              <p className="rm-muted">Attendi qualche secondo.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="rm-prod">
        <div className="rm-gate" >
          <Lato />
          <main className="rm-gate__corpo">
            <div className="rm-gate__modulo">
              <div>
                <h1>Invito non valido</h1>
                <p className="rm-muted" style={{ marginTop: 6 }}>Non possiamo completare la registrazione.</p>
              </div>
              <div className="rm-note rm-note--errore" role="alert">{error}</div>
              <button onClick={() => router.push('/login')} className="rm-btn rm-btn--secondary rm-btn--full">
                Vai all&apos;accesso
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="rm-prod">
        <div className="rm-gate" >
          <Lato orgName={invite?.orgName} />
          <main className="rm-gate__corpo">
            <div className="rm-gate__modulo">
              <div>
                <h1>Registrazione completata</h1>
                <p className="rm-muted" style={{ marginTop: 6 }}>
                  Ora fai parte di <strong>{invite?.orgName}</strong>. Fra qualche istante apriamo l&apos;applicazione.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // — Registrazione —
  return (
    <div className="rm-prod">
      <div className="rm-gate" >
        <Lato orgName={invite?.orgName} />

        <main className="rm-gate__corpo">
          <div className="rm-gate__modulo">
            <div className="lg:hidden">
              <Link href="/" className="inline-flex" style={{ textDecoration: 'none' }}>
                <img src="/assets/logos/logo-principale-bianco.svg" alt="RescueManager" width={150} height={50} />
              </Link>
            </div>

            <div>
              <h1>Unisciti al team</h1>
              <p className="rm-muted" style={{ marginTop: 6 }}>
                Sei stato invitato in <strong>{invite?.orgName}</strong>. Scegli la password e inizi a lavorare.
              </p>
            </div>

            <div className="rm-righe">
              <div className="rm-riga"><span>Email</span><span style={{ overflowWrap: 'anywhere' }}>{invite?.email}</span></div>
              <div className="rm-riga"><span>Ruolo</span><span>{ROLE_LABELS[invite?.role] || invite?.role}</span></div>
            </div>

            {error && (
              <div className="rm-note rm-note--errore" role="alert">{error}</div>
            )}

            <form onSubmit={handleAccept} className="flex flex-col gap-4">
              <div className="rm-field">
                <label htmlFor="ai-name" className="rm-label">Nome e cognome</label>
                <input
                  id="ai-name"
                  type="text"
                  className="rm-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Mario Rossi"
                  autoComplete="name"
                  required
                />
              </div>
              <div className="rm-field">
                <label htmlFor="ai-pwd" className="rm-label">Password</label>
                <input
                  id="ai-pwd"
                  type="password"
                  className="rm-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Almeno 8 caratteri"
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
              </div>
              <div className="rm-field">
                <label htmlFor="ai-pwd2" className="rm-label">Ripeti la password</label>
                <input
                  id="ai-pwd2"
                  type="password"
                  className="rm-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="La stessa password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
              </div>
              <button type="submit" className="rm-btn rm-btn--primary rm-btn--full" disabled={accepting}>
                {accepting ? 'Registrazione in corso' : 'Accetta l’invito'}
              </button>
            </form>

            <p className="rm-muted">
              Accettando accetti i <Link href="/terms-of-use">termini d&apos;uso</Link> e l&apos;<Link href="/privacy-policy">informativa privacy</Link>.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="rm-prod">
          <div className="rm-gate" >
            <main className="rm-gate__corpo">
              <p className="rm-muted">Apertura dell&apos;invito in corso.</p>
            </main>
          </div>
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
