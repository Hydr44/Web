import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getStaffFromRequest } from '@/lib/staff-auth';
import { corsHeaders } from '@/lib/cors';

/**
 * Salute/manutenzione RENTRI per lo staff (pannello admin "Manutenzione RENTRI").
 * Tutto server-side (nessun CORS verso il gateway). Ogni sezione è difensiva:
 * un fallimento non rompe le altre.
 *
 * Sorgenti:
 *  - Gateway prod (rentri.rescuemanager.eu :3003) + staging (staging-rentri :4003):
 *    /health (processo su), /api/version (commit), /api/rentri/status?service= (RENTRI upstream).
 *  - Supabase: certificati per ambiente, errori di trasmissione recenti.
 */

const GW_PROD = process.env.RENTRI_GATEWAY_PUBLIC_URL || 'https://rentri.rescuemanager.eu';
const GW_STAGING = process.env.RENTRI_GATEWAY_STAGING_URL || 'https://staging-rentri.rescuemanager.eu';
const RENTRI_SERVICES = ['anagrafiche', 'formulari', 'dati-registri', 'vidimazione-formulari', 'codifiche'];

async function fetchJson(url: string, timeoutMs = 6000): Promise<{ ok: boolean; status: number; body?: unknown }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    let body: unknown = undefined;
    try { body = await res.json(); } catch { /* non-JSON */ }
    return { ok: res.ok, status: res.status, body };
  } catch {
    return { ok: false, status: 0 };
  } finally {
    clearTimeout(timer);
  }
}

async function gatewayHealth(base: string) {
  const [health, version] = await Promise.all([
    fetchJson(`${base}/health`),
    fetchJson(`${base}/api/version`),
  ]);
  return {
    up: health.ok,
    health_status: health.status,
    version: (version.ok ? version.body : null) as unknown,
  };
}

async function rentriUpstream(base: string, environment: 'prod' | 'demo') {
  const results = await Promise.all(
    RENTRI_SERVICES.map(async (service) => {
      const r = await fetchJson(`${base}/api/rentri/status?service=${service}&environment=${environment}`);
      const body = (r.body || {}) as { ok?: boolean; status?: number };
      return { service, reachable: r.ok, rentri_ok: body.ok ?? null, rentri_status: body.status ?? r.status };
    })
  );
  return results;
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const staff = await getStaffFromRequest(request);
  if (!staff) {
    return NextResponse.json({ success: false, error: 'Non autorizzato' }, { status: 401, headers: corsHeaders(origin) });
  }

  const out: Record<string, unknown> = { success: true, generated_at: new Date().toISOString() };

  // 1) Gateway health (prod + staging) — in parallelo, difensivo.
  const [prodHealth, stagingHealth] = await Promise.allSettled([
    gatewayHealth(GW_PROD),
    gatewayHealth(GW_STAGING),
  ]);
  out.gateway = {
    prod: prodHealth.status === 'fulfilled' ? prodHealth.value : { up: false, health_status: 0, version: null },
    staging: stagingHealth.status === 'fulfilled' ? stagingHealth.value : { up: false, health_status: 0, version: null },
  };

  // 2) Servizi RENTRI upstream (via gateway prod, ambiente prod).
  try {
    out.rentri_services = await rentriUpstream(GW_PROD, 'prod');
  } catch {
    out.rentri_services = [];
  }

  // 3) Certificati (conteggio per ambiente) — solo colonne certe.
  try {
    const { data: certs } = await supabaseAdmin
      .from('rentri_org_certificates')
      .select('environment, is_active, is_default, tipo_certificato');
    const active = (certs || []).filter((c) => c.is_active && c.tipo_certificato === 'interoperabilita');
    out.certs = {
      total_active: active.length,
      demo: active.filter((c) => c.environment === 'demo').length,
      prod: active.filter((c) => c.environment === 'prod').length,
      default_set: active.filter((c) => c.is_default).length,
    };
  } catch {
    out.certs = null;
  }

  // 4) Errori di trasmissione recenti (ultimi 14 giorni), difensivo per tabella/colonna.
  const since = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
  const errors: Record<string, unknown> = { days: 14 };
  try {
    const { count } = await supabaseAdmin
      .from('rentri_formulari')
      .select('id', { count: 'exact', head: true })
      .not('sync_error', 'is', null)
      .gte('updated_at', since);
    errors.formulari = count ?? 0;
  } catch { errors.formulari = null; }
  try {
    const { count } = await supabaseAdmin
      .from('rentri_movimenti')
      .select('id', { count: 'exact', head: true })
      .eq('sync_status', 'error')
      .gte('data_ora_registrazione', since);
    errors.movimenti = count ?? 0;
  } catch { errors.movimenti = null; }
  out.errors_recent = errors;

  // 5) Watchtower — placeholder finché il cron non popola `rentri_health_checks`.
  try {
    const { data: last } = await supabaseAdmin
      .from('rentri_health_checks')
      .select('*')
      .order('run_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    out.watchtower = last || { configured: false };
  } catch {
    out.watchtower = { configured: false };
  }

  return NextResponse.json(out, { headers: corsHeaders(origin) });
}
