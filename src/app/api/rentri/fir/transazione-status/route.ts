/**
 * API Endpoint: Verifica stato elaborazione transazione RENTRI
 * 
 * GET /api/rentri/fir/transazione-status?transazione_id={id}
 * 
 * Pattern AgID: NONBLOCK_PULL_REST
 * - Status 200: In elaborazione
 * - Status 303: Completato, header Location con URL result
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateRentriJWTDynamic } from '@/lib/rentri/jwt-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const searchParams = request.nextUrl.searchParams;
    const transazione_id = searchParams.get('transazione_id');
    const org_id = searchParams.get('org_id');
    
    if (!transazione_id || !org_id) {
      return NextResponse.json(
        { error: 'transazione_id e org_id richiesti' },
        { status: 400, headers }
      );
    }
    
    // 1. Recupera certificato
    const { data: cert, error: certError } = await supabase
      .from('rentri_org_certificates')
      .select('*')
      .eq('org_id', org_id)
      .eq('is_active', true)
      .single();
      
    if (certError || !cert) {
      return NextResponse.json(
        { error: 'Certificato RENTRI non trovato' },
        { status: 404, headers }
      );
    }
    
    // 2. Genera JWT
    const jwt = await generateRentriJWTDynamic({
      issuer: cert.cf_operatore,
      certificatePem: cert.certificate_pem,
      privateKeyPem: cert.private_key_pem,
      audience: cert.environment === 'demo' ? 'rentrigov.demo.api' : 'rentrigov.api'
    });
    
    // 3. Chiama RENTRI per verificare status
    const baseUrl = cert.environment === 'demo'
      ? 'https://demoapi.rentri.gov.it'
      : 'https://api.rentri.gov.it';
      
    const statusUrl = `${baseUrl}/formulari/v1.0/${transazione_id}/status`;
    
    const statusResponse = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Accept': 'application/json'
      },
      redirect: 'manual' // Non seguire redirect automaticamente
    });
    
    console.log('[RENTRI-STATUS] Status code:', statusResponse.status);
    
    // Status 200 = In elaborazione
    if (statusResponse.status === 200) {
      return NextResponse.json({
        status: 'in_elaborazione',
        message: 'Transazione in corso di elaborazione'
      }, { headers });
    }
    
    // Status 303 = Completato, recupera result
    if (statusResponse.status === 303) {
      const locationHeader = statusResponse.headers.get('Location');
      console.log('[RENTRI-STATUS] Location header:', locationHeader);
      
      return NextResponse.json({
        status: 'completato',
        message: 'Elaborazione completata',
        result_url: locationHeader
      }, { headers });
    }
    
    // Altri status
    const errorText = await statusResponse.text();
    return NextResponse.json({
      error: 'Status imprevisto',
      status_code: statusResponse.status,
      details: errorText
    }, { status: statusResponse.status, headers });
    
  } catch (error: any) {
    console.error('[RENTRI-STATUS] Errore:', error);
    return NextResponse.json(
      { error: error.message || 'Errore verifica status transazione' },
      { status: 500, headers }
    );
  }
}

