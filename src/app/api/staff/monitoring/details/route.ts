import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const TIMEOUT_MS = 8000;

const ISO_24H_AGO = () => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

// ─── Piattaforma: health-check Vercel (website) ───

async function fetchVercelHealth() {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch('https://rescuemanager.eu/api/health', {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);
    const latency = Date.now() - start;
    return {
      status: res.ok ? 'online' : 'degraded',
      http_status: res.status,
      latency_ms: latency,
      checked_at: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'offline',
      http_status: null,
      latency_ms: Date.now() - start,
      error: error instanceof Error ? error.message : 'unreachable',
      checked_at: new Date().toISOString(),
    };
  }
}

// ─── Piattaforma: health-check Supabase (query leggera) ───

async function fetchSupabaseHealth() {
  const start = Date.now();
  try {
    const { error } = await supabaseAdmin
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .limit(1);
    const latency = Date.now() - start;
    if (error) {
      return { status: 'degraded', latency_ms: latency, error: error.message, checked_at: new Date().toISOString() };
    }
    return { status: 'online', latency_ms: latency, checked_at: new Date().toISOString() };
  } catch (error) {
    return {
      status: 'offline',
      latency_ms: Date.now() - start,
      error: error instanceof Error ? error.message : 'unreachable',
      checked_at: new Date().toISOString(),
    };
  }
}

// ─── Piattaforma: coda email (outbox_emails) ───

async function fetchEmailOutboxStats() {
  try {
    const ieri = ISO_24H_AGO();

    const counts = await Promise.all(
      (['queued', 'sent', 'failed'] as const).map(async (st) => {
        const { count } = await supabaseAdmin
          .from('outbox_emails')
          .select('id', { count: 'exact', head: true })
          .eq('status', st);
        return [st, count || 0] as const;
      })
    );
    const byStatus = Object.fromEntries(counts) as Record<'queued' | 'sent' | 'failed', number>;

    const { count: failed24h } = await supabaseAdmin
      .from('outbox_emails')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'failed')
      .gte('created_at', ieri);

    const { data: latestFailed } = await supabaseAdmin
      .from('outbox_emails')
      .select('id, to_addr, subject, error, created_at')
      .eq('status', 'failed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      stats: {
        queued: byStatus.queued,
        sent: byStatus.sent,
        failed: byStatus.failed,
        failed_24h: failed24h || 0,
      },
      latest_failed: latestFailed || null,
    };
  } catch (error) {
    console.error('[MONITORING] Errore query outbox_emails:', error);
    return null;
  }
}

// ─── SDI Details: ping del SDI Web Service (post-migrazione SFTP→WS maggio 2026) ───
// L'URL e' opzionale via env per supportare prod/test su hostname diversi.
// Senza SDI_WS_STATUS_URL la funzione torna null e l'UI mostra "non disponibile".

