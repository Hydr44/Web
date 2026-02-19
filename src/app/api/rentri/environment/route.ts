/**
 * API Route: Gestione Ambiente RENTRI
 * GET /api/rentri/environment - Recupera ambiente corrente
 * PUT /api/rentri/environment - Cambia ambiente (demo/prod)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { handleCors, corsHeaders } from "@/lib/cors";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

/**
 * GET /api/rentri/environment?org_id=...
 * Recupera l'ambiente RENTRI corrente per l'organizzazione
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  
  try {
    const orgId = request.nextUrl.searchParams.get("org_id");
    
    if (!orgId) {
      return NextResponse.json(
        { error: "org_id mancante" },
        { status: 400, headers }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Recupera impostazioni org
    const { data: settings } = await supabase
      .from("org_settings")
      .select("rentri_environment")
      .eq("org_id", orgId)
      .maybeSingle();
    
    const environment = settings?.rentri_environment || "demo";
    
    // Recupera info certificato per l'ambiente corrente
    const { data: cert } = await supabase
      .from("rentri_org_certificates")
      .select("id, cf_operatore, environment, is_active, is_default, expires_at, issued_at, ragione_sociale")
      .eq("org_id", orgId)
      .eq("environment", environment)
      .eq("is_active", true)
      .order("is_default", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    // Controlla anche se esiste un certificato per l'altro ambiente
    const otherEnv = environment === "demo" ? "prod" : "demo";
    const { data: otherCert } = await supabase
      .from("rentri_org_certificates")
      .select("id, environment, is_active, expires_at")
      .eq("org_id", orgId)
      .eq("environment", otherEnv)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    
    return NextResponse.json(
      {
        environment,
        certificato_attivo: cert ? {
          id: cert.id,
          cf_operatore: cert.cf_operatore,
          ragione_sociale: cert.ragione_sociale,
          scadenza: cert.expires_at,
          valido: new Date(cert.expires_at) > new Date()
        } : null,
        altro_ambiente_disponibile: otherEnv,
        altro_ambiente_ha_certificato: !!otherCert,
        gateway: environment === "prod"
          ? (process.env.RENTRI_GATEWAY_URL_PROD || "https://rentri.rescuemanager.eu")
          : (process.env.RENTRI_GATEWAY_URL || "https://rentri-test.rescuemanager.eu"),
        api_upstream: environment === "prod"
          ? "api.rentri.gov.it"
          : "demoapi.rentri.gov.it"
      },
      { status: 200, headers }
    );
    
  } catch (error: any) {
    console.error("[RENTRI-ENV] Errore:", error);
    return NextResponse.json(
      { error: "Errore interno", details: error.message },
      { status: 500, headers }
    );
  }
}

/**
 * PUT /api/rentri/environment
 * Cambia l'ambiente RENTRI per l'organizzazione
 * Body: { org_id, environment: "demo" | "prod" }
 */
export async function PUT(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  
  try {
    const { org_id, environment } = await request.json();
    
    if (!org_id) {
      return NextResponse.json(
        { error: "org_id mancante" },
        { status: 400, headers }
      );
    }
    
    if (!environment || !["demo", "prod"].includes(environment)) {
      return NextResponse.json(
        { error: "environment deve essere 'demo' o 'prod'" },
        { status: 400, headers }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verifica che esista un certificato attivo per l'ambiente richiesto
    const { data: cert } = await supabase
      .from("rentri_org_certificates")
      .select("id, cf_operatore, expires_at, is_active")
      .eq("org_id", org_id)
      .eq("environment", environment)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    
    if (!cert) {
      return NextResponse.json(
        { 
          error: `Nessun certificato attivo trovato per l'ambiente ${environment.toUpperCase()}. Carica un certificato ${environment === 'prod' ? 'di PRODUZIONE' : 'DEMO'} prima di cambiare ambiente.`
        },
        { status: 400, headers }
      );
    }
    
    // Verifica scadenza
    if (new Date(cert.expires_at) < new Date()) {
      return NextResponse.json(
        { error: `Il certificato per l'ambiente ${environment.toUpperCase()} è scaduto.` },
        { status: 400, headers }
      );
    }
    
    // Upsert impostazione ambiente in org_settings
    const { error: upsertError } = await supabase
      .from("org_settings")
      .upsert(
        {
          org_id,
          rentri_environment: environment,
          updated_at: new Date().toISOString()
        },
        { onConflict: "org_id" }
      );
    
    if (upsertError) {
      console.error("[RENTRI-ENV] Errore upsert:", upsertError);
      return NextResponse.json(
        { error: "Errore salvataggio impostazione", details: upsertError.message },
        { status: 500, headers }
      );
    }
    
    console.log(`[RENTRI-ENV] Ambiente cambiato a ${environment} per org ${org_id}`);
    
    return NextResponse.json(
      {
        success: true,
        environment,
        message: `Ambiente RENTRI cambiato a ${environment.toUpperCase()}`,
        gateway: environment === "prod"
          ? (process.env.RENTRI_GATEWAY_URL_PROD || "https://rentri.rescuemanager.eu")
          : (process.env.RENTRI_GATEWAY_URL || "https://rentri-test.rescuemanager.eu")
      },
      { status: 200, headers }
    );
    
  } catch (error: any) {
    console.error("[RENTRI-ENV] Errore:", error);
    return NextResponse.json(
      { error: "Errore interno", details: error.message },
      { status: 500, headers }
    );
  }
}
