// src/app/api/auth/oauth/desktop/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

/**
 * Endpoint per avvio OAuth desktop
 * GET /api/auth/oauth/desktop?app_id=desktop_app&redirect_uri=desktop://auth/callback&state=random_state
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('app_id');
    const redirectUri = searchParams.get('redirect_uri');
    const state = searchParams.get('state');

    // Validazione parametri
    if (!appId || !redirectUri || !state) {
      return NextResponse.json(
        { error: 'Missing required parameters: app_id, redirect_uri, state' },
        { status: 400 }
      );
    }

    // Validazione app_id
    if (appId !== 'desktop_app') {
      return NextResponse.json(
        { error: 'Invalid app_id' },
        { status: 400 }
      );
    }

    // Validazione redirect_uri
    if (!redirectUri.startsWith('desktop://')) {
      return NextResponse.json(
        { error: 'Invalid redirect_uri. Must start with desktop://' },
        { status: 400 }
      );
    }

    // Salva state temporaneamente per verifica
    const supabase = await supabaseServer();
    
    // Crea una sessione temporanea per lo state
    const { data: stateData, error: stateError } = await supabase
      .from('oauth_codes')
      .insert({
        code: `state_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        user_id: null, // Sarà popolato dopo il login
        app_id: appId,
        redirect_uri: redirectUri,
        state: state,
        expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minuti
        used: false
      })
      .select()
      .single();

    if (stateError) {
      console.error('Error saving state:', stateError);
      return NextResponse.json(
        { error: 'Failed to initialize OAuth flow' },
        { status: 500 }
      );
    }

    // Redirect alla pagina di login OAuth
    const loginUrl = new URL('/auth/oauth/desktop', request.url);
    loginUrl.searchParams.set('app_id', appId);
    loginUrl.searchParams.set('redirect_uri', redirectUri);
    loginUrl.searchParams.set('state', state);
    loginUrl.searchParams.set('state_id', stateData.id);

    return NextResponse.redirect(loginUrl.toString());

  } catch (error) {
    console.error('OAuth desktop error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
