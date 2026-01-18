/**
 * API Route: Scarica PDF FIR da RENTRI
 * GET /api/rentri/fir/pdf?fir_id={id}
 * 
 * Tenta di scaricare il PDF ufficiale del FIR da RENTRI.
 * Se non disponibile, ritorna errore (il frontend userà PDF locale come fallback)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateRentriJWTDynamic } from "@/lib/rentri/jwt-dynamic";
import { handleCors, corsHeaders } from "@/lib/cors";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const fir_id = searchParams.get('fir_id');
    
    if (!fir_id) {
      return NextResponse.json(
        { error: 'fir_id richiesto' },
        { status: 400, headers }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 1. Carica FIR dal database
    const { data: fir, error: firError } = await supabase
      .from('rentri_formulari')
      .select('*')
      .eq('id', fir_id)
      .single();
    
    if (firError || !fir) {
      return NextResponse.json(
        { error: 'FIR non trovato' },
        { status: 404, headers }
      );
    }
    
    // 2. Verifica se ha rentri_numero o rentri_id (trasmesso a RENTRI)
    const rentriId = fir.rentri_id || fir.rentri_numero;
    
    if (!rentriId) {
      return NextResponse.json(
        { error: 'FIR non ancora trasmesso a RENTRI. Usa PDF locale.' },
        { status: 400, headers }
      );
    }
    
    // 3. Carica certificato
    const { data: cert, error: certError } = await supabase
      .from('rentri_org_certificates')
      .select('*')
      .eq('org_id', fir.org_id)
      .eq('environment', fir.environment || 'demo')
      .eq('is_active', true)
      .eq('is_default', true)
      .maybeSingle();
    
    if (certError || !cert) {
      return NextResponse.json(
        { error: 'Certificato RENTRI non trovato' },
        { status: 404, headers }
      );
    }
    
    // 4. Genera JWT
    const jwt = await generateRentriJWTDynamic({
      issuer: cert.cf_operatore,
      certificatePem: cert.certificate_pem,
      privateKeyPem: cert.private_key_pem,
      audience: cert.environment === 'demo' ? 'rentrigov.demo.api' : 'rentrigov.api'
    });
    
    // 5. Chiama RENTRI per recuperare PDF
    // Nota: L'endpoint esatto potrebbe variare. Proviamo diverse varianti comuni
    const baseUrl = cert.environment === 'demo'
      ? 'https://demoapi.rentri.gov.it'
      : 'https://api.rentri.gov.it';
    
    // Tentativo 1: Con identificativo RENTRI
    let pdfUrl = `${baseUrl}/formulari/v1.0/${rentriId}/pdf`;
    let pdfResponse = await fetch(pdfUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Accept': 'application/pdf'
      }
    });
    
    // Tentativo 2: Se non funziona, proviamo con numero_fir
    if (!pdfResponse.ok && fir.rentri_numero && fir.rentri_numero !== rentriId) {
      pdfUrl = `${baseUrl}/formulari/v1.0/${fir.rentri_numero}/pdf`;
      pdfResponse = await fetch(pdfUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Accept': 'application/pdf'
        }
      });
    }
    
    // Tentativo 3: Con transazione_id se disponibile
    if (!pdfResponse.ok && fir.rentri_transazione_id) {
      pdfUrl = `${baseUrl}/formulari/v1.0/${fir.rentri_transazione_id}/result/pdf`;
      pdfResponse = await fetch(pdfUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Accept': 'application/pdf'
        }
      });
    }
    
    if (!pdfResponse.ok) {
      console.warn('[RENTRI-PDF] Endpoint PDF non disponibile o FIR non trovato su RENTRI:', {
        status: pdfResponse.status,
        statusText: pdfResponse.statusText,
        rentriId,
        rentri_numero: fir.rentri_numero,
        transazione_id: fir.rentri_transazione_id
      });
      
      return NextResponse.json(
        { 
          error: 'PDF non disponibile da RENTRI. Usa PDF locale come fallback.',
          details: `Status: ${pdfResponse.status}, Tentativi: identificativo, numero_fir, transazione_id`
        },
        { status: 404, headers }
      );
    }
    
    // 6. Ottieni PDF come blob
    const pdfBlob = await pdfResponse.blob();
    const arrayBuffer = await pdfBlob.arrayBuffer();
    
    // 7. Ritorna PDF
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="fir-${fir.rentri_numero || fir.numero_fir || 'rentri'}.pdf"`
      }
    });
    
  } catch (error: any) {
    console.error('[RENTRI-PDF] Errore:', error);
    return NextResponse.json(
      { error: 'Errore interno server', details: error.message },
      { status: 500, headers }
    );
  }
}
