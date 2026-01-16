// src/app/api/auth/oauth/desktop/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

/**
 * Endpoint per avvio OAuth desktop
 * GET /api/auth/oauth/desktop?app_id=desktop_app&redirect_uri=http://localhost:3001/auth/callback&state=random_state
 */
export async function GET(request: NextRequest) {
  try {
    console.log('=== OAUTH DESKTOP ENDPOINT START ===');
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('app_id');
    const redirectUri = searchParams.get('redirect_uri');
    const state = searchParams.get('state');

    console.log('OAuth params:', { appId, redirectUri, state });

    // Validazione parametri
    if (!appId || !redirectUri || !state) {
      console.error('Missing parameters:', { appId, redirectUri, state });
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
    if (!redirectUri.startsWith('desktop://') && !redirectUri.startsWith('http://localhost:') && !redirectUri.startsWith('http://127.0.0.1:')) {
      console.error('Invalid redirect_uri:', redirectUri);
      return NextResponse.json(
        { error: 'Invalid redirect_uri. Must start with desktop://, http://localhost: or http://127.0.0.1:' },
        { status: 400 }
      );
    }
    
    console.log('Redirect URI validated:', redirectUri);

    // Genera state temporaneo (senza database per evitare RLS)
    const stateCode = `state_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    console.log('Generated state code:', stateCode);
    
    // Codifica i parametri OAuth in base64 per passaggio sicuro
    const oauthParams = {
      app_id: appId,
      redirect_uri: redirectUri,
      state: state,
      state_code: stateCode,
      expires_at: Date.now() + 10 * 60 * 1000 // 10 minuti
    };
    
    const encodedParams = Buffer.from(JSON.stringify(oauthParams)).toString('base64');
    console.log('Encoded OAuth params:', encodedParams);
    console.log('Encoded params length:', encodedParams.length);

    // Redirect alla pagina di login OAuth
    // Usa request.nextUrl.origin per ottenere l'URL base corretto
    const origin = request.nextUrl.origin;
    const loginUrl = new URL('/auth/oauth/desktop', origin);
    loginUrl.searchParams.set('params', encodedParams);
    
    const finalUrl = loginUrl.toString();
    console.log('=== REDIRECT INFO ===');
    console.log('Origin:', origin);
    console.log('Login URL path:', '/auth/oauth/desktop');
    console.log('Final redirect URL:', finalUrl);
    console.log('URL length:', finalUrl.length);
    console.log('========================');

    // Verifica che l'URL non sia troppo lungo (alcuni browser hanno limiti)
    if (finalUrl.length > 2000) {
      console.error('WARNING: Redirect URL is very long:', finalUrl.length);
      // Se l'URL è troppo lungo, usa un approccio alternativo
      return NextResponse.json({
        error: 'URL too long',
        redirect_url: finalUrl
      }, { status: 400 });
    }

    // Rileva se è un browser Electron (potrebbe non seguire redirect HTTP)
    const userAgent = request.headers.get('user-agent') || '';
    const isElectron = userAgent.includes('Electron');
    
    console.log('User-Agent:', userAgent);
    console.log('Is Electron:', isElectron);
    
    if (isElectron) {
      // Per Electron, usa una pagina HTML con redirect JavaScript
      console.log('Using HTML redirect for Electron browser');
      const htmlRedirect = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0;url=${finalUrl.replace(/'/g, "\\'")}">
  <title>Redirecting...</title>
  <script>
    console.log('[OAuth Redirect] Redirecting to:', ${JSON.stringify(finalUrl)});
    window.location.href = ${JSON.stringify(finalUrl)};
    setTimeout(function() {
      window.location.replace(${JSON.stringify(finalUrl)});
    }, 100);
  </script>
</head>
<body>
  <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
    <h2>Reindirizzamento in corso...</h2>
    <p>Se non vieni reindirizzato automaticamente, <a href="${finalUrl.replace(/"/g, '&quot;')}">clicca qui</a>.</p>
  </div>
</body>
</html>`;
      
      return new NextResponse(htmlRedirect, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    // Per browser normali, usa redirect HTTP standard
    const response = NextResponse.redirect(finalUrl, 302);
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    console.log('Redirect response created, Location header:', response.headers.get('Location'));
    
    return response;

  } catch (error) {
    console.error('OAuth desktop error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
