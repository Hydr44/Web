/**
 * Policy aggiornamento desktop — pannello admin "Aggiornamenti".
 *
 * GET  → policy corrente + ultima versione pubblicata + completezza file release.
 * POST → salva la policy (mode optional|forced|grace, soglia minima, data grace, messaggio).
 *
 * Scrive system_settings.key='app_update_policy' (oggetto JSON), letto da
 * /api/version/check tramite lib/appUpdatePolicy.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest, requireStaffRole } from '@/lib/staff-auth';
import {
  readPolicy,
  latestPublishedVersion,
  currentReleaseStatus,
  POLICY_KEY,
  DEFAULT_POLICY,
  type AppUpdatePolicy,
  type UpdateMode,
} from '@/lib/appUpdatePolicy';

export const runtime = 'nodejs';

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const staff = await getStaffFromRequest(request);
  if (!staff) {
    return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers: corsHeaders(origin) });
  }

  const policy = await readPolicy(supabaseAdmin);
  const latestPublished = await latestPublishedVersion(supabaseAdmin);
  const release = await currentReleaseStatus(supabaseAdmin, policy.target_version || latestPublished);

  return NextResponse.json(
    { success: true, policy, latest_published: latestPublished, release },
    { headers: corsHeaders(origin) },
  );
}

const VALID_MODES: UpdateMode[] = ['optional', 'forced', 'grace'];
const isVersion = (v: unknown): v is string =>
  typeof v === 'string' && /^\d+(\.\d+){0,3}$/.test(v.trim());

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const staff = await getStaffFromRequest(request);
  if (!staff) {
    return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers: corsHeaders(origin) });
  }
  if (!requireStaffRole(staff, 'admin', 'manager')) {
    return NextResponse.json({ success: false, error: 'Permessi insufficienti' }, { status: 403, headers: corsHeaders(origin) });
  }

  try {
    const body = await request.json();
    const mode: UpdateMode = VALID_MODES.includes(body.mode) ? body.mode : 'optional';

    if (body.target_version && !isVersion(body.target_version)) {
      return NextResponse.json({ success: false, error: 'Versione obiettivo non valida (es. 2.4.0)' }, { status: 400, headers: corsHeaders(origin) });
    }
    if (body.min_supported && !isVersion(body.min_supported)) {
      return NextResponse.json({ success: false, error: 'Versione minima non valida (es. 2.4.0)' }, { status: 400, headers: corsHeaders(origin) });
    }

    let graceUntil: string | null = null;
    if (mode === 'grace') {
      const t = body.grace_until ? Date.parse(body.grace_until) : NaN;
      if (!Number.isFinite(t)) {
        return NextResponse.json({ success: false, error: 'Per "Obbligatorio dalla data" serve una data valida.' }, { status: 400, headers: corsHeaders(origin) });
      }
      graceUntil = new Date(t).toISOString();
    }

    // Versione obiettivo: quella passata, altrimenti l'ultima pubblicata su R2.
    const target =
      (body.target_version && String(body.target_version).trim()) ||
      (await latestPublishedVersion(supabaseAdmin)) ||
      '0.0.0';

    const policy: AppUpdatePolicy = {
      ...DEFAULT_POLICY,
      target_version: target,
      min_supported: (body.min_supported && String(body.min_supported).trim()) || '0.0.0',
      mode,
      grace_until: graceUntil,
      message: typeof body.message === 'string' && body.message.trim() ? body.message.trim() : null,
    };

    const { error } = await supabaseAdmin
      .from('system_settings')
      .upsert(
        {
          key: POLICY_KEY,
          value: policy,
          description: 'Policy aggiornamento desktop (target/floor/mode/grace)',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' },
      );

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders(origin) });
    }

    return NextResponse.json({ success: true, policy }, { headers: corsHeaders(origin) });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Errore interno' }, { status: 500, headers: corsHeaders(origin) });
  }
}
