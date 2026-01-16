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

    // SEMPRE usa HTML redirect per questo endpoint
    // Il browser esterno aperto da Electron potrebbe non seguire redirect HTTP
    console.log('Using HTML redirect (always for desktop OAuth)');
    
    // Escape dell'URL per sicurezza in HTML/JavaScript
    const escapedUrl = finalUrl
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
    
    const htmlRedirect = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="0;url=${escapedUrl}">
  <title>Reindirizzamento OAuth...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 40px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      backdrop-filter: blur(10px);
    }
    .spinner {
      border: 3px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top: 3px solid white;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 20px auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    a {
      color: white;
      text-decoration: underline;
    }
  </style>
  <script>
    (function() {
      console.log('[OAuth Redirect] Page loaded');
      console.log('[OAuth Redirect] Target URL:', ${JSON.stringify(finalUrl)});
      
      // Prova immediatamente con href
      try {
        window.location.href = ${JSON.stringify(finalUrl)};
        console.log('[OAuth Redirect] window.location.href set');
      } catch (e) {
        console.error('[OAuth Redirect] Error setting href:', e);
      }
      
      // Fallback con replace dopo 50ms
      setTimeout(function() {
        try {
          window.location.replace(${JSON.stringify(finalUrl)});
          console.log('[OAuth Redirect] window.location.replace called');
        } catch (e) {
          console.error('[OAuth Redirect] Error with replace:', e);
        }
      }, 50);
      
      // Ultimo fallback dopo 200ms
      setTimeout(function() {
        if (window.location.href.indexOf('/auth/oauth/desktop') !== -1) {
          console.warn('[OAuth Redirect] Still on same page, forcing redirect');
          document.body.innerHTML = '<div class="container"><h2>Reindirizzamento manuale necessario</h2><p><a href="' + ${JSON.stringify(finalUrl)} + '">Clicca qui per continuare</a></p></div>';
        }
      }, 200);
    })();
  </script>
</head>
<body>
  <div class="container">
    <h2>Reindirizzamento in corso...</h2>
    <div class="spinner"></div>
    <p>Se non vieni reindirizzato automaticamente, <a href="${escapedUrl}">clicca qui</a>.</p>
  </div>
</body>
</html>`;
    
    console.log('HTML redirect page created, length:', htmlRedirect.length);
    
    return new NextResponse(htmlRedirect, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('OAuth desktop error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
