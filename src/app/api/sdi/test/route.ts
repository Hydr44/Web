// API endpoint di test per Sistema di Interscambio (SDI)
// Endpoint: GET /api/sdi/test
// 
// Questo endpoint permette di testare la configurazione SDI
// e verificare che gli endpoint siano raggiungibili

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                  'http://localhost:3000';

  return NextResponse.json({
    success: true,
    message: 'Endpoint SDI test attivo',
         endpoints: {
             // Endpoint di TEST (ambiente SDI test)
             test: {
               trasmissione: `${baseUrl}/api/sdi/test/trasmissione`,
               ricezione: `${baseUrl}/api/sdi/test/ricezione`,
             },
             // Endpoint di PRODUZIONE (ambiente SDI produzione)
             production: {
               trasmissione: `${baseUrl}/api/sdi/trasmissione`,
               ricezione: `${baseUrl}/api/sdi/ricezione`,
             },
      info: `${baseUrl}/api/sdi/test`,
    },
           instructions: {
             registrazione_sdi_test: 'Registra gli endpoint TEST sul portale SDI test (https://www.fatture.gov.it/):\n  - Trasmissione: /api/sdi/test/trasmissione\n  - Ricezione: /api/sdi/test/ricezione (gestisce sia fatture che notifiche)',
             registrazione_sdi_produzione: 'Registra gli endpoint PRODUZIONE sul portale SDI produzione (https://www.fatture.gov.it/):\n  - Trasmissione: /api/sdi/trasmissione\n  - Ricezione: /api/sdi/ricezione (gestisce sia fatture che notifiche)',
             ambiente_test: 'Usa prima l\'ambiente di test SDI per verificare',
             formato: 'SDI invierà XML fatture/notifiche via POST all\'endpoint di ricezione',
             note: 'L\'endpoint di ricezione gestisce automaticamente sia fatture che notifiche. Gli endpoint di TEST e PRODUZIONE sono separati e devono essere registrati separatamente sul portale SDI',
           },
    environment: {
      node_env: process.env.NODE_ENV,
      supabase_configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    },
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'Test POST ricevuto',
      received_data: body,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 400 });
  }
}

