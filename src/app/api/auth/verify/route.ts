// src/app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyOAuthToken } from "@/lib/oauth-jwt";
import { isAllowedOrigin } from "@/lib/cors";

export const runtime = "nodejs";

// JWT Secret per desktop app — fail-fast se mancante. Il fallback storico
// 'desktop_oauth_secret_key_change_in_production' era pubblico nel repo:
// chiunque poteva forgiare access_token e bypassare l'auth desktop OAuth.
// Rimosso 2026-06-11. Settare JWT_SECRET nelle env Vercel.
// Lazy: throw a runtime (try/catch della route → 500), non a livello-modulo.
function getJwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET non configurata.');
  return s;
}

function createCorsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  if (origin && isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Vary'] = 'Origin';
  } else {
    headers['Access-Control-Allow-Origin'] = '*';
  }

  return headers;
}

function corsJson(
  origin: string | null,
  body: Record<string, unknown>,
  status: number
) {
  return NextResponse.json(body, {
    status,
    headers: createCorsHeaders(origin),
  });
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, {
    status: 200,
    headers: createCorsHeaders(origin),
  });
}

/**
 * Endpoint per verifica access token
 * GET /api/auth/verify?token=access_token
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return corsJson(origin, { error: 'Missing token parameter' }, 400);
    }

    // Verifica JWT token (tipato; null se invalido/scaduto/forma sbagliata)
    const decoded = verifyOAuthToken(token, getJwtSecret());
    if (!decoded) {
      return corsJson(origin, { error: 'Invalid or expired token' }, 401);
    }

    // Verifica che sia un access token
    if (decoded.type !== 'access') {
      return corsJson(origin, { error: 'Invalid token type' }, 401);
    }

    const supabase = supabaseAdmin;

    // Verifica che il token sia ancora attivo nel database
    const { data: tokenData, error: tokenError } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('access_token', token)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !tokenData) {
      return corsJson(origin, { error: 'Token not found or expired' }, 401);
    }

    // Recupera dati utente aggiornati
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', decoded.user_id)
      .single();

    if (userError || !userData) {
      return corsJson(origin, { error: 'User not found' }, 404);
    }

    // Risposta con dati utente
    return corsJson(origin, {
      valid: true,
      user: {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        avatar_url: userData.avatar_url,
        current_org: userData.current_org,
        is_admin: userData.is_admin,
        is_staff: userData.is_staff,
        staff_role: userData.staff_role,
      },
      token_info: {
        app_id: decoded.app_id,
        type: decoded.type,
        expires_at: tokenData.expires_at,
      },
    }, 200);

  } catch (error) {
    console.error('Token verification error:', error);
    return corsJson(origin, { error: 'Internal server error' }, 500);
  }
}
