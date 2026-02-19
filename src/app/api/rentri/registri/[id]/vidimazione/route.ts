/**
 * API Route: Download Vidimazione Registro RENTRI
 * GET /api/rentri/registri/[id]/vidimazione
 * 
 * Scarica il file XML della vidimazione virtuale di un registro
 * Endpoint RENTRI: GET /anagrafiche/v1.0/registri/{identificativo}/xml
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateRentriJWTDynamic } from "@/lib/rentri/jwt-dynamic";
import { handleCors, corsHeaders } from "@/lib/cors";
import { getActiveCert, getAudience, getGatewayUrl } from "@/lib/rentri/cert-helper";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  
  try {
    const registroId = params.id;
    
    if (!registroId) {
      return NextResponse.json(
        { error: "registro_id mancante" },
        { status: 400, headers }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const orgId = searchParams.get("org_id");
    const environment = searchParams.get("environment") || undefined;
    
    if (!orgId) {
      return NextResponse.json(
        { error: "org_id richiesto come query param" },
        { status: 400, headers }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 1. Recupera registro dal DB
    const { data: registro, error: registroError } = await supabase
      .from("rentri_registri")
      .select("id, rentri_id, org_id, environment")
      .eq("id", registroId)
      .eq("org_id", orgId)
      .single();
    
    if (registroError || !registro) {
      return NextResponse.json(
        { error: "Registro non trovato" },
        { status: 404, headers }
      );
    }
    
    if (!registro.rentri_id) {
      return NextResponse.json(
        { error: "Registro non ha identificativo RENTRI (deve essere creato su RENTRI prima)" },
        { status: 400, headers }
      );
    }
    
    // 2. Recupera certificato RENTRI (ambiente dinamico)
    const { cert, error: certErr } = await getActiveCert(orgId, environment || registro.environment);
    
    if (certErr || !cert) {
      return NextResponse.json(
        { error: certErr || "Certificato RENTRI non trovato" },
        { status: 404, headers }
      );
    }
    
    const RENTRI_BASE_URL = getGatewayUrl(cert.environment);
    
    // 3. Genera JWT per autenticazione
    const jwtAuth = await generateRentriJWTDynamic({
      issuer: cert.cf_operatore,
      certificatePem: cert.certificate_pem,
      privateKeyPem: cert.private_key_pem,
      audience: getAudience(cert.environment)
    });
    
    // 4. GET vidimazione registro da RENTRI
    const rentriUrl = `${RENTRI_BASE_URL}/anagrafiche/v1.0/registri/${registro.rentri_id}/xml`;
    
    console.log(`[RENTRI-VIDIMAZIONE] Download vidimazione registro ${registro.rentri_id}...`);
    
    const rentriResponse = await fetch(rentriUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${jwtAuth}`,
        "Accept": "application/xml, application/json"
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(30000)
    });
    
    if (!rentriResponse.ok) {
      const errorText = await rentriResponse.text().catch(() => "");
      console.error(`[RENTRI-VIDIMAZIONE] Errore RENTRI (${rentriResponse.status}):`, errorText);
      return NextResponse.json(
        {
          error: "Errore download vidimazione da RENTRI",
          status: rentriResponse.status,
          details: errorText
        },
        { status: rentriResponse.status, headers }
      );
    }
    
    const contentType = rentriResponse.headers.get('content-type') || '';
    const responseBody = await rentriResponse.text();
    
    // RENTRI restituisce JSON con { content: base64, nomeFile: string }
    // oppure direttamente XML
    if (contentType.includes('application/json')) {
      try {
        const jsonResponse = JSON.parse(responseBody);
        const xmlContent = jsonResponse.content
          ? Buffer.from(jsonResponse.content, 'base64').toString('utf-8')
          : responseBody;
        const fileName = jsonResponse.nomeFile || `vidimazione_${registro.rentri_id}.xml`;
        
        return new NextResponse(xmlContent, {
          status: 200,
          headers: {
            ...headers,
            'Content-Type': 'application/xml',
            'Content-Disposition': `attachment; filename="${fileName}"`,
          }
        });
      } catch {
        // Se il parsing JSON fallisce, tratta come XML diretto
      }
    }
    
    // Risposta XML diretta
    return new NextResponse(responseBody, {
      status: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="vidimazione_${registro.rentri_id}.xml"`,
      }
    });
    
  } catch (error: any) {
    console.error("[RENTRI-VIDIMAZIONE] Errore:", error);
    return NextResponse.json(
      { error: "Errore interno", details: error.message },
      { status: 500, headers }
    );
  }
}
