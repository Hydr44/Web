"use client";

/**
 * Errore di una pagina dell'area cliente.
 *
 * Resta dentro la cornice del portale (il layout non viene smontato), quindi
 * usa le classi di `prodotto.css`. Il rosso serve solo a dire che qualcosa
 * non ha funzionato.
 */
export default function ErrorePagina({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset?: () => void;
}>) {
  return (
    <div style={{ maxWidth: 640 }}>
      <div className="rm-area__intesta">
        <h1>La pagina non si e&apos; aperta</h1>
      </div>
      <section className="rm-card">
        <div className="rm-note rm-note--errore">{error.message || "Errore non identificato"}</div>
        <p className="rm-muted" style={{ marginTop: 12 }}>
          Se l&apos;errore si ripete, scrivilo all&apos;assistenza indicando questa pagina.
        </p>
        {error.digest && (
          <p className="rm-muted rm-mono" style={{ marginTop: 6 }}>Riferimento {error.digest}</p>
        )}
        {reset && (
          <div style={{ marginTop: 16 }}>
            <button type="button" onClick={() => reset()} className="rm-btn rm-btn--secondary">
              Riprova
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
