/**
 * API Endpoint: Recupera risultato finale transazione RENTRI
 * 
 * GET /api/rentri/fir/transazione-result?transazione_id={id}
 * 
 * Pattern AgID: NONBLOCK_PULL_REST
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateRentriJWTDynamic } from '@/lib/rentri/jwt-dynamic';
import { mapRentriStatoToLocal } from '@/lib/rentri/fir-builder';

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
  const headers = corsHeaders;

  try {
    const searchParams = request.nextUrl.searchParams;
    const transazione_id = searchParams.get('transazione_id');
    const org_id = searchParams.get('org_id');
    const fir_id = searchParams.get('fir_id'); // Per aggiornare il DB locale
    
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
    
    // 3. Chiama RENTRI per recuperare result
    const baseUrl = cert.environment === 'demo'
      ? 'https://demoapi.rentri.gov.it'
      : 'https://api.rentri.gov.it';
      
    const resultUrl = `${baseUrl}/formulari/v1.0/${transazione_id}/result`;
    
    const resultResponse = await fetch(resultUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Accept': 'application/json'
      }
    });
    
    if (!resultResponse.ok) {
      const errorText = await resultResponse.text();
      return NextResponse.json({
        error: 'Errore recupero result',
        status_code: resultResponse.status,
        details: errorText
      }, { status: resultResponse.status, headers });
    }
    
    const result = await resultResponse.json();
    console.log('[RENTRI-RESULT] Risultato finale:', JSON.stringify(result, null, 2));
    
    // 4. Aggiorna DB locale se fir_id è fornito
    if (fir_id && result) {
      // Estrai dati dall'esito (struttura transazione asincrona)
      const numeroFir = result.esito?.numero_fir || result.numero_fir || null;
      const identificativo = result.esito?.identificativo || result.identificativo || result.id || null;
      const stato = result.esito?.stato || result.stato || null;
      
      // Se non c'è stato nella risposta, usa default per FIR appena creato
      const statoRentri = stato || "InserimentoQuantita";
      const statoLocale = mapRentriStatoToLocal(statoRentri);
      
      console.log('[RENTRI-RESULT] Dati estratti per DB:', {
        numeroFir,
        identificativo,
        stato: statoRentri,
        statoLocale
      });
      
      const updatePayload: any = {
        sync_status: 'synced',
        sync_at: new Date().toISOString()
      };
      
      // Aggiorna solo campi disponibili
      if (numeroFir) {
        updatePayload.rentri_numero = numeroFir;
        updatePayload.stato = statoLocale;
      }
      if (identificativo) {
        updatePayload.rentri_id = identificativo;
      }
      if (stato) {
        updatePayload.rentri_stato = stato;
      }
      
      const { error: updateError } = await supabase
        .from('rentri_formulari')
        .update(updatePayload)
        .eq('id', fir_id);
        
      if (updateError) {
        console.error('[RENTRI-RESULT] Errore aggiornamento DB:', updateError);
      } else {
        console.log('[RENTRI-RESULT] DB aggiornato con successo:', updatePayload);
      }
    }
    
    return NextResponse.json({
      success: true,
      result: result
    }, { headers });
    
  } catch (error: any) {
    console.error('[RENTRI-RESULT] Errore:', error);
    return NextResponse.json(
      { error: error.message || 'Errore recupero result transazione' },
      { status: 500, headers }
    );
  }
}

