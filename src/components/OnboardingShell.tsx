// Cornice delle pagine pubbliche che il cliente apre dal link ricevuto per
// email: /configura, /pratica, /pratica/recupera, /activate.
//
// Barra sottile in alto col marchio a sinistra e il riferimento della pratica a
// destra, scheda al centro, piede con la ragione sociale e i due collegamenti.
// I colori e i pannelli arrivano da src/app/prodotto.css (classe `rm-prod`).
'use client';

import { useRef } from 'react';
import Link from 'next/link';

// Numero unico dell'assistenza: lo stesso del piede del sito e della pagina Contatti.
export const TELEFONO_ASSISTENZA = '+393921723028';

// Un pulsante che ha l'aspetto di un collegamento: nel foglio di stile non
// esiste una classe per questo.
export const COME_LINK: React.CSSProperties = {
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

export function OnboardingShell({
  riferimento,
  larghezza = 600,
  children,
}: {
  // Testo in alto a destra: "Pratica PR-2026-041", "Stato pratica", "Attivazione".
  riferimento?: string | null;
  // Larghezza massima della scheda: le pagine di stato sono strette, la
  // configurazione ha bisogno di piu' spazio per i campi affiancati.
  larghezza?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rm-prod" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{ background: 'var(--layer)', borderBottom: '1px solid var(--border)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            padding: '11px 24px',
          }}
        >
          <Link href="/" style={{ display: 'inline-flex', textDecoration: 'none' }} aria-label="RescueManager">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logos/logo-principale-bianco.svg" alt="RescueManager" width={150} height={29} />
          </Link>
          {riferimento ? <span className="rm-muted">{riferimento}</span> : null}
        </div>
      </header>

      <main style={{ flex: '1 1 auto', padding: '36px 20px 48px' }}>
        <div style={{ maxWidth: larghezza, margin: '0 auto' }}>{children}</div>
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '14px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <span className="rm-muted">RescueManager S.r.l., Gela</span>
          <Link href="/privacy-policy" style={{ fontSize: 12.5 }}>Privacy</Link>
          <Link href="/contatti" style={{ fontSize: 12.5 }}>Assistenza</Link>
        </div>
      </footer>
    </div>
  );
}

// ── Le quattro tappe ────────────────────────────────────────────────────────
// Sotto il nome della tappa c'e' una parola sola: "fatto" o "adesso".

export const TAPPE = ['Pagamento', 'Configurazione', 'Verifica', 'Attivazione'];

export function Tappe({ corrente, tutteFatte = false }: { corrente: number; tutteFatte?: boolean }) {
  return (
    <ol
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1,
        background: 'var(--border)',
        border: '1px solid var(--border)',
        listStyle: 'none',
        margin: 0,
        padding: 0,
      }}
    >
      {TAPPE.map((nome, i) => {
        const fatta = tutteFatte || i < corrente;
        const adesso = !tutteFatte && i === corrente;
        return (
          <li
            key={nome}
            aria-current={adesso ? 'step' : undefined}
            style={{
              background: adesso ? 'var(--selected)' : 'var(--layer)',
              borderTop: `2px solid ${fatta || adesso ? 'var(--brand)' : 'var(--border-strong)'}`,
              padding: '9px 12px 8px',
              // Quando lo schermo e' stretto le tappe vanno a capo a due a due.
              flex: '1 1 132px',
              minWidth: 0,
            }}
          >
            <span
              style={{
                display: 'block',
                fontSize: 13,
                overflowWrap: 'anywhere',
                fontWeight: 600,
                color: adesso ? 'var(--brand-text)' : 'var(--text)',
              }}
            >
              {i + 1}. {nome}
            </span>
            <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-secondary)' }}>
              {fatta ? 'fatto' : adesso ? 'adesso' : ' '}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// ── Riga di riepilogo: etichetta a sinistra, valore a destra ────────────────
// `rm-riga` mette il valore a sinistra e su schermo stretto lo manda a capo
// tenendolo incolonnato: il disegno lo vuole a destra, quindi la riga e' fatta
// a mano con le stesse misure (bordo, altezza, corpo del testo).

export function Riga({ etichetta, valore }: { etichetta: string; valore: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
        padding: '10px 0',
        borderBottom: '1px solid var(--border)',
        fontSize: 13.5,
      }}
    >
      <span style={{ color: 'var(--text-secondary)' }}>{etichetta}</span>
      <span>{valore}</span>
    </div>
  );
}

// ── Il codice ricevuto per email: sei caselle ──────────────────────────────
// Il valore resta una stringa sola di sei cifre, come prima: cambia solo il
// modo di scriverlo. Si puo' incollare il codice intero nella prima casella.

export function CasellePin({
  valore,
  onChange,
  onInvio,
  disabilitato = false,
}: {
  valore: string;
  onChange: (v: string) => void;
  onInvio?: () => void;
  disabilitato?: boolean;
}) {
  const caselle = useRef<Array<HTMLInputElement | null>>([]);
  // Chi scrive veloce (o incolla) batte sul tempo il ridisegno: questo e' il
  // valore aggiornato subito, senza aspettare il giro di React.
  const rif = useRef(valore);
  rif.current = valore;

  const vaiA = (i: number) => {
    const c = caselle.current[Math.min(Math.max(i, 0), 5)];
    if (c) { c.focus(); c.select(); }
  };

  const cambia = (nuovo: string) => {
    rif.current = nuovo;
    onChange(nuovo);
  };

  const scrivi = (i: number, testo: string) => {
    const cifre = testo.replace(/\D/g, '');
    if (!cifre) return;
    const nuovo = (rif.current.slice(0, i) + cifre).slice(0, 6);
    cambia(nuovo);
    vaiA(nuovo.length);
  };

  const tasto = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { onInvio?.(); return; }
    if (e.key === 'Backspace') {
      e.preventDefault();
      const taglia = rif.current[i] ? i : Math.max(0, i - 1);
      cambia(rif.current.slice(0, taglia));
      vaiA(taglia);
      return;
    }
    if (e.key === 'ArrowLeft') { e.preventDefault(); vaiA(i - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); vaiA(i + 1); }
  };

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => { caselle.current[i] = el; }}
          className="rm-input"
          style={{ width: 48, textAlign: 'center', fontSize: 18, padding: 0 }}
          value={valore[i] || ''}
          onChange={(e) => scrivi(i, e.target.value)}
          onKeyDown={(e) => tasto(i, e)}
          onFocus={() => { if (i > rif.current.length) vaiA(rif.current.length); }}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Cifra ${i + 1} di 6`}
          disabled={disabilitato}
        />
      ))}
    </div>
  );
}

// ── Icone: piccole, dentro i pulsanti ──────────────────────────────────────

export function IconaFreccia() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function IconaTelefono() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export function IconaAggiorna() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

export function IconaEsterno() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 3h6v6M10 14 21 3M19 13v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h7" />
    </svg>
  );
}

// Pulsante "Parla con noi": sta in fondo a tutte le pagine di stato.
export function ParlaConNoi() {
  return (
    <a href={`tel:${TELEFONO_ASSISTENZA}`} className="rm-btn rm-btn--tertiary">
      Parla con noi <IconaTelefono />
    </a>
  );
}
