/**
 * GET /api/staff/admin/clients/:id/integrations
 * Stato delle integrazioni fiscali/ambientali di una singola org (cliente):
 * SDI (fatturazione elettronica), RENTRI (rifiuti) e RVFU/ACI (veicoli fuori uso).
 *
 * Sola lettura, best-effort: se una sorgente non risponde o non ha dati la
 * relativa integrazione torna con status 'neutral' e una nota esplicativa,
 * senza mai far fallire l'intera risposta.
 *
 * L'autenticazione staff è già garantita dal middleware.
 */
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders, handleCors } from '@/lib/cors';

type Status = 'ok' | 'warn' | 'ko' | 'neutral';

// Codice destinatario dell'ambiente di TEST SDI (non è produzione reale)
const SDI_TEST_CODICE = 'GCUCU73';

// --- tipi righe DB (solo i campi che leggiamo) ---
interface InvoiceRow {
  direction: string | null;
  sdi_status: string | null;
  meta: Record<string, unknown> | null;
}
interface CertRow {
  tipo_certificato: string | null;
  expires_at: string | null;
  is_active: boolean | null;
}
interface SettingRow {
  key: string;
  value: Record<string, unknown> | null;
  rentri_environment: string | null;
}
interface TrasmissioneRow {
  stato: string | null;
  completed_at: string | null;
}
interface SyncRow {
  success: boolean | null;
  synced_at: string | null;
}

interface CertStato {
  stato: Status;
  scade: string | null;
}
interface UltimaTrasmissione {
  stato: string;
  quando: string | null;
}

export async function OPTIONS(request: Request) {
  return handleCors(request) as NextResponse;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  const orgId = params.id;

  try {
    // Carico in parallelo tutte le sorgenti; ogni ramo è best-effort.
    const [
      invoicesRes,
      settingsRes,
      certsRes,
      trasmissioniRes,
      syncRes,
    ] = await Promise.all([
      supabaseAdmin
        .from('invoices')
        .select('direction, sdi_status, meta')
        .eq('org_id', orgId),
      supabaseAdmin
        .from('org_settings')
        .select('key, value, rentri_environment')
        .eq('org_id', orgId),
      supabaseAdmin
        .from('rentri_org_certificates')
        .select('tipo_certificato, expires_at, is_active')
        .eq('org_id', orgId)
        .eq('is_active', true),
      supabaseAdmin
        .from('rentri_trasmissioni')
        .select('stato, completed_at')
        .eq('org_id', orgId)
        .order('completed_at', { ascending: false, nullsFirst: false })
        .limit(1),
      supabaseAdmin
        .from('rentri_sync_log')
        .select('success, synced_at')
        .eq('org_id', orgId)
        .order('synced_at', { ascending: false, nullsFirst: false })
        .limit(1),
    ]);

    const invoices = (invoicesRes.data ?? []) as InvoiceRow[];
    const settings = (settingsRes.data ?? []) as SettingRow[];
    const certs = (certsRes.data ?? []) as CertRow[];
    const trasmissioni = (trasmissioniRes.data ?? []) as TrasmissioneRow[];
    const syncLog = (syncRes.data ?? []) as SyncRow[];

    const integrations = {
      sdi: buildSdi(invoices, settings),
      rentri: buildRentri(settings, certs, trasmissioni, syncLog),
      rvfu: buildRvfu(settings),
    };

    return NextResponse.json({ success: true, integrations }, { status: 200, headers });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Errore interno del server' },
      { status: 500, headers }
    );
  }
}

// ---------------------------------------------------------------------------
// SDI
// ---------------------------------------------------------------------------
function buildSdi(invoices: InvoiceRow[], settings: SettingRow[]) {
  const sdiCfg = settings.find((s) => s.key === 'sdi')?.value ?? null;
  const codiceDestinatario =
    typeof sdiCfg?.codice_destinatario === 'string'
      ? (sdiCfg.codice_destinatario as string)
      : null;

  let delivered = 0; // consegnate / decorrenza termini → ok
  let inVolo = 0; // inviate ma non ancora consegnate → in attesa
  let rejected = 0; // scartate / non consegnate → richiedono azione
  let bozze = 0; // draft
  let passiveDaScaricare = 0; // passive ricevute con XML da scaricare

  for (const inv of invoices) {
    const stato = (inv.sdi_status ?? '').toLowerCase();
    const dir = (inv.direction ?? 'active').toLowerCase();

    if (dir === 'passive') {
      if (stato === 'received' && hasSdiXml(inv.meta)) passiveDaScaricare += 1;
      continue;
    }

    // direction 'active' (default)
    switch (stato) {
      case 'delivered':
      case 'term_expired':
        delivered += 1;
        break;
      case 'sent':
      case 'transmitted':
      case 'validated':
        inVolo += 1;
        break;
      case 'rejected':
      case 'not_delivered':
        rejected += 1;
        break;
      case 'draft':
        bozze += 1;
        break;
      default:
        break;
    }
  }

  const hasTraffic =
    delivered + inVolo + rejected + bozze + passiveDaScaricare > 0;

  let status: Status;
  const notes: string[] = [];

  if (!hasTraffic) {
    status = 'neutral';
    notes.push('Nessun traffico SDI');
  } else if (rejected > 0 || passiveDaScaricare > 0) {
    status = 'ko';
    if (rejected > 0)
      notes.push(
        `${rejected} fattur${rejected === 1 ? 'a scartata/non consegnata' : 'e scartate/non consegnate'}`
      );
    if (passiveDaScaricare > 0)
      notes.push(
        `${passiveDaScaricare} fattur${passiveDaScaricare === 1 ? 'a passiva' : 'e passive'} da scaricare`
      );
  } else if (inVolo > 0) {
    status = 'warn';
    notes.push(`${inVolo} in attesa di consegna`);
  } else {
    status = 'ok';
  }

  if (codiceDestinatario === SDI_TEST_CODICE) {
    notes.push('Ambiente di test (codice GCUCU73)');
  }
  if (!codiceDestinatario) {
    notes.push('Codice destinatario non configurato');
  }

  return {
    status,
    delivered,
    in_volo: inVolo,
    rejected,
    bozze,
    passive_da_scaricare: passiveDaScaricare,
    codice_destinatario: codiceDestinatario,
    note: notes.length ? notes.join(' · ') : null,
  };
}

