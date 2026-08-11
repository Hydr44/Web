/**
 * GET /api/staff/admin/clients/[id]/diagnostics
 * Diagnostica "cosa non funziona" per org: semaforo di configurazione
 * (SDI, RENTRI, accesso/notifiche, moduli). Sola lettura. Auth staff dal middleware.
 */
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders, handleCors } from '@/lib/cors';

export async function OPTIONS(request: Request) {
  return handleCors(request) as NextResponse;
}

type Status = 'ok' | 'warn' | 'ko' | 'neutral';
interface Check { group: string; key: string; label: string; status: Status; detail: string; }

function fmtDate(d: string | null): string {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('it-IT'); } catch { return d; }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  const orgId = params.id;
  try {
    const [orgRes, settingsRes, certsRes, membersRes] = await Promise.all([
      supabaseAdmin.from('orgs').select('id, name, is_demo, verification_pending, web_access_enabled, desktop_access_enabled, desktop_modules').eq('id', orgId).maybeSingle(),
      supabaseAdmin.from('org_settings').select('key, value, rentri_environment').eq('org_id', orgId),
      supabaseAdmin.from('rentri_org_certificates').select('tipo_certificato, environment, is_active, expires_at, credentials_id_mobile').eq('org_id', orgId),
      supabaseAdmin.from('org_members').select('user_id').eq('org_id', orgId),
    ]);

    const org = orgRes.data;
    if (!org) return NextResponse.json({ success: false, error: 'Organizzazione non trovata' }, { status: 404, headers });

    const settings = settingsRes.data || [];
    const valOf = (k: string): Record<string, unknown> => {
      const row = settings.find((s) => s.key === k);
      return (row && row.value && typeof row.value === 'object') ? (row.value as Record<string, unknown>) : {};
    };
    const sdi = valOf('sdi');
    const company = valOf('company');
    const features = valOf('features');
    const rentriEnv = (settings.find((s) => s.rentri_environment)?.rentri_environment) || 'demo';
    const certs = certsRes.data || [];
    const memberIds = (membersRes.data || []).map((m) => m.user_id);

    // Piano → max_modules
    let plan: string | null = null;
    let maxModules: number | null = null;
    const { data: sub } = await supabaseAdmin.from('org_subscriptions').select('plan').eq('org_id', orgId).maybeSingle();
    plan = sub?.plan || null;
    if (plan) {
      const { data: pl } = await supabaseAdmin.from('plans').select('max_modules').eq('id', plan).maybeSingle();
      maxModules = (pl && typeof pl.max_modules === 'number') ? pl.max_modules : null;
    }

    // Push token sui membri
    let pushWith = 0;
    if (memberIds.length) {
      const { data: profs } = await supabaseAdmin.from('profiles').select('id, push_token').in('id', memberIds);
      pushWith = (profs || []).filter((p) => p.push_token).length;
    }

    const now = Date.now();
    const activeCert = (tipo: string) => certs.find((c) => c.tipo_certificato === tipo && c.is_active && c.environment === rentriEnv);
    const certCheck = (tipo: string, label: string): Check => {
      const c = activeCert(tipo);
      if (!c) return { group: 'RENTRI', key: tipo, label, status: 'ko', detail: `nessun certificato attivo (ambiente ${rentriEnv})` };
      const exp = c.expires_at ? new Date(c.expires_at).getTime() : 0;
      if (exp && exp < now) return { group: 'RENTRI', key: tipo, label, status: 'ko', detail: 'scaduto il ' + fmtDate(c.expires_at) };
      if (exp && exp < now + 30 * 86400000) return { group: 'RENTRI', key: tipo, label, status: 'warn', detail: 'in scadenza (' + fmtDate(c.expires_at) + ')' };
      return { group: 'RENTRI', key: tipo, label, status: 'ok', detail: c.expires_at ? 'valido → scade ' + fmtDate(c.expires_at) : 'valido' };
    };

    const modules: string[] = Array.isArray(org.desktop_modules) ? org.desktop_modules : [];
    const codDest = (sdi.codice_destinatario || company.codice_destinatario) as string | undefined;
    const firmaMobile = certs.find((c) => c.tipo_certificato === 'firma_remota' && c.credentials_id_mobile);
    const webOn = org.web_access_enabled !== false;
    const deskOn = org.desktop_access_enabled !== false;

    const checks: Check[] = [
      { group: 'Fatturazione elettronica (SDI)', key: 'sdi_cod', label: 'Codice destinatario SDI',
        status: codDest ? (codDest === 'GCUCU73' ? 'warn' : 'ok') : 'ko',
        detail: codDest ? (codDest === 'GCUCU73' ? `${codDest} · punta all'ambiente test` : String(codDest)) : 'non impostato → impossibile fatturare' },
      { group: 'Fatturazione elettronica (SDI)', key: 'sdi_reg', label: 'Regime fiscale + PEC',
        status: (sdi.regime_fiscale && sdi.pec) ? 'ok' : 'warn',
        detail: [sdi.regime_fiscale ? String(sdi.regime_fiscale) : null, sdi.pec ? 'PEC ok' : 'PEC mancante'].filter(Boolean).join(' · ') || 'da completare' },
      certCheck('interoperabilita', 'Certificato interoperabilità'),
      certCheck('firma_remota', 'Certificato firma remota'),
      { group: 'RENTRI', key: 'rentri_env', label: 'Ambiente RENTRI',
        status: rentriEnv === 'production' ? 'ok' : 'warn', detail: rentriEnv + (rentriEnv === 'production' ? '' : ' · non in produzione') },
      { group: 'RENTRI', key: 'firma_mobile', label: 'Firma da mobile',
        status: firmaMobile ? 'ok' : 'neutral', detail: firmaMobile ? 'configurata' : 'nessun dispositivo' },
      { group: 'Accesso & notifiche', key: 'verif', label: 'Verifica dati',
        status: org.verification_pending ? 'ko' : 'ok', detail: org.verification_pending ? 'in attesa → app bloccata' : 'completata' },
      { group: 'Accesso & notifiche', key: 'access', label: 'Accesso web + desktop',
        status: (webOn && deskOn) ? 'ok' : 'ko', detail: `web ${webOn ? 'on' : 'off'} · desktop ${deskOn ? 'on' : 'off'}` },
      { group: 'Accesso & notifiche', key: 'push', label: 'Notifiche push',
        status: memberIds.length === 0 ? 'neutral' : (features.push_notifications === false ? 'warn' : (pushWith === 0 ? 'warn' : 'ok')),
        detail: `${pushWith} di ${memberIds.length} membri con token` + (features.push_notifications === false ? ' · push disattivate' : '') },
      { group: 'Moduli', key: 'modules', label: 'Moduli attivi vs piano',
        status: (maxModules != null && modules.length > maxModules) ? 'warn' : 'ok',
        detail: `${modules.length} attivi` + (maxModules != null ? ` · piano ${plan} (max ${maxModules})` : '') },
    ];

    const summary = {
      ok: checks.filter((c) => c.status === 'ok').length,
      warn: checks.filter((c) => c.status === 'warn').length,
      ko: checks.filter((c) => c.status === 'ko').length,
    };
    return NextResponse.json({ success: true, checks, summary, rentriEnv }, { status: 200, headers });
  } catch {
    return NextResponse.json({ success: false, error: 'Errore interno del server' }, { status: 500, headers });
  }
}
