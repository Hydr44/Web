/**
 * API Route: Gestione Registri RENTRI
 * GET /api/rentri/registri - Lista registri
 * POST /api/rentri/registri - Crea registro (locale)
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
 * GET /api/rentri/registri
 * Lista registri con filtri opzionali
 * Query params: org_id (obbligatorio), anno, stato, tipo
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const orgId = searchParams.get('org_id');
    
    if (!orgId) {
      return NextResponse.json(
        { error: "org_id mancante" },
        { status: 400, headers }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Costruisci query con filtri
    let query = supabase
      .from("rentri_registri")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });
    
    // Filtri opzionali
    const anno = searchParams.get('anno');
    if (anno) {
      query = query.eq('anno', parseInt(anno, 10));
    }
    
    const stato = searchParams.get('stato');
    if (stato) {
      query = query.eq('stato', stato);
    }
    
    const tipo = searchParams.get('tipo');
    if (tipo) {
      query = query.eq('tipo', tipo);
    }
    
    const { data: registri, error } = await query;
    
    if (error) {
      console.error("[RENTRI-REGISTRI] Errore lettura registri:", error);
      return NextResponse.json(
        { error: "Errore lettura registri", details: error.message },
        { status: 500, headers }
      );
    }
    
    return NextResponse.json(
      {
        success: true,
        registri: registri || [],
        count: registri?.length || 0
      },
      { status: 200, headers }
    );
    
  } catch (error: any) {
    console.error("[RENTRI-REGISTRI] Errore:", error);
    return NextResponse.json(
      { error: "Errore interno", details: error.message },
      { status: 500, headers }
    );
  }
}

/**
 * POST /api/rentri/registri
 * Crea nuovo registro in DB locale (non sincronizza con RENTRI)
 * Per sincronizzazione usare: POST /api/rentri/registri/create
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  
  try {
    const body = await request.json();
    const { org_id, ...registroData } = body;
    
    if (!org_id) {
      return NextResponse.json(
        { error: "org_id mancante" },
        { status: 400, headers }
      );
    }
    
    // Validazione campi obbligatori
    if (!registroData.anno) {
      return NextResponse.json(
        { error: "anno mancante" },
        { status: 400, headers }
      );
    }
    
    if (!registroData.tipo) {
      return NextResponse.json(
        { error: "tipo mancante" },
        { status: 400, headers }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Crea registro in DB locale
    const { data: registro, error } = await supabase
      .from("rentri_registri")
      .insert({
        org_id,
        anno: registroData.anno,
        tipo: registroData.tipo,
        numero_registro: registroData.numero_registro || null,
        stato: registroData.stato || 'bozza',
        unita_locale: registroData.unita_locale || null,
        autorizzazione: registroData.autorizzazione || null,
        attivita: registroData.attivita || null,
        attivita_rec_smalt: registroData.attivita_rec_smalt || null,
        note: registroData.note || null,
        sync_status: 'pending', // Non ancora sincronizzato con RENTRI
        rentri_id: null,
      })
      .select()
      .single();
    
    if (error) {
      console.error("[RENTRI-REGISTRI] Errore creazione registro:", error);
      return NextResponse.json(
        { error: "Errore creazione registro", details: error.message },
        { status: 500, headers }
      );
    }
    
    return NextResponse.json(
      {
        success: true,
        registro: registro,
        message: "Registro creato in locale (non ancora sincronizzato con RENTRI)"
      },
      { status: 201, headers }
    );
    
  } catch (error: any) {
    console.error("[RENTRI-REGISTRI] Errore:", error);
    return NextResponse.json(
      { error: "Errore interno", details: error.message },
      { status: 500, headers }
    );
  }
}

