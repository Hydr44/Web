// Template email RescueManager, versione allineata al design system (stesso modello di
// desktop-design/email/email-template.js, portato in TypeScript per il sito).
//
// Regole: testata e pie' di pagina nei blu della barra laterale, corpo chiaro perche' le email
// si leggono su Gmail e Outlook; un solo blu #005DFA per pulsanti e link, niente angoli
// arrotondati, niente maiuscolo spaziato, niente trattini o pallini tra le informazioni,
// una riga una informazione. Solo tabelle e stili in linea: e' quello che i client di posta capiscono.
//
// Modulo CONDIVISO: usalo per TUTTE le email del sito cosi' sono coerenti.

export const EMAIL_FONT = "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,sans-serif";
export const BRAND = '#005dfa';
export const INK = '#161616';
export const INK_2 = '#525252';
export const INK_3 = '#8d8d8d';
export const LINE = '#e0e0e0';
export const PAPER = '#ffffff';
export const CANVAS = '#f4f4f4';
export const LOGO_URL = 'https://rescuemanager.eu/assets/logos/logo-principale-bianco.png';
// Testata e pie' di pagina scuri: HEAD_BG e' il blu della barra laterale dell'app, FOOT_BG il suo tono di testa e piede.
export const HEAD_BG = '#0b3fb5';
export const HEAD_TEXT = '#dbe6ff';
export const FOOT_BG = '#062a7a';
export const FOOT_TEXT = '#a9c2ff';

/* ─────────── Compatibilita' ───────────
   Nomi del vecchio template, tenuti perche' usati altrove (moduli, pagine, codice piu' vecchio).
   Non usarli in codice nuovo: sono alias sul modello nuovo. */
/** @deprecated tenuto per compatibilita': usa BRAND. */
export const BRAND_BLUE = BRAND;
/** @deprecated tenuto per compatibilita': era il navy #0f172a, oggi e' il nero del testo. */
export const BRAND_DARK = INK;

/** Un paragrafo del corpo. */
const p = (t: string, size = 15, color: string = INK, extra = ''): string =>
  `<p style="margin:0 0 14px;font-family:${EMAIL_FONT};font-size:${size}px;line-height:1.6;color:${color};${extra}">${t}</p>`;

// Testata: logo bianco sul blu della barra laterale. Se l'email parte per conto di un'azienda
// cliente, a destra si legge "per conto di <azienda>", cosi' chi riceve capisce subito chi scrive.
export function emailHeader(sender?: string): string {
  const perConto = sender
    ? `<td align="right" style="font-family:${EMAIL_FONT};font-size:13px;color:${HEAD_TEXT};">per conto di ${sender}</td>`
    : '';
  return `<tr><td style="padding:22px 40px;background:${HEAD_BG};"><table cellpadding="0" cellspacing="0" width="100%"><tr>
<td><img src="${LOGO_URL}" alt="RescueManager" height="26" style="height:26px;width:auto;display:block;border:0;" /></td>
${perConto}
</tr></table></td></tr>`;
}

// Titolo e riga di contesto: il titolo dice cosa e' successo, la riga sotto a chi o quando.
export function emailTitle(title: string, sub?: string): string {
  return `<h1 style="margin:0 0 ${sub ? '4' : '20'}px;font-family:${EMAIL_FONT};font-size:22px;line-height:1.25;font-weight:600;letter-spacing:-0.01em;color:${INK};">${title}</h1>${sub ? `<p style="margin:0 0 20px;font-family:${EMAIL_FONT};font-size:14px;color:${INK_2};">${sub}</p>` : ''}`;
}

