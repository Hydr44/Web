// src/app/api/auth/oauth/desktop/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Endpoint per avvio OAuth desktop
 * GET /api/auth/oauth/desktop?app_id=desktop_app&redirect_uri=http://localhost:3001/auth/callback&state=random_state
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('app_id');
    const redirectUri = searchParams.get('redirect_uri');
    const state = searchParams.get('state');

    if (!appId || !redirectUri || !state) {
      return NextResponse.json(
        { error: 'Missing required parameters: app_id, redirect_uri, state' },
        { status: 400 }
      );
    }

    if (appId !== 'desktop_app') {
      return NextResponse.json(
        { error: 'Invalid app_id' },
        { status: 400 }
      );
    }

    if (!redirectUri.startsWith('desktop://') && !redirectUri.startsWith('http://localhost:') && !redirectUri.startsWith('http://127.0.0.1:')) {
      return NextResponse.json(
        { error: 'Invalid redirect_uri. Must start with desktop://, http://localhost: or http://127.0.0.1:' },
        { status: 400 }
      );
    }

    const stateCode = `state_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    const oauthParams = {
      app_id: appId,
      redirect_uri: redirectUri,
      state,
      state_code: stateCode,
      expires_at: Date.now() + 10 * 60 * 1000,
    };

    const encodedParams = Buffer.from(JSON.stringify(oauthParams)).toString('base64');

    const origin = request.nextUrl.origin;
    const loginUrl = new URL('/auth/oauth/desktop', origin);
    loginUrl.searchParams.set('params', encodedParams);

    const finalUrl = loginUrl.toString();

    if (finalUrl.length > 2000) {
      return NextResponse.json({
        error: 'URL too long',
        redirect_url: finalUrl
      }, { status: 400 });
    }

    const escapedUrl = finalUrl
      .replaceAll('\\', '\\\\')
      .replaceAll("'", "\\'")
      .replaceAll('"', '&quot;')
      .replaceAll('\n', '\\n')
      .replaceAll('\r', '\\r');

    const htmlRedirect = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="0;url=${escapedUrl}">
  <title>Accesso a RescueManager</title>
  <style>
    /* Stessi colori e stesse regole dell'applicazione: fondo blu notte, un solo
       blu, angoli a zero. Questa pagina non passa da React, quindi lo stile e'
       scritto qui: quando cambiano i token vanno riportati anche qui. */
    :root {
      --canvas: #0a1119; --layer: #141c27; --border: #243044;
      --text: #e2e8f0; --text-secondary: #94a3b8;
      --brand: #005dfa; --brand-text: #54a2ff;
    }
    * { box-sizing: border-box; border-radius: 0 !important; }
    body {
      font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; margin: 0; padding: 20px;
      background: var(--canvas); color: var(--text);
      font-size: 14px; line-height: 1.5;
    }
    .container {
      padding: 28px 32px; background: var(--layer); border: 1px solid var(--border);
      max-width: 420px; width: 100%;
    }
    h2 { font-size: 18px; font-weight: 600; letter-spacing: -.01em; margin: 0 0 8px; }
    p { margin: 0; color: var(--text-secondary); font-size: 13px; }
    .barra { height: 2px; background: var(--border); margin: 18px 0 14px; overflow: hidden; }
    .barra span { display: block; height: 100%; width: 40%; background: var(--brand); animation: scorri 1.1s ease-in-out infinite; }
    @keyframes scorri {
      0% { margin-left: -40%; }
      100% { margin-left: 100%; }
    }
    @media (prefers-reduced-motion: reduce) {
      .barra span { animation: none; width: 100%; margin-left: 0; }
    }
    a { color: var(--brand-text); text-decoration: underline; text-underline-offset: 3px; }
  </style>
  <script>
    (function() {
      try {
        window.location.href = ${JSON.stringify(finalUrl)};
      } catch (e) {}
      setTimeout(function() {
        try {
          window.location.replace(${JSON.stringify(finalUrl)});
        } catch (e) {}
      }, 50);
      setTimeout(function() {
        if (window.location.href.indexOf('/auth/oauth/desktop') !== -1) {
          document.body.innerHTML = '<div class="container"><h2>Apri tu il collegamento</h2><p>Il passaggio automatico non e\\'andato a buon fine. <a href="' + ${JSON.stringify(finalUrl)} + '">Continua verso RescueManager</a></p></div>';
        }
      }, 200);
    })();
  </script>
</head>
<body>
  <div class="container">
    <h2>Ti stiamo portando a RescueManager</h2>
    <div class="barra"><span></span></div>
    <p>Se la pagina non cambia da sola, <a href="${escapedUrl}">continua da qui</a>.</p>
  </div>
</body>
</html>`;

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
    console.error('[OAuth Desktop] Internal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
