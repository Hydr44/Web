'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';
import Link from 'next/link';

// Pulsante che sembra un link: manca una classe nel foglio di stile.
const COME_LINK: React.CSSProperties = {
  background: 'transparent',
  border: 0,
  padding: 0,
  fontFamily: 'inherit',
  fontSize: 12.5,
  color: 'var(--brand-text)',
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  cursor: 'pointer',
};

// Un pulsante che e' un collegamento: serve una regola per `a.rm-btn` nel foglio di stile.
const COME_PULSANTE: React.CSSProperties = { textDecoration: 'none', color: 'var(--text)' };

// L'intestazione del sito e' fissa in alto e alta 112 px: la cornice parte sotto.

function Lato() {
  return (
    <aside className="rm-gate__lato">
      <Link href="/" className="inline-flex" style={{ textDecoration: 'none' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logos/logo-principale-bianco.svg" alt="RescueManager" width={160} height={53} />
      </Link>

      <div>
        <h2>Ancora un passo</h2>
        <p style={{ marginTop: 14, maxWidth: '38ch' }}>
          Scegli la password del tuo account: da qui entri sia dal browser sia dall&apos;applicazione
          per il computer.
        </p>
        <ul>
          <li>Tutti i moduli del tuo piano, compresi</li>
          <li>Browser e applicazione per il computer</li>
          <li>Registri RENTRI e fatture SDI collegati</li>
          <li>Assistenza dedicata</li>
        </ul>
      </div>

      <p style={{ fontSize: 12.5, color: 'var(--sidebar-muted)' }}>
        © {new Date().getFullYear()} RescueManager · rescuemanager.eu
      </p>
    </aside>
  );
}

function LogoPiccolo() {
  return (
    <div className="lg:hidden">
      <Link href="/" className="inline-flex" style={{ textDecoration: 'none' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logos/logo-principale-bianco.svg" alt="RescueManager" width={150} height={50} />
      </Link>
    </div>
  );
}

export default function SetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [stage, setStage] = useState<'verifying' | 'form' | 'success' | 'error'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accountInfo, setAccountInfo] = useState<{ orgName: string | null; role: string | null; isDriver?: boolean } | null>(null);

  useEffect(() => {
    const init = async () => {
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');

      if (tokenHash && type === 'recovery') {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
        if (error) {
          setErrorMsg("Link non valido o scaduto. Chiedi un nuovo link all'amministratore.");
          setStage('error');
        } else {
          setStage('form');
        }
        return;
      }

      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          setErrorMsg("Link non valido o scaduto. Chiedi un nuovo link all'amministratore.");
          setStage('error');
        } else {
          setStage('form');
        }
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setStage('form');
      } else {
        setErrorMsg('Nessun token di recupero trovato. Usa il link ricevuto via email.');
        setStage('error');
      }
    };

    init();
  }, []);

  const passwordStrength = (): { score: number; label: string; color: string } => {
    const p = password;
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 1) return { score, label: 'Debole', color: 'var(--text-secondary)' };
    if (score <= 3) return { score, label: 'Media', color: 'var(--text-secondary)' };
    return { score, label: 'Forte', color: 'var(--brand)' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setErrorMsg('Le due password non coincidono. Riscrivile uguali.'); return; }
    if (password.length < 8) { setErrorMsg('La password deve avere almeno 8 caratteri.'); return; }
    setLoading(true);
    setErrorMsg('');
    const { error } = await supabase.auth.updateUser({
      password,
      data: { force_password_change: false },
    });
    if (error) {
      console.error('[set-password] updateUser:', error);
      setErrorMsg(
        /different|same/i.test(error.message || '')
          ? 'La nuova password deve essere diversa da quella precedente.'
          : 'Non è stato possibile salvare la password. Riprova, oppure chiedi un nuovo link.'
      );
      setLoading(false);
      return;
    }

    // Recupera organizzazione + ruolo per mostrarli, e per gli autisti
    // marca l'onboarding completato (coerente con l'app mobile).
    // Leggi anche is_demo: per le demo NON serve l'onboarding wizard
    // (è pensato per clienti paganti che devono configurare cert/SDI/ecc.).
    let isDemoOrg = false;
    let isDriver = false;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const meta = (user?.user_metadata as { role?: string; source?: string; staff_driver_id?: string } | undefined);
      const role = meta?.role ?? null;
      // Autista invitato dal gestionale: l'invito setta source='driver-account'.
      isDriver = meta?.source === 'driver-account' || !!meta?.staff_driver_id || role === 'autista';
      let orgName: string | null = null;
      if (user?.id && !isDriver) {
        const { data: prof } = await supabase
          .from('profiles').select('org_id').eq('id', user.id).maybeSingle();
        if (prof?.org_id) {
          const { data: org } = await supabase
            .from('orgs').select('name, is_demo').eq('id', prof.org_id).maybeSingle();
          orgName = (org as { name?: string } | null)?.name ?? null;
          isDemoOrg = (org as { is_demo?: boolean } | null)?.is_demo === true;
        }
      }
      setAccountInfo({ orgName, role, isDriver });
    } catch {
      /* non bloccare il successo se la lettura org fallisce */
    }

    setStage('success');
    // Autista: NON va all'onboarding azienda — apre l'app e accede. Resta sulla
    // schermata di successo con le istruzioni per l'app.
    if (isDriver) return;
    // Demo: vai dritto al dashboard. Altrimenti onboarding azienda (clienti).
    const dest = isDemoOrg ? '/dashboard' : '/onboarding';
    setTimeout(() => router.push(dest), 4000);
  };

  const strength = passwordStrength();

  if (stage === 'verifying') {
    return (
      <div className="rm-prod">
        <div className="rm-gate" >
          <Lato />
          <main className="rm-gate__corpo">
            <div className="rm-gate__modulo">
              <LogoPiccolo />
              <div>
                <h1>Verifica del link</h1>
                <p className="rm-muted" style={{ marginTop: 6 }}>Controllo in corso. Attendi qualche secondo.</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (stage === 'error') {
    return (
      <div className="rm-prod">
        <div className="rm-gate" >
          <Lato />
          <main className="rm-gate__corpo">
            <div className="rm-gate__modulo">
              <LogoPiccolo />
              <div>
                <h1>Link non valido</h1>
                <p className="rm-muted" style={{ marginTop: 6 }}>Non possiamo aprire questa pagina.</p>
              </div>
              <div className="rm-note rm-note--errore" role="alert">{errorMsg}</div>
              <Link href="/" className="rm-btn rm-btn--secondary rm-btn--full" style={COME_PULSANTE}>Torna al sito</Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (stage === 'success') {
    return (
      <div className="rm-prod">
        <div className="rm-gate" >
          <Lato />
          <main className="rm-gate__corpo">
            <div className="rm-gate__modulo">
              <LogoPiccolo />
              <div>
                <h1>Password impostata</h1>
                <p className="rm-muted" style={{ marginTop: 6 }}>
                  {accountInfo?.isDriver
                    ? "Apri l'applicazione RescueManager sul telefono e accedi con la tua email e la password appena scelta."
                    : 'Account attivo. Fra qualche istante apriamo la configurazione iniziale.'}
                </p>
              </div>

              {accountInfo && (accountInfo.orgName || accountInfo.role) && (
                <div className="rm-righe">
                  {accountInfo.orgName && (
                    <div className="rm-riga"><span>Azienda</span><span>{accountInfo.orgName}</span></div>
                  )}
                  {accountInfo.role && (
                    <div className="rm-riga">
                      <span>Ruolo</span>
                      <span style={{ textTransform: 'capitalize' }}>
                        {accountInfo.role === 'autista' ? 'Autista' : accountInfo.role}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {!accountInfo?.isDriver && (
                <p className="rm-muted">
                  Se la pagina non si apre da sola,{' '}
                  <Link href="/onboarding">vai alla configurazione</Link>.
                </p>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="rm-prod">
      <div className="rm-gate" >
        <Lato />

        <main className="rm-gate__corpo">
          <div className="rm-gate__modulo">
            <LogoPiccolo />

            <div>
              <h1>Imposta la password</h1>
              <p className="rm-muted" style={{ marginTop: 6 }}>
                Scegli la password che userai per entrare in RescueManager.
              </p>
            </div>

            {errorMsg && (
              <div className="rm-note rm-note--errore" role="alert">{errorMsg}</div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="rm-field">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="password" className="rm-label">Nuova password</label>
                  <button
                    type="button"
                    style={COME_LINK}
                    onClick={() => setShowPass(!showPass)}
                    aria-pressed={showPass}
                    aria-controls="password"
                  >
                    {showPass ? 'Nascondi' : 'Mostra'}
                  </button>
                </div>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className="rm-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Almeno 8 caratteri"
                  autoComplete="new-password"
                  disabled={loading}
                />
                {password && (
                  <div className="flex flex-col gap-1" style={{ marginTop: 2 }}>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div
                          key={i}
                          style={{
                            height: 3,
                            flex: 1,
                            background: i <= strength.score ? strength.color : 'var(--layer-3)',
                          }}
                        />
                      ))}
                    </div>
                    <span className="rm-muted">Sicurezza: {strength.label.toLowerCase()}</span>
                  </div>
                )}
              </div>

              <div className="rm-field">
                <label htmlFor="confirm" className="rm-label">Ripeti la password</label>
                <input
                  id="confirm"
                  type={showPass ? 'text' : 'password'}
                  className="rm-input"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  aria-invalid={!!confirm && confirm !== password}
                  aria-describedby={confirm && confirm !== password ? 'confirm-errore' : undefined}
                  placeholder="La stessa password"
                  autoComplete="new-password"
                  disabled={loading}
                />
                {confirm && confirm !== password && (
                  <span id="confirm-errore" className="rm-muted" style={{ color: 'var(--danger)' }}>
                    Le due password non coincidono.
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="rm-btn rm-btn--primary rm-btn--full"
                disabled={loading || !password || !confirm}
              >
                {loading ? 'Salvataggio in corso' : 'Imposta la password'}
              </button>
            </form>

            <div className="rm-sep" style={{ margin: 0 }} />

            <p className="rm-muted">
              Ti serve una mano? <a href="mailto:info@rescuemanager.eu">Scrivici</a>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
