/**
 * API Endpoint: Recupera i blocchi FIR per un operatore
 * 
 * GET /api/rentri/blocchi?org_id={org_id}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateRentriJWTDynamic } from '@/lib/rentri/jwt-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const org_id = searchParams.get('org_id');
    
    if (!org_id) {
      return NextResponse.json(
        { error: 'org_id richiesto' },
        { status: 400, headers: corsHeaders }
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
        { status: 404, headers: corsHeaders }
      );
    }
    
    // 2. Genera JWT
    const jwt = await generateRentriJWTDynamic({
      issuer: cert.cf_operatore,
      certificatePem: cert.certificate_pem,
      privateKeyPem: cert.private_key_pem,
      audience: cert.environment === 'demo' ? 'rentrigov.demo.api' : 'rentrigov.api'
    });
    
    // 3. Chiama API RENTRI per recuperare blocchi
    const baseUrl = cert.environment === 'demo'
      ? 'https://demoapi.rentri.gov.it'
      : 'https://api.rentri.gov.it';
      
    const url = `${baseUrl}/vidimazione-formulari/v1.0?identificativo=${cert.cf_operatore}&num_iscr_sito=${cert.num_iscr_sito}`;
    
    console.log('[RENTRI-BLOCCHI] URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Errore recupero blocchi RENTRI (${response.status}): ${error}`);
    }
    
    const blocchi = await response.json();
    console.log('[RENTRI-BLOCCHI] Blocchi trovati:', blocchi);
    
    return NextResponse.json({
      success: true,
      cf_operatore: cert.cf_operatore,
      num_iscr_sito: cert.num_iscr_sito,
      blocchi: blocchi
    }, { headers: corsHeaders });
    
  } catch (error: any) {
    console.error('[RENTRI-BLOCCHI] Errore:', error);
    return NextResponse.json(
      { error: error.message || 'Errore recupero blocchi FIR' },
      { status: 500, headers: corsHeaders }
    );
  }
}



