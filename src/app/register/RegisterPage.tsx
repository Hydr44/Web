"use client";
import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// Un pulsante che e' un collegamento: serve una regola per `a.rm-btn` nel foglio di stile.
const COME_PULSANTE: React.CSSProperties = { textDecoration: 'none', color: 'var(--text)' };

// L'intestazione del sito e' fissa in alto e alta 112 px: la cornice parte sotto.

function safeRedirect(val: string | null, fallback = "/dashboard") {
  if (!val) return fallback;
  try {
    const url = new URL(val, "http://dummy");
    const path = url.pathname + (url.search || "") + (url.hash || "");
    return path.startsWith("/") ? path : fallback;
  } catch {
    return val.startsWith("/") ? val : fallback;
  }
}

// Casella di spunta: manca una classe nel foglio di stile.
const CHECKBOX: React.CSSProperties = {
  width: 16,
  height: 16,
  marginTop: 2,
  flex: "0 0 auto",
  accentColor: "var(--brand)",
};

function Lato() {
  return (
    <aside className="rm-gate__lato">
      <Link href="/" className="inline-flex" style={{ textDecoration: "none" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logos/logo-principale-bianco.svg" alt="RescueManager" width={160} height={53} />
      </Link>

      <div>
        <h2>Richiedi l&apos;accesso</h2>
        <p style={{ marginTop: 14, maxWidth: "38ch" }}>
          Ogni ambiente di lavoro lo prepariamo noi: certificati, registri e numerazioni sono
          gia&apos; al posto giusto quando entri la prima volta.
        </p>
        <ul>
          <li>Compila il modulo con i dati dell&apos;azienda</li>
          <li>Controlliamo la richiesta entro un giorno lavorativo</li>
          <li>Ricevi le credenziali via email</li>
          <li>Entri e inizi a lavorare</li>
        </ul>
      </div>

      <p style={{ fontSize: 12.5, color: "var(--sidebar-muted)" }}>
        © {new Date().getFullYear()} RescueManager · rescuemanager.eu
      </p>
    </aside>
  );
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefono: "",
    azienda: "",
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  // null = ancora da verificare, true/false = stato registrazioni globale
  const [regEnabled, setRegEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/registration-status", { cache: "no-store" })
      .then(r => r.json())
      .then(d => setRegEnabled(d?.enabled !== false))
      .catch(() => setRegEnabled(true)); // fail-open: il server riverifica
  }, []);

  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = safeRedirect(params.get("redirect"), "/login");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (regEnabled === false) {
      setError("Le registrazioni sono sospese. Scrivi a info@rescuemanager.eu per chiedere l'accesso.");
      return;
    }

    if (!acceptTerms) {
      setError("Per continuare devi accettare i termini d'uso e l'informativa privacy.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "access_request",
            source: "website_register",
            name: formData.nome,
            email: formData.email,
            phone: formData.telefono,
            company: formData.azienda,
            message: "Richiesta di creazione account / accesso a RescueManager.",
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Non è stato possibile inviare la richiesta. Riprova fra poco.");
          return;
        }

        setIsSubmitted(true);
      } catch {
        setError("Richiesta non inviata per un problema di collegamento. Riprova fra poco.");
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (isSubmitted) {
    return (
      <div className="rm-prod">
        <div className="rm-gate" >
          <Lato />
          <main className="rm-gate__corpo">
            <div className="rm-gate__modulo">
              <div>
                <h1>Richiesta ricevuta</h1>
                <p className="rm-muted" style={{ marginTop: 6 }}>
                  La richiesta è in lavorazione.
                </p>
              </div>
              <div className="rm-card">
                <p>
                  Controlliamo i dati e prepariamo l&apos;ambiente di lavoro. Le credenziali arrivano
                  all&apos;indirizzo <strong>{formData.email}</strong> appena l&apos;account è pronto,
                  di norma entro un giorno lavorativo.
                </p>
              </div>
              <Link href="/" className="rm-btn rm-btn--secondary rm-btn--full" style={COME_PULSANTE}>
                Torna al sito
              </Link>
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
            <div className="lg:hidden">
              <Link href="/" className="inline-flex" style={{ textDecoration: "none" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/logos/logo-principale-bianco.svg" alt="RescueManager" width={150} height={50} />
              </Link>
            </div>

            <div>
              <h1>Richiedi l&apos;accesso</h1>
              <p className="rm-muted" style={{ marginTop: 6 }}>
                Lasciaci i tuoi dati: prepariamo l&apos;ambiente di lavoro e ti mandiamo le credenziali.
              </p>
            </div>

            {error && (
              <div className="rm-note rm-note--errore" role="alert">{error}</div>
            )}

            {regEnabled === false && (
              <div className="rm-note rm-note--info">
                Le registrazioni sono sospese. Per chiedere l&apos;accesso scrivi a{" "}
                <strong>info@rescuemanager.eu</strong>.
              </div>
            )}

            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="rm-field">
                <label htmlFor="nome" className="rm-label">Nome e cognome</label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  className="rm-input"
                  value={formData.nome}
                  onChange={handleChange}
                  placeholder="Mario Rossi"
                  autoComplete="name"
                  required
                />
              </div>

              <div className="rm-field">
                <label htmlFor="email" className="rm-label">Email aziendale</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="rm-input"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="info@azienda.it"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="rm-field">
                <label htmlFor="telefono" className="rm-label">Telefono</label>
                <input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  className="rm-input"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="340 000 0000"
                  autoComplete="tel"
                  required
                />
              </div>

              <div className="rm-field">
                <label htmlFor="azienda" className="rm-label">Ragione sociale</label>
                <input
                  id="azienda"
                  name="azienda"
                  type="text"
                  className="rm-input"
                  value={formData.azienda}
                  onChange={handleChange}
                  placeholder="Autodemolizioni Rossi S.r.l."
                  autoComplete="organization"
                  required
                />
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="accept-terms"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  style={CHECKBOX}
                  required
                />
                <label htmlFor="accept-terms" className="rm-muted">
                  Accetto i{" "}
                  <Link href="/terms-of-use" target="_blank">termini d&apos;uso</Link>
                  {" "}e l&apos;<Link href="/privacy-policy" target="_blank">informativa privacy</Link>
                </label>
              </div>

              <button type="submit" className="rm-btn rm-btn--primary rm-btn--full" disabled={pending}>
                {pending ? "Invio in corso" : "Invia la richiesta"}
              </button>
            </form>

            <div className="rm-sep" style={{ margin: 0 }} />

            <p className="rm-muted">
              Hai già le credenziali?{" "}
              <Link href={`/login?redirect=${encodeURIComponent(redirectTo)}`}>Accedi</Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