// Pulsante: uno solo per email, pieno, squadrato, testo normale con l'iniziale maiuscola.
export function emailCtaButton(href: string, label: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:8px 0 24px;"><tr><td style="background:${BRAND};"><a href="${href}" style="display:block;padding:13px 28px;font-family:${EMAIL_FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${label}</a></td></tr></table>
<p style="margin:0 0 24px;font-family:${EMAIL_FONT};font-size:12px;line-height:1.6;color:${INK_3};">Se il pulsante non funziona, apri questo indirizzo: <a href="${href}" style="color:${BRAND};text-decoration:none;">${href}</a></p>`;
}

// Codice: grande, monospazio, in un riquadro con la barretta a sinistra. Nessuna etichetta in maiuscolo.
export function emailCodeBox(code: string, note = 'Vale per 10 minuti'): string {
  return `<table cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 24px;background:${CANVAS};border-left:3px solid ${BRAND};"><tr><td style="padding:18px 24px;">
<p style="margin:0 0 4px;font-family:${EMAIL_FONT};font-size:13px;color:${INK_2};">Codice</p>
<p style="margin:0;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:30px;font-weight:600;letter-spacing:0.18em;color:${INK};">${code}</p>
<p style="margin:6px 0 0;font-family:${EMAIL_FONT};font-size:12px;color:${INK_3};">${note}</p>
</td></tr></table>`;
}

/** Una coppia etichetta/valore. */
export type EmailRow = [label: string, value: string];

// Righe etichetta e valore: come le schede dell'app, etichetta a sinistra, un dato per riga.
export function emailInfoRows(rows: EmailRow[]): string {
  return `<table cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 24px;border-top:1px solid ${LINE};">${rows.map(([l, v]) => `<tr>
<td style="padding:9px 0;border-bottom:1px solid ${LINE};font-family:${EMAIL_FONT};font-size:13px;color:${INK_2};width:150px;vertical-align:top;">${l}</td>
<td style="padding:9px 0;border-bottom:1px solid ${LINE};font-family:${EMAIL_FONT};font-size:13px;color:${INK};vertical-align:top;">${v}</td></tr>`).join('')}</table>`;
}

/**
 * @deprecated tenuto per compatibilita': e' la singola riga (un `<tr>`) del vecchio template.
 * Va usata dentro una `<table>` che la contiene; nel codice nuovo usa `emailInfoRows`.
 */
export function emailInfoRow(label: string, value: string): string {
  return `<tr>
<td style="padding:9px 0;border-bottom:1px solid ${LINE};font-family:${EMAIL_FONT};font-size:13px;color:${INK_2};width:150px;vertical-align:top;">${label}</td>
<td style="padding:9px 0;border-bottom:1px solid ${LINE};font-family:${EMAIL_FONT};font-size:13px;color:${INK};vertical-align:top;">${value}</td>
</tr>`;
}

// Totale in evidenza (fatture, preventivi): etichetta sopra, cifra sotto in grande.
export function emailAmount(label: string, value: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr><td style="padding:12px 16px;background:${CANVAS};">
<p style="margin:0;font-family:${EMAIL_FONT};font-size:12px;color:${INK_2};">${label}</p>
<p style="margin:2px 0 0;font-family:${EMAIL_FONT};font-size:26px;font-weight:600;letter-spacing:-0.01em;color:${INK};">${value}</p>
</td></tr></table>`;
}

// Avviso: una riga con la barretta, senza colori di allarme salvo il rosso per le scadenze passate.
export function emailNotice(text: string, level: 'info' | 'danger' = 'info'): string {
  const col = level === 'danger' ? '#da1e28' : BRAND;
  return `<table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px;"><tr><td style="padding:10px 14px;background:${CANVAS};border-left:3px solid ${col};font-family:${EMAIL_FONT};font-size:13px;line-height:1.5;color:${INK};">${text}</td></tr></table>`;
}

// Pie' di pagina: chi manda, perche' la ricevi, come rispondere. Niente slogan.
// Se l'email parte per conto di un'azienda cliente, lo dice a chiare lettere prima del motivo.
export function emailFooter(
  reason = 'Ricevi questa email perché hai un account RescueManager.',
  sender?: string,
): string {
  // Niente doppio punto quando il nome dell'azienda finisce già con un punto (S.r.l.).
  const fine = sender?.trim().endsWith('.') ? '' : '.';
  const perConto = sender
    ? `<p style="margin:0 0 4px;font-family:${EMAIL_FONT};font-size:12px;line-height:1.6;color:${FOOT_TEXT};">Questa email è inviata da RescueManager per conto di ${sender}${fine}</p>`
    : '';
  return `<tr><td style="padding:20px 40px 24px;background:${FOOT_BG};">
<p style="margin:0 0 4px;font-family:${EMAIL_FONT};font-size:12px;line-height:1.6;color:#ffffff;">RescueManager S.r.l., Gela</p>
${perConto}
<p style="margin:0 0 4px;font-family:${EMAIL_FONT};font-size:12px;line-height:1.6;color:${FOOT_TEXT};">${reason}</p>
<p style="margin:0;font-family:${EMAIL_FONT};font-size:12px;line-height:1.6;color:${FOOT_TEXT};">Per aiuto scrivi a <a href="mailto:info@rescuemanager.eu" style="color:#ffffff;text-decoration:none;">info@rescuemanager.eu</a></p>
</td></tr>`;
}

export function emailWrapper(content: string, preheader = ''): string {
  return `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta name="color-scheme" content="light"><title>RescueManager</title></head>
<body style="margin:0;padding:0;background:${CANVAS};font-family:${EMAIL_FONT};">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:${CANVAS};">${preheader}</div>` : ''}
<table width="100%" cellpadding="0" cellspacing="0" style="background:${CANVAS};padding:32px 16px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:${PAPER};border:1px solid ${LINE};">${content}</table>
</td></tr></table></body></html>`;
}

export type BrandedEmailOpts = {
  /** Chi manda, quando non e' RescueManager stessa (es. l'azienda che fattura al suo cliente). */
  sender?: string;
  /** Titolo: cosa e' successo. */
  title?: string;
  /** Riga sotto il titolo: a chi, quando. */
  sub?: string;
  /** Codice di accesso o verifica. */
  code?: string;
  /** Riga piccola sotto il codice (default: "Vale per 10 minuti"). */
  codeNote?: string;
  /** Righe etichetta e valore, una informazione per riga. */
  rows?: EmailRow[];
  /** Totale in evidenza (fatture, preventivi). */
  amount?: { label: string; value: string };
  /** Avviso con la barretta a sinistra. */
  notice?: { text: string; level?: 'info' | 'danger' };
  /** Un solo pulsante per email. */
  cta?: { href: string; label: string };
  /** Testo piccolo dopo il pulsante. */
  note?: string;
  /** Riga "perche' ricevi questa email" nel pie' di pagina. */
  reason?: string;
  /** Anteprima nella casella di posta (default: il titolo). */
  preheader?: string;

  /* ── Compatibilita': opzioni del vecchio template ── */
  /** @deprecated tenuto per compatibilita': diventa il titolo se `title` non c'e'. */
  subtitle?: string;
  /** @deprecated tenuto per compatibilita': usa `rows`. */
  infoRows?: Array<{ label: string; value: string }>;
  /** @deprecated tenuto per compatibilita': usa `note`. */
  footerNote?: string;
  /**
   * Blocco HTML libero, inserito dopo i paragrafi e prima del pulsante.
   * Serve solo per i blocchi che il modello non ha (per esempio le sezioni della newsletter):
   * anche qui valgono le regole, solo tabelle e stili in linea.
   */
  extraHtml?: string;
};

/**
 * Costruisce l'email intera. `body`: una riga, un paragrafo.
 * Ordine dei blocchi: titolo, corpo, avviso, totale, codice, righe, pulsante, nota.
 */
export function brandedHtml(body: string, o: BrandedEmailOpts = {}): string {
  const paragraphs = String(body ?? '')
    .split('\n')
    .map((line) => (line.trim() ? p(line) : ''))
    .join('');

  const title = o.title || o.subtitle;
  // `infoRows` (vecchio formato) accettato come alias di `rows`.
  const rows: EmailRow[] | undefined =
    o.rows || (o.infoRows?.length ? o.infoRows.map((r) => [r.label, r.value] as EmailRow) : undefined);
  const note = o.note || o.footerNote;

  const content = `${emailHeader(o.sender)}<tr><td style="padding:32px 40px 8px;">
${title ? emailTitle(title, o.sub) : ''}${paragraphs}
${o.notice ? emailNotice(o.notice.text, o.notice.level) : ''}
${o.amount ? emailAmount(o.amount.label, o.amount.value) : ''}
${o.code ? emailCodeBox(o.code, o.codeNote) : ''}
${rows?.length ? emailInfoRows(rows) : ''}
${o.extraHtml || ''}
${o.cta ? emailCtaButton(o.cta.href, o.cta.label) : ''}
${note ? p(note, 13, INK_2) : ''}
</td></tr>${emailFooter(o.reason, o.sender)}`;

  return emailWrapper(content, o.preheader || title || '');
}