async function fetchSdiStatus() {
  const url = process.env.SDI_WS_STATUS_URL;
  if (!url) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ─── SDI Fatture: ultime fatture inviate da Supabase ───

async function fetchSdiFattureStats() {
  try {
    // Ultime 5 fatture inviate
    const { data: ultimeFatture, error: errUltime } = await supabaseAdmin
      .from('invoices')
      .select('id, number, date, total, customer_name, sdi_status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (errUltime) throw errUltime;

    // Conteggio fatture ultime 24h
    const ieri = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: inviate24h, error: errCount24 } = await supabaseAdmin
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', ieri);

    if (errCount24) throw errCount24;

    // Conteggio fatture con errore SDI
    const { count: erroriSdi, error: errSdi } = await supabaseAdmin
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', ieri)
      .eq('sdi_status', 'error');

    if (errSdi) throw errSdi;

    // Totale fatture nel sistema
    const { count: totale, error: errTot } = await supabaseAdmin
      .from('invoices')
      .select('id', { count: 'exact', head: true });

    if (errTot) throw errTot;

    return {
      ultime_fatture: ultimeFatture || [],
      stats: {
        totale: totale || 0,
        inviate_24h: inviate24h || 0,
        errori_sdi_24h: erroriSdi || 0,
      },
    };
  } catch (error) {
    console.error('[MONITORING] Errore query fatture SDI:', error);
    return null;
  }
}

// ─── SDI Events: scarti e notifiche (sdi_events) ───

async function fetchSdiEventsStats() {
  try {
    const ieri = ISO_24H_AGO();

    // Scarti totali (NotificaScarto / NS)
    const { count: scartiTotali } = await supabaseAdmin
      .from('sdi_events')
      .select('id', { count: 'exact', head: true })
      .in('event_type', ['NotificaScarto', 'NS']);

    // Scarti 24h
    const { count: scarti24h } = await supabaseAdmin
      .from('sdi_events')
      .select('id', { count: 'exact', head: true })
      .in('event_type', ['NotificaScarto', 'NS'])
      .gte('created_at', ieri);

    // Ultimi 5 eventi
    const { data: ultimiEventi } = await supabaseAdmin
      .from('sdi_events')
      .select('id, invoice_id, event_type, payload, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    // Ultimo scarto con dettaglio
    const { data: ultimoScarto } = await supabaseAdmin
      .from('sdi_events')
      .select('id, invoice_id, event_type, payload, created_at')
      .in('event_type', ['NotificaScarto', 'NS'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      stats: {
        scarti_totali: scartiTotali || 0,
        scarti_24h: scarti24h || 0,
      },
      ultimi_eventi: ultimiEventi || [],
      ultimo_scarto: ultimoScarto || null,
    };
  } catch (error) {
    console.error('[MONITORING] Errore query sdi_events:', error);
    return null;
  }
}

// ─── RENTRI Movimenti: registri di carico/scarico ───

async function fetchRentriMovimentiStats() {
  try {
    const ieri = ISO_24H_AGO();

    const { count: totale } = await supabaseAdmin
      .from('rentri_movimenti')
      .select('id', { count: 'exact', head: true });

    const { count: errori } = await supabaseAdmin
      .from('rentri_movimenti')
      .select('id', { count: 'exact', head: true })
      .eq('stato', 'errore');

    const { count: inTrasmissione } = await supabaseAdmin
      .from('rentri_movimenti')
      .select('id', { count: 'exact', head: true })
      .eq('stato', 'in_trasmissione');

    const { count: trasmessi24h } = await supabaseAdmin
      .from('rentri_movimenti')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', ieri);

    const { count: errori24h } = await supabaseAdmin
      .from('rentri_movimenti')
      .select('id', { count: 'exact', head: true })
      .eq('stato', 'errore')
      .gte('created_at', ieri);

    const { data: ultimiMovimenti } = await supabaseAdmin
      .from('rentri_movimenti')
      .select('id, tipo_operazione, codice_eer, quantita, stato, error, data_operazione, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      stats: {
        totale: totale || 0,
        errori: errori || 0,
        in_trasmissione: inTrasmissione || 0,
        trasmessi_24h: trasmessi24h || 0,
        errori_24h: errori24h || 0,
      },
      ultimi_movimenti: ultimiMovimenti || [],
    };
  } catch (error) {
    console.error('[MONITORING] Errore query rentri_movimenti:', error);
    return null;
  }
}

// ─── RENTRI FIR: ultimi formulari e statistiche ───

async function fetchRentriFirStats() {
  try {
    // Ultimo FIR trasmesso
    const { data: ultimoFir, error: errUltimo } = await supabaseAdmin
      .from('rentri_formulari')
      .select('id, numero_fir, rentri_numero, stato, rentri_stato, org_id, environment, created_at, sync_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (errUltimo && errUltimo.code !== 'PGRST116') throw errUltimo;

    // Ultimi 5 FIR
    const { data: ultimiFir, error: errLista } = await supabaseAdmin
      .from('rentri_formulari')
      .select('id, numero_fir, rentri_numero, stato, rentri_stato, org_id, environment, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (errLista) throw errLista;

    // Errori ultime 24h
    const ieri = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: errori24h, error: errRifiutati } = await supabaseAdmin
      .from('rentri_formulari')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', ieri)
      .eq('stato', 'rifiutato');

    if (errRifiutati) throw errRifiutati;

    // Trasmessi ultime 24h
    const { count: trasmessi24h, error: errTrasmessi } = await supabaseAdmin
      .from('rentri_formulari')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', ieri);

    if (errTrasmessi) throw errTrasmessi;

    // Totale FIR nel sistema
    const { count: totale, error: errTot } = await supabaseAdmin
      .from('rentri_formulari')
      .select('id', { count: 'exact', head: true });

    if (errTot) throw errTot;

    return {
      ultimo_fir: ultimoFir || null,
      ultimi_fir: ultimiFir || [],
      stats: {
        totale: totale || 0,
        trasmessi_24h: trasmessi24h || 0,
        errori_24h: errori24h || 0,
      },
    };
  } catch (error) {
    console.error('[MONITORING] Errore query RENTRI FIR:', error);
    return null;
  }
}

// ─── GET Handler ───

export async function GET() {
  const [
    sdiStatus, sdiFatture, sdiEvents,
    rentriFir, rentriMovimenti,
    vercelHealth, supabaseHealth, emailOutbox,
  ] = await Promise.all([
    fetchSdiStatus(),
    fetchSdiFattureStats(),
    fetchSdiEventsStats(),
    fetchRentriFirStats(),
    fetchRentriMovimentiStats(),
    fetchVercelHealth(),
    fetchSupabaseHealth(),
    fetchEmailOutboxStats(),
  ]);

  return NextResponse.json({
    platform: {
      vercel: vercelHealth,
      supabase: supabaseHealth,
      email_outbox: emailOutbox,
    },
    sdi: {
      sftp_status: sdiStatus
        ? {
            test_mode: sdiStatus.test_mode,
            files_pending: sdiStatus.summary?.pending_count ?? 0,
            files_eo: sdiStatus.summary?.eo_count ?? 0,
            files_er: sdiStatus.summary?.er_count ?? 0,
            files_fo: sdiStatus.summary?.fo_count ?? 0,
            latest_eo: sdiStatus.files_eo?.[0] ? {
              filename: sdiStatus.files_eo[0].filename,
              generated_at: sdiStatus.files_eo[0].generated_at,
            } : null,
            latest_er: sdiStatus.files_er?.[0] ? {
              filename: sdiStatus.files_er[0].filename,
              error_description: sdiStatus.files_er[0].error_description,
              generated_at: sdiStatus.files_er[0].generated_at,
            } : null,
          }
        : null,
      fatture: sdiFatture,
      events: sdiEvents,
    },
    rentri: {
      fir: rentriFir,
      movimenti: rentriMovimenti,
    },
    checkedAt: new Date().toISOString(),
  });
}
