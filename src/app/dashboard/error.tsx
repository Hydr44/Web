"use client";

import { Contenuto, Testata } from "./_ui/cornice";

/**
 * Errore di una pagina dell'area personale.
 *
 * Resta dentro la cornice (il layout non viene smontato), quindi usa le classi
 * di `prodotto.css`. Il rosso serve solo a dire che qualcosa non ha funzionato.
 */
export default function ErrorePagina({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset?: () => void;
}>) {
  return (
    <>
      <Testata titolo="La pagina non si e' aperta" />
      <Contenuto>
        <section className="rm-card" style={{ maxWidth: 640 }}>
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
                <span>Riprova</span>
              </button>
            </div>
          )}
        </section>
      </Contenuto>
    </>
  );
}
