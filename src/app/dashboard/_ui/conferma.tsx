"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Le domande importanti si fanno in una finestra del sito, mai con il
 * `confirm()` del browser: quello cambia faccia a ogni browser, non si puo'
 * scrivere in italiano decente ne' spiegare la conseguenza, e non sa aspettare.
 *
 * Due modi d'uso.
 *
 * 1. `Conferma` da sola, quando chi chiama vuole tenere la finestra aperta
 *    mentre l'azione va avanti (e' il caso dell'uscita: "Disconnessione in
 *    corso" con i pulsanti spenti).
 *
 * 2. `useConferma`, quando basta una domanda secca prima di partire:
 *
 *      const { chiedi, dialogo } = useConferma();
 *      if (!(await chiedi({ titolo: '...', testo: '...', conferma: 'Disattiva' }))) return;
 *      ...
 *      return (<>{ ... }{dialogo}</>);
 */

type PropsConferma = Readonly<{
  aperta: boolean;
  titolo: string;
  testo?: React.ReactNode;
  conferma?: string;
  annulla?: string;
  /** Azione che non si torna indietro: il pulsante diventa rosso a bordo. */
  pericolo?: boolean;
  /** Mentre e' vero la finestra non si chiude e i pulsanti sono spenti. */
  occupato?: boolean;
  onAnnulla: () => void;
  onConferma: () => void;
}>;

export function Conferma({
  aperta,
  titolo,
  testo,
  conferma = "Conferma",
  annulla = "Annulla",
  pericolo,
  occupato,
  onAnnulla,
  onConferma,
}: PropsConferma) {
  const primo = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!aperta) return;
    primo.current?.focus();
    const tasto = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !occupato) onAnnulla();
    };
    document.addEventListener("keydown", tasto);
    return () => document.removeEventListener("keydown", tasto);
  }, [aperta, occupato, onAnnulla]);

  if (!aperta) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(3, 7, 14, .72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onMouseDown={(e) => {
        // Il velo chiude solo se l'azione non e' gia' partita.
        if (e.target === e.currentTarget && !occupato) onAnnulla();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="conferma-titolo"
        className="rm-card"
        style={{ width: "100%", maxWidth: 420, padding: 0 }}
      >
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <h2 id="conferma-titolo" style={{ fontSize: 16 }}>{titolo}</h2>
        </div>

        {testo && <div style={{ padding: "16px 20px" }}><p>{testo}</p></div>}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 1,
            padding: "12px 20px",
            borderTop: "1px solid var(--border)",
          }}
        >
          <button
            ref={primo}
            type="button"
            onClick={onAnnulla}
            disabled={occupato}
            className="rm-btn rm-btn--secondary"
          >
            <span>{annulla}</span>
          </button>
          <button
            type="button"
            onClick={onConferma}
            disabled={occupato}
            className={pericolo ? "rm-btn rm-btn--danger" : "rm-btn rm-btn--primary"}
          >
            <span>{conferma}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

type Domanda = Omit<PropsConferma, "aperta" | "onAnnulla" | "onConferma" | "occupato">;

export function useConferma() {
  const [domanda, setDomanda] = useState<(Domanda & { risolvi: (ok: boolean) => void }) | null>(null);

  const chiedi = useCallback(
    (d: Domanda) => new Promise<boolean>((risolvi) => setDomanda({ ...d, risolvi })),
    [],
  );

  const chiudi = useCallback((ok: boolean) => {
    setDomanda((prec) => {
      prec?.risolvi(ok);
      return null;
    });
  }, []);

  const dialogo = (
    <Conferma
      aperta={!!domanda}
      titolo={domanda?.titolo || ""}
      testo={domanda?.testo}
      conferma={domanda?.conferma}
      annulla={domanda?.annulla}
      pericolo={domanda?.pericolo}
      onAnnulla={() => chiudi(false)}
      onConferma={() => chiudi(true)}
    />
  );

  return { chiedi, dialogo };
}

export default Conferma;
