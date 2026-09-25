"use client";
import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";

// L'intestazione del sito e' fissa in alto e alta 112 px: la cornice parte sotto.

function Lato() {
  return (
    <aside className="rm-gate__lato">
      <Link href="/" className="inline-flex" style={{ textDecoration: "none" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logos/logo-principale-bianco.svg" alt="RescueManager" width={160} height={53} />
      </Link>

      <div>
        <h2>Recupera l&apos;accesso</h2>
        <p style={{ marginTop: 14, maxWidth: "38ch" }}>
          Ti mandiamo un link per scegliere una nuova password. La vecchia non serve.
        </p>
        <ul>
          <li>Il link arriva all&apos;email dell&apos;account</li>
          <li>Resta valido un&apos;ora</li>
          <li>Vale una volta sola</li>
        </ul>
      </div>

      <p style={{ fontSize: 12.5, color: "var(--sidebar-muted)" }}>
        © {new Date().getFullYear()} RescueManager · rescuemanager.eu
      </p>
    </aside>
  );
}

export default function ResetPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email) {
      setError("Inserisci l'email del tuo account.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = supabaseBrowser();
      const origin = typeof globalThis === "undefined" ? "" : globalThis.location.origin;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/update-password`,
      });

      if (error) {
        console.error("[reset] resetPasswordForEmail:", error);
        setError(
          /rate|seconds|too many/i.test(error.message || "")
            ? "Hai già chiesto il link da poco. Attendi un minuto e riprova."
            : "Non è stato possibile inviare il link. Controlla l'indirizzo email e riprova."
        );
        return;
      }

      setSuccess("Link inviato. Controlla la posta, compresa la cartella dello spam.");
    } catch {
      setError("Invio non riuscito per un problema di collegamento. Riprova fra poco.");
    } finally {
      setIsLoading(false);
    }
  };

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
              <h1>Password dimenticata</h1>
              <p className="rm-muted" style={{ marginTop: 6 }}>
                Inserisci l&apos;email dell&apos;account: ti mandiamo il link per cambiarla.
              </p>
            </div>

            {error && (
              <div className="rm-note rm-note--errore" role="alert">{error}</div>
            )}

            {success && (
              <div className="rm-note rm-note--info" role="status">{success}</div>
            )}

            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="rm-field">
                <label htmlFor="email" className="rm-label">Email</label>
                <input
                  id="email"
                  type="email"
                  className="rm-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@azienda.it"
                  autoComplete="email"
                  required
                  disabled={isLoading}
                />
              </div>

              <button type="submit" className="rm-btn rm-btn--primary rm-btn--full" disabled={isLoading}>
                {isLoading ? "Invio in corso" : "Invia il link"}
              </button>
            </form>

            <div className="rm-sep" style={{ margin: 0 }} />

            <p className="rm-muted">
              <Link href="/login">Torna all&apos;accesso</Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
