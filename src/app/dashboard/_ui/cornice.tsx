"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

/**
 * Pezzi ricorrenti dell'area personale, presi dal disegno del titolare.
 *
 * Le classi vengono da `prodotto.css` (rm-card, rm-riga, rm-tab, rm-griglia,
 * rm-barra, rm-stato...). Qui sta solo il layout che il foglio non copre:
 * la testata di pagina, la fascia scura delle pagine di secondo livello, la
 * sezione con la barretta blu e la striscia di intestazione delle tabelle.
 */

/* ── Misure della cornice ──────────────────────────────────────────────── */

/** Spazio laterale del contenuto: lo stesso che il disegno tiene ovunque. */
export const LATO = 24;

/* ── Testate ───────────────────────────────────────────────────────────── */

export function Testata({
  titolo,
  coda,
  sotto,
  azioni,
}: Readonly<{
  titolo: string;
  /** Numero o parola accanto al titolo, in tono minore (es. "3"). */
  coda?: ReactNode;
  sotto?: ReactNode;
  azioni?: ReactNode;
}>) {
  return (
    <div style={{ padding: `26px ${LATO}px 0` }}>
      <div className="rm-area__intesta" style={{ marginBottom: 18 }}>
        <div style={{ minWidth: 0 }}>
          {/* prodotto.css tiene h1 a 26px: il disegno lo vuole piu' grande. */}
          <h1 style={{ fontSize: 30 }}>
            {titolo}
            {coda != null && (
              <span style={{ fontWeight: 400, color: "var(--text-secondary)" }}> {coda}</span>
            )}
          </h1>
          {sotto && (
            <p className="rm-muted" style={{ marginTop: 4 }}>
              {sotto}
            </p>
          )}
        </div>
        {azioni && <div className="flex flex-wrap items-center gap-1">{azioni}</div>}
      </div>
    </div>
  );
}

export function TestataAzione({
  indietro,
  occhiello,
  titolo,
  sotto,
  azioni,
}: Readonly<{
  /** Percorso della pagina da cui si arriva: la freccia a sinistra. */
  indietro: string;
  occhiello?: string;
  titolo: string;
  sotto?: ReactNode;
  azioni?: ReactNode;
}>) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
        background: "var(--layer)",
        borderBottom: "1px solid var(--border)",
        padding: `14px ${LATO}px`,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, minWidth: 0 }}>
        <Link
          href={indietro}
          aria-label="Torna indietro"
          style={{
            display: "inline-flex",
            alignItems: "center",
            marginTop: 16,
            color: "var(--text-secondary)",
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={18} />
        </Link>
        <div style={{ minWidth: 0 }}>
          {occhiello && (
            <p className="rm-muted" style={{ fontSize: 12 }}>
              {occhiello}
            </p>
          )}
          <h1 style={{ fontSize: 22, marginTop: 2 }}>{titolo}</h1>
          {sotto && (
            <p className="rm-muted" style={{ marginTop: 4 }}>
              {sotto}
            </p>
          )}
        </div>
      </div>
      {azioni && <div className="flex flex-wrap items-center gap-1">{azioni}</div>}
    </div>
  );
}

/** Corpo della pagina: lo spazio attorno al contenuto. */
export function Contenuto({ children }: Readonly<{ children: ReactNode }>) {
  return <div style={{ padding: `20px ${LATO}px 56px` }}>{children}</div>;
}

/* ── Sezione con la barretta blu a sinistra del titolo ──────────────────── */

export function Sezione({
  titolo,
  coda,
  children,
}: Readonly<{ titolo: string; coda?: ReactNode; children: ReactNode }>) {
  return (
    <section className="rm-card" style={{ padding: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "11px 16px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <h2 style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15 }}>
          <span aria-hidden style={{ width: 3, height: 14, background: "var(--brand)" }} />
          {titolo}
        </h2>
        {coda}
      </div>
      {children}
    </section>
  );
}

/* ── Riquadro con il numero grande ─────────────────────────────────────── */

export function Dato({
  etichetta,
  valore,
  nota,
  allarme,
}: Readonly<{ etichetta: string; valore: ReactNode; nota?: ReactNode; allarme?: boolean }>) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600 }}>{etichetta}</div>
      <p className="rm-dato" style={allarme ? { color: "var(--danger)" } : undefined}>
        {valore}
      </p>
      {nota && <p className="rm-muted">{nota}</p>}
    </div>
  );
}

/* ── Riga etichetta e valore ───────────────────────────────────────────── */

export function Riga({
  etichetta,
  valore,
  mono,
}: Readonly<{ etichetta: ReactNode; valore: ReactNode; mono?: boolean }>) {
  return (
    <div className="rm-riga">
      <span>{etichetta}</span>
      <span className={mono ? "rm-mono" : undefined} style={{ textAlign: "right" }}>
        {valore}
      </span>
    </div>
  );
}

/* ── Barra di consumo: blu, rossa solo quando si sfora ──────────────────── */

export function Consumo({
  etichetta,
  valore,
  percentuale,
  nota,
}: Readonly<{ etichetta: string; valore: ReactNode; percentuale: number | null; nota?: ReactNode }>) {
  const sforato = percentuale != null && percentuale >= 100;
  return (
    <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13.5 }}>
        <span>{etichetta}</span>
        <span className={sforato ? "rm-stato rm-stato--male" : undefined}>{valore}</span>
      </div>
      {percentuale != null && (
        <div className="rm-barra" style={{ marginTop: 8 }}>
          <span
            style={{
              width: `${Math.min(100, Math.max(0, percentuale))}%`,
              background: sforato ? "var(--danger)" : "var(--brand)",
            }}
          />
        </div>
      )}
      {nota && (
        <p className="rm-muted" style={{ marginTop: 6 }}>
          {nota}
        </p>
      )}
    </div>
  );
}

/* ── Tabelle: la striscia di intestazione del disegno ──────────────────── */

/** Da mettere su ogni `th`: prodotto.css non prevede la striscia piu' chiara. */
export const TH: CSSProperties = {
  background: "var(--layer-3)",
  color: "var(--text)",
  padding: "9px 12px",
  fontWeight: 600,
};

/** Da mettere su ogni `td`: allinea le celle all'intestazione. */
export const TD: CSSProperties = { padding: "11px 12px" };

/* ── Due colonne: contenuto principale a sinistra, riquadri a destra ───── */

export function DueColonne({
  principale,
  laterale,
}: Readonly<{ principale: ReactNode; laterale: ReactNode }>) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div style={{ minWidth: 0 }}>{principale}</div>
      <div style={{ minWidth: 0 }}>{laterale}</div>
    </div>
  );
}

/* ── Piede dei moduli: obbligatori a sinistra, azioni a destra ─────────── */

export function PiedeModulo({
  note,
  azioni,
}: Readonly<{ note?: ReactNode; azioni: ReactNode }>) {
  return (
    <div
      className="rm-card"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
        padding: "12px 16px",
      }}
    >
      <p className="rm-muted">{note}</p>
      <div className="flex flex-wrap items-center gap-1">{azioni}</div>
    </div>
  );
}
