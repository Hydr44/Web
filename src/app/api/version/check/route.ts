import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { readPolicy, evaluatePolicy } from "@/lib/appUpdatePolicy";
import { isAllowedOrigin } from "@/lib/cors";

export const runtime = "nodejs";

/**
 * GET /api/version/check?current=X.Y.Z
 * Verifica se l'app deve essere aggiornata
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowed = isAllowedOrigin(origin);
  const allowOrigin = allowed ? origin! : '*';
  const requestedHeaders = request.headers.get('access-control-request-headers') || '*';

  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': requestedHeaders || '*',
    'Access-Control-Max-Age': '86400',
  };

  if (allowed) {
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Vary'] = 'Origin, Access-Control-Request-Headers';
  }

  return new NextResponse(null, { status: 200, headers });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowed = isAllowedOrigin(origin);
  const allowOrigin = allowed ? origin! : '*';
  const corsJson = (body: any, status = 200) =>
    NextResponse.json(body, {
      status,
      headers: {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        ...(allowed ? { 'Access-Control-Allow-Credentials': 'true', Vary: 'Origin' } : {}),
      },
    });

  try {
    const { searchParams } = new URL(request.url);
    const currentVersion = searchParams.get('current') || '0.0.0';

    // Policy UNICA (target / soglia minima / mode / grace) da
    // system_settings.app_update_policy. Vedi lib/appUpdatePolicy.
    const policy = await readPolicy(supabaseAdmin);
    const evald = evaluatePolicy(policy, currentVersion);

    return corsJson({
      update_required: evald.update_required,
      force_update: evald.force_update,
      current_version: evald.current_version,
      latest_version: evald.latest_version,
      min_required: evald.min_required,
      // ISO datetime se il client è in finestra "grace": il banner mostra il
      // countdown e diventa bloccante da solo allo scadere.
      mandatory_after: evald.mandatory_after,
      mode: evald.mode,
      notes: evald.notes,
      download_url: null, // il download passa dal feed electron-updater
    });
  } catch (error) {
    console.error('Version check error:', error);
    return corsJson({ update_required: false, force_update: false }, 200);
  }
}

