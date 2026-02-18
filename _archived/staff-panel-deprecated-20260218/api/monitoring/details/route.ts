import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const TIMEOUT_MS = 8000;

// ─── SDI Details: chiama /api/sdi-sftp/status sul VPS ───

async function fetchSdiStatus() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch('http://sdi-sftp.rescuemanager.eu/api/sdi-sftp/status', {
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
  const [sdiStatus, sdiFatture, rentriFir] = await Promise.all([
    fetchSdiStatus(),
    fetchSdiFattureStats(),
    fetchRentriFirStats(),
  ]);

  return NextResponse.json({
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
    },
    rentri: {
      fir: rentriFir,
    },
    checkedAt: new Date().toISOString(),
  });
}