function hasSdiXml(meta: Record<string, unknown> | null): boolean {
  if (!meta || typeof meta !== 'object') return false;
  if ('sdi_xml' in meta && meta.sdi_xml != null) return true;
  const ricevuta = meta.sdi_ricevuta;
  if (
    ricevuta &&
    typeof ricevuta === 'object' &&
    'xml' in (ricevuta as Record<string, unknown>) &&
    (ricevuta as Record<string, unknown>).xml != null
  ) {
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// RENTRI
// ---------------------------------------------------------------------------
function buildRentri(
  settings: SettingRow[],
  certs: CertRow[],
  trasmissioni: TrasmissioneRow[],
  syncLog: SyncRow[]
) {
  // Ambiente: prima valore non nullo di org_settings.rentri_environment, default 'demo'
  const environment =
    settings.find(
      (s) => typeof s.rentri_environment === 'string' && s.rentri_environment
    )?.rentri_environment ?? 'demo';

  const interop = certStato(pickCert(certs, 'interoperabilita'));
  const firma = certStato(pickCert(certs, 'firma_remota'));

  const ultimaTrasmissione = buildUltimaTrasmissione(trasmissioni, syncLog);

  // Stato complessivo: servono ENTRAMBI i certificati validi.
  let status: Status;
  const notes: string[] = [];

  if (certs.length === 0) {
    status = 'neutral';
    notes.push('RENTRI non configurato');
  } else {
    const stati = [interop.stato, firma.stato];
    if (interop.stato === 'neutral')
      notes.push('Certificato interoperabilità mancante');
    if (firma.stato === 'neutral')
      notes.push('Certificato firma remota mancante');
    if (stati.includes('ko') || stati.includes('neutral')) {
      status = 'ko';
      if (interop.stato === 'ko') notes.push('Certificato interoperabilità scaduto');
      if (firma.stato === 'ko') notes.push('Certificato firma remota scaduto');
    } else if (stati.includes('warn')) {
      status = 'warn';
      notes.push('Certificato in scadenza');
    } else {
      status = 'ok';
    }
  }

  return {
    status,
    interop,
    firma,
    environment,
    ultima_trasmissione: ultimaTrasmissione,
    note: notes.length ? notes.join(' · ') : null,
  };
}

function pickCert(certs: CertRow[], tipo: string): CertRow | null {
  // Tra i certificati attivi del tipo richiesto scelgo quello con scadenza più lontana.
  const matching = certs.filter((c) => c.tipo_certificato === tipo);
  if (matching.length === 0) return null;
  return matching.reduce((best, cur) => {
    const b = best.expires_at ? Date.parse(best.expires_at) : -Infinity;
    const c = cur.expires_at ? Date.parse(cur.expires_at) : -Infinity;
    return c > b ? cur : best;
  });
}

function certStato(cert: CertRow | null): CertStato {
  if (!cert) return { stato: 'neutral', scade: null };
  const scade = cert.expires_at;
  if (!scade) return { stato: 'ok', scade: null };
  const expMs = Date.parse(scade);
  if (Number.isNaN(expMs)) return { stato: 'ok', scade };
  const now = Date.now();
  const giorni = (expMs - now) / (1000 * 60 * 60 * 24);
  let stato: Status;
  if (giorni < 0) stato = 'ko';
  else if (giorni < 30) stato = 'warn';
  else stato = 'ok';
  return { stato, scade };
}

function buildUltimaTrasmissione(
  trasmissioni: TrasmissioneRow[],
  syncLog: SyncRow[]
): UltimaTrasmissione {
  const t = trasmissioni[0];
  if (t) {
    return { stato: t.stato ?? 'sconosciuto', quando: t.completed_at };
  }
  const s = syncLog[0];
  if (s) {
    return {
      stato: s.success ? 'sincronizzazione ok' : 'sincronizzazione con errori',
      quando: s.synced_at,
    };
  }
  return { stato: 'nessuna', quando: null };
}

// ---------------------------------------------------------------------------
// RVFU / ACI
// ---------------------------------------------------------------------------
function buildRvfu(settings: SettingRow[]) {
  const cfg = settings.find((s) => s.key === 'rvfu_auth')?.value ?? null;
  const username =
    typeof cfg?.username === 'string' ? (cfg.username as string) : null;
  const environment =
    typeof cfg?.environment === 'string' ? (cfg.environment as string) : null;
  const configurato = Boolean(username);

  let status: Status;
  let note: string;

  if (!configurato) {
    status = 'neutral';
    note = 'RVFU/ACI non configurato';
  } else {
    // I token OAuth ACI sono effimeri e non persistiti: possiamo confermare
    // solo che le credenziali sono impostate e su quale ambiente, non se il
    // token è attualmente valido.
    status = 'ok';
    const ambienteLabel =
      environment === 'production'
        ? 'produzione'
        : environment === 'formation'
          ? 'formazione'
          : environment ?? 'non specificato';
    note = `Credenziali configurate (ambiente: ${ambienteLabel}); validità token non verificabile`;
  }

  return {
    status,
    configurato,
    environment,
    note,
  };
}
