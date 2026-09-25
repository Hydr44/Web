"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { loginWithPassword } from "@/lib/auth";
import OAuthRedirect from "@/components/OAuthRedirect";
import { supabaseBrowser } from "@/lib/supabase-browser";

/**
 * Genera un OAuth code crittograficamente sicuro (32 byte → 256 bit).
 * Sostituisce il vecchio `Math.random()` (M5 del security audit): ~47 bit
 * di entropia non sono sufficienti per un codice che vale una sessione.
 */
function generateOAuthCode(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  // base64url (no '/', '+', '=') per stare nelle URL safe.
  const b64 = btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
  return `oauth_${b64}`;
}

/** Cornice scura condivisa da tutti gli stati della pagina. */
function Cornice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rm-prod">
      <div className="rm-gate">
        <div className="rm-gate__corpo">
          <div className="rm-gate__modulo">{children}</div>
        </div>
      </div>
    </div>
  );
}

function DesktopOAuthContent() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [oauthInfo, setOauthInfo] = useState<{
    app_id: string;
    redirect_uri: string;
    state: string;
    state_id: string;
  } | null>(null);

  // useSearchParams deve essere chiamato sempre, non condizionalmente
  const params = useSearchParams();

  // Estrai parametri OAuth
  useEffect(() => {

    const encodedParams = params.get('params');

    // Fallback: prova a leggere direttamente dall'URL se useSearchParams non funziona
    if (!encodedParams) {
      const urlParams = new URLSearchParams(window.location.search);
      const fallbackParams = urlParams.get('params');

      if (fallbackParams) {
        // Usa i parametri dal fallback
        try {
          const decodedString = atob(fallbackParams);
          const decodedParams = JSON.parse(decodedString);

          if (decodedParams.expires_at < Date.now()) {
            setError("Sessione OAuth scaduta. Riprova.");
            return;
          }

          // Stessa whitelist del path principale (vedi commento sotto).
          const FALLBACK_ALLOWED = [
            /^http:\/\/127\.0\.0\.1:\d{2,5}(\/.*)?$/,
            /^http:\/\/localhost:\d{2,5}(\/.*)?$/,
            /^rescuemanager:\/\/oauth(\/.*)?$/,
            /^com\.rescuemanager\.app:\/\/oauth(\/.*)?$/,
          ];
          const ruRaw = String(decodedParams.redirect_uri || '');
          if (!FALLBACK_ALLOWED.some((rx) => rx.test(ruRaw))) {
            console.error('[DesktopOAuth] fallback redirect_uri non autorizzato:', ruRaw);
            setError('Indirizzo di reindirizzamento non autorizzato.');
            return;
          }

          setOauthInfo({
            app_id: decodedParams.app_id,
            redirect_uri: ruRaw,
            state: decodedParams.state,
            state_id: decodedParams.state_code
          });
          return;
        } catch (err) {
          console.error('[DesktopOAuth] Error decoding fallback params:', err);
        }
      }
    }

    if (encodedParams) {
      try {
        // Usa atob per decodificare base64 nel browser (Buffer non è disponibile)
        const decodedString = atob(encodedParams);
        const decodedParams = JSON.parse(decodedString);

        // Verifica scadenza
        if (decodedParams.expires_at < Date.now()) {
          console.error('[DesktopOAuth] OAuth session expired');
          setError("Sessione OAuth scaduta. Riprova.");
          return;
        }

        // Whitelist hardcoded del redirect_uri. Senza, l'audit security ha
        // classificato la route come OPEN REDIRECT (C9): chiunque poteva
        // costruire un URL `?params=base64({redirect_uri:'https://evil.com'})`
        // e farsi forwardare un OAuth code valido se l'utente era loggato.
        const ALLOWED_REDIRECT_URIS = [
          // Electron desktop app — localhost loopback (porta dinamica).
          /^http:\/\/127\.0\.0\.1:\d{2,5}(\/.*)?$/,
          /^http:\/\/localhost:\d{2,5}(\/.*)?$/,
          // Custom protocol Electron prod (registrato in main.js).
          /^rescuemanager:\/\/oauth(\/.*)?$/,
          /^com\.rescuemanager\.app:\/\/oauth(\/.*)?$/,
        ];
        const ruRaw = String(decodedParams.redirect_uri || '');
        const ruOk = ALLOWED_REDIRECT_URIS.some((rx) => rx.test(ruRaw));
        if (!ruOk) {
          console.error('[DesktopOAuth] redirect_uri non autorizzato:', ruRaw);
          setError('Indirizzo di reindirizzamento non autorizzato.');
          return;
        }

        setOauthInfo({
          app_id: decodedParams.app_id,
          redirect_uri: ruRaw,
          state: decodedParams.state,
          state_id: decodedParams.state_code
        });
      } catch (err) {
        console.error('[DesktopOAuth] Error decoding OAuth params:', err);
        console.error('[DesktopOAuth] Error details:', {
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined
        });
        setError(`Parametri OAuth non validi: ${err instanceof Error ? err.message : 'Errore sconosciuto'}`);
      }
    } else {
      console.error('[DesktopOAuth] No params found in URL');
      setError("Parametri OAuth mancanti. L'URL potrebbe non essere corretto. Riprova il login dalla desktop app.");
    }
  }, [params]);

  // Auto-login: se l'utente ha già una sessione Supabase attiva, salta il form
  useEffect(() => {
    if (!oauthInfo || success || redirectUrl) return;

    const checkExistingSession = async () => {
      try {
        const supabase = supabaseBrowser();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return; // Nessuna sessione, mostra il form

        setIsLoading(true);
        setError(null);

        // Genera OAuth code automaticamente
        const oauthCode = generateOAuthCode();

        const { error: oauthError } = await supabase
          .from('oauth_codes')
          .insert({
            code: oauthCode,
            user_id: user.id,
            app_id: oauthInfo.app_id,
            redirect_uri: oauthInfo.redirect_uri,
            state: oauthInfo.state,
            expires_at: new Date(Date.now() + 5 * 60 * 1000),
            used: false
          });

        if (oauthError) {
          console.error('[DesktopOAuth] Auto-login error:', oauthError);
          setIsLoading(false);
          return; // Fallback: mostra il form
        }

        setSuccess(true);
        const url = `${oauthInfo.redirect_uri}?code=${oauthCode}&state=${oauthInfo.state}`;
        setRedirectUrl(url);
      } catch (err) {
        console.error('[DesktopOAuth] Auto-login check failed:', err);
        setIsLoading(false);
      }
    };

    checkExistingSession();
  }, [oauthInfo, success, redirectUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Inserisci email e password.");
      return;
    }

    if (!oauthInfo) {
      setError("Parametri OAuth non validi.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {

      const result = await loginWithPassword(email, password);

      if (result.success && result.user) {

        // Genera OAuth code
        const oauthCode = generateOAuthCode();

        // Salva OAuth code nel database
        const supabase = supabaseBrowser();

        // Verifica autenticazione
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

        const { data: insertData, error: oauthError } = await supabase
          .from('oauth_codes')
          .insert({
            code: oauthCode,
            user_id: result.user.id,
            app_id: oauthInfo.app_id,
            redirect_uri: oauthInfo.redirect_uri,
            state: oauthInfo.state,
            expires_at: new Date(Date.now() + 5 * 60 * 1000), // 5 minuti
            used: false
          })
          .select();

        if (oauthError) {
          console.error('=== OAUTH CODE SAVE ERROR ===');
          console.error('Error:', oauthError);
          setError("Errore durante la generazione del codice OAuth.");
          return;
        }


        setSuccess(true);
        setError("Accesso completato. Reindirizzamento all'applicazione desktop in corso.");

        // Prepara URL di redirect
        const redirectUrl = `${oauthInfo.redirect_uri}?code=${oauthCode}&state=${oauthInfo.state}`;
        setRedirectUrl(redirectUrl);

      } else {
        setError(result.error || "Credenziali non valide.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Errore durante l'accesso. Riprova.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!oauthInfo) {
    return (
      <Cornice>
        <div className="rm-card">
          <p className="rm-eyebrow">Accesso dall&apos;applicazione desktop</p>
          <h2 style={{ marginTop: 10 }}>Lettura della richiesta</h2>
          <p className="rm-muted" style={{ marginTop: 8 }}>
            Attendere il controllo dei parametri di autorizzazione.
          </p>
        </div>
        {error && (
          <div className="rm-note rm-note--errore">
            <p style={{ fontWeight: 600, marginBottom: 4 }}>Richiesta non valida</p>
            <p>{error}</p>
            <p style={{ marginTop: 10 }}>
              <a href="/login">Torna all&apos;accesso</a>
            </p>
          </div>
        )}
      </Cornice>
    );
  }

  // Se abbiamo l'URL di redirect, mostra il componente di redirect
  if (redirectUrl) {
    return (
      <Cornice>
        <OAuthRedirect redirectUrl={redirectUrl} />
      </Cornice>
    );
  }

  return (
    <div className="rm-prod">
      <div className="rm-gate">
        {/* Lato blu: identita' e cosa fa l'applicazione */}
        <div className="rm-gate__lato">
          <img
            src="/assets/logos/logo-principale-bianco.svg"
            alt="RescueManager"
            style={{ width: 160, height: "auto" }}
          />

          <div>
            <p className="rm-eyebrow" style={{ color: "var(--sidebar-muted)" }}>
              Applicazione desktop
            </p>
            <h2 style={{ marginTop: 12 }}>
              Accedi alla tua
              <br />
              applicazione.
            </h2>
            <p style={{ marginTop: 14, maxWidth: 380 }}>
              Soccorso e trasporti, ricambi, RENTRI, SDI e RVFU dalla postazione
              di lavoro.
            </p>
            <ul>
              <li>Sincronizzazione automatica</li>
              <li>Accesso ai dati anche senza rete</li>
              <li>Notifiche sulla postazione</li>
              <li>Archivi locali per le liste lunghe</li>
            </ul>
          </div>

          <p style={{ fontSize: 12 }}>
            © {new Date().getFullYear()} RescueManager · rescuemanager.eu
          </p>
        </div>

        {/* Lato modulo */}
        <div className="rm-gate__corpo">
          <div className="rm-gate__modulo">
            <div className="lg:hidden">
              <img
                src="/assets/logos/logo-principale-bianco.svg"
                alt="RescueManager"
                style={{ width: 150, height: "auto" }}
              />
            </div>

            <div>
              <p className="rm-eyebrow">Autorizzazione</p>
              <h1 style={{ marginTop: 10 }}>Accesso dall&apos;applicazione</h1>
              <p className="rm-muted" style={{ marginTop: 8 }}>
                L&apos;applicazione desktop ha richiesto di collegarsi al tuo
                account. Inserisci le credenziali per autorizzarla.
              </p>
            </div>

            {error && <div className="rm-note rm-note--errore">{error}</div>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="rm-field">
                <label htmlFor="email" className="rm-label">
                  Indirizzo email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rm-input"
                  placeholder="nome@azienda.it"
                  disabled={isLoading}
                />
              </div>

              <div className="rm-field">
                <label htmlFor="password" className="rm-label">
                  Password
                </label>
                <div className="rm-prefix">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rm-input"
                    placeholder="Password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="rm-btn rm-btn--ghost"
                    style={{ height: 38, padding: "0 10px", gap: 0 }}
                    disabled={isLoading}
                    aria-label={showPassword ? "Nascondi la password" : "Mostra la password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="rm-btn rm-btn--primary rm-btn--full"
              >
                <span>{isLoading ? "Accesso in corso" : "Autorizza e accedi"}</span>
              </button>
            </form>

            <div className="rm-sep" />

            <p className="rm-muted">
              Non hai ancora un account? <a href="/contatti">Richiedi l&apos;attivazione</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DesktopOAuthPage() {
  return (
    <Suspense fallback={
      <Cornice>
        <div className="rm-card">
          <p className="rm-eyebrow">Accesso dall&apos;applicazione desktop</p>
          <h2 style={{ marginTop: 10 }}>Caricamento</h2>
          <p className="rm-muted" style={{ marginTop: 8 }}>Attendere.</p>
        </div>
      </Cornice>
    }>
      <DesktopOAuthContent />
    </Suspense>
  );
}
