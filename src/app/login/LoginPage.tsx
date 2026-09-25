"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { loginWithPassword } from "@/lib/auth";

// Pulsante che sembra un link: manca una classe nel foglio di stile.
const COME_LINK: React.CSSProperties = {
  background: "transparent",
  border: 0,
  padding: 0,
  fontFamily: "inherit",
  fontSize: 12.5,
  color: "var(--brand-text)",
  textDecoration: "underline",
  textUnderlineOffset: 3,
  cursor: "pointer",
};

// L'intestazione del sito e' fissa in alto e alta 112 px: la cornice parte sotto.

function Lato() {
  return (
    <aside className="rm-gate__lato">
      <Link href="/" className="inline-flex" style={{ textDecoration: "none" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logos/logo-principale-bianco.svg" alt="RescueManager" width={160} height={53} />
      </Link>

      <div>
        <h2>Soccorso, trasporti e autodemolizione in un unico posto</h2>
        <p style={{ marginTop: 14, maxWidth: "38ch" }}>
          Chiamate, carri, ricambi e pratiche restano allineati: il dato si scrive una volta sola.
        </p>
        <ul>
          <li>Registri e formulari RENTRI</li>
          <li>Fatture elettroniche allo SDI</li>
          <li>Pratiche RVFU e radiazioni</li>
          <li>App per gli autisti, compresa nel canone</li>
        </ul>
      </div>

      <p style={{ fontSize: 12.5, color: "var(--sidebar-muted)" }}>
        © {new Date().getFullYear()} RescueManager · rescuemanager.eu
      </p>
    </aside>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Inserisci email e password.");
      return;
    }

    setIsLoading(true);
    setError(null);

    let isSuccess = false;

    try {
      const result = await loginWithPassword(email, password);

      if (result.success && result.user) {
        isSuccess = true;
        await new Promise(resolve => setTimeout(resolve, 800));
        router.push(redirectTo);
        router.refresh(); // forza Next.js a riaggiornare lo state del server
      } else {
        setError(result.error || "Accesso non riuscito. Controlla email e password, poi riprova.");
      }
    } catch {
      setError("Accesso non riuscito per un problema di collegamento. Riprova fra poco.");
    } finally {
      if (!isSuccess) {
        setIsLoading(false);
      }
    }
  };

  // Google login handled by GoogleLoginButton component

  return (
    <div className="rm-prod">
      <div className="rm-gate" >
        <Lato />

        <main className="rm-gate__corpo">
          <div className="rm-gate__modulo">
            <div className="lg:hidden">
              <Link href="/" className="inline-flex" style={{ textDecoration: "none" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/logos/logo-principale-bianco.svg" alt="RescueManager" width={150} height={50} />
              </Link>
            </div>

            <div>
              <h1>Accedi</h1>
              <p className="rm-muted" style={{ marginTop: 6 }}>Entra con le credenziali del tuo account.</p>
            </div>

            {error && (
              <div className="rm-note rm-note--errore" role="alert">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="rm-field">
                <label htmlFor="email" className="rm-label">Email</label>
                <input
                  id="email"
                  type="email"
                  className="rm-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@azienda.it"
                  autoComplete="username"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="rm-field">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="password" className="rm-label">Password</label>
                  <button
                    type="button"
                    style={COME_LINK}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-pressed={showPassword}
                    aria-controls="password"
                    disabled={isLoading}
                  >
                    {showPassword ? "Nascondi" : "Mostra"}
                  </button>
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="rm-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="La password del tuo account"
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                />
                <Link href="/reset" style={{ fontSize: 12.5, alignSelf: "flex-start" }}>
                  Password dimenticata
                </Link>
              </div>

              <button type="submit" className="rm-btn rm-btn--primary rm-btn--full" disabled={isLoading}>
                {isLoading ? "Accesso in corso" : "Accedi"}
              </button>
            </form>

            <div className="rm-sep" style={{ margin: 0 }} />

            <div className="rm-muted flex flex-col gap-2">
              <p>
                Non hai un account? <Link href="/contatti">Richiedi l&apos;accesso</Link>
              </p>
              <p>
                Hai una pratica in corso? <Link href="/pratica/recupera">Controlla lo stato</Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
