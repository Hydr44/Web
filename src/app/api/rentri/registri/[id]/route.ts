/**
 * API Route: Gestione Singolo Registro RENTRI
 * GET /api/rentri/registri/[id] - Dettaglio registro
 * PUT /api/rentri/registri/[id] - Aggiorna registro
 * DELETE /api/rentri/registri/[id] - Elimina registro
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
 * GET /api/rentri/registri/[id]
 * Recupera dettaglio registro
 * Query params: org_id (obbligatorio per sicurezza)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const orgId = searchParams.get('org_id');
    
    if (!orgId) {
      return NextResponse.json(
        { error: "org_id mancante" },
        { status: 400, headers }
      );
    }
    
    if (!id) {
      return NextResponse.json(
        { error: "id registro mancante" },
        { status: 400, headers }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: registro, error } = await supabase
      .from("rentri_registri")
      .select("*")
      .eq("id", id)
      .eq("org_id", orgId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: "Registro non trovato" },
          { status: 404, headers }
        );
      }
      
      console.error("[RENTRI-REGISTRI] Errore lettura registro:", error);
      return NextResponse.json(
        { error: "Errore lettura registro", details: error.message },
        { status: 500, headers }
      );
    }
    
    return NextResponse.json(
      {
        success: true,
        registro: registro
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
 * PUT /api/rentri/registri/[id]
 * Aggiorna registro in DB locale
 * Se registro è già sincronizzato con RENTRI (ha rentri_id), 
 * aggiorna solo locale (non sincronizza con RENTRI automaticamente)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  
  try {
    const { id } = params;
    const body = await request.json();
    const { org_id, ...updateData } = body;
    
    if (!org_id) {
      return NextResponse.json(
        { error: "org_id mancante" },
        { status: 400, headers }
      );
    }
    
    if (!id) {
      return NextResponse.json(
        { error: "id registro mancante" },
        { status: 400, headers }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verifica che il registro esista e appartenga all'org
    const { data: existing, error: checkError } = await supabase
      .from("rentri_registri")
      .select("id, sync_status")
      .eq("id", id)
      .eq("org_id", org_id)
      .single();
    
    if (checkError || !existing) {
      return NextResponse.json(
        { error: "Registro non trovato" },
        { status: 404, headers }
      );
    }
    
    // Prepara dati da aggiornare (escludi campi protetti)
    const allowedFields = [
      'numero_registro',
      'stato',
      'unita_locale',
      'autorizzazione',
      'attivita',
      'attivita_rec_smalt',
      'note',
      'anno',
      'tipo'
    ];
    
    const updatePayload: any = {
      updated_at: new Date().toISOString()
    };
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updatePayload[field] = updateData[field];
      }
    }
    
    // Aggiorna registro
    const { data: registro, error } = await supabase
      .from("rentri_registri")
      .update(updatePayload)
      .eq("id", id)
      .eq("org_id", org_id)
      .select()
      .single();
    
    if (error) {
      console.error("[RENTRI-REGISTRI] Errore aggiornamento registro:", error);
      return NextResponse.json(
        { error: "Errore aggiornamento registro", details: error.message },
        { status: 500, headers }
      );
    }
    
    return NextResponse.json(
      {
        success: true,
        registro: registro,
        message: "Registro aggiornato in locale"
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
 * DELETE /api/rentri/registri/[id]
 * Elimina registro da DB locale
 * Solo se non è ancora sincronizzato con RENTRI (sync_status !== 'synced')
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const orgId = searchParams.get('org_id');
    
    if (!orgId) {
      return NextResponse.json(
        { error: "org_id mancante" },
        { status: 400, headers }
      );
    }
    
    if (!id) {
      return NextResponse.json(
        { error: "id registro mancante" },
        { status: 400, headers }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verifica che il registro esista e non sia sincronizzato
    const { data: existing, error: checkError } = await supabase
      .from("rentri_registri")
      .select("id, sync_status, rentri_id")
      .eq("id", id)
      .eq("org_id", orgId)
      .single();
    
    if (checkError || !existing) {
      return NextResponse.json(
        { error: "Registro non trovato" },
        { status: 404, headers }
      );
    }
    
    // Non eliminare se già sincronizzato con RENTRI
    if (existing.sync_status === 'synced' || existing.rentri_id) {
      return NextResponse.json(
        { 
          error: "Impossibile eliminare registro già sincronizzato con RENTRI",
          sync_status: existing.sync_status,
          rentri_id: existing.rentri_id
        },
        { status: 400, headers }
      );
    }
    
    // Elimina registro
    const { error: deleteError } = await supabase
      .from("rentri_registri")
      .delete()
      .eq("id", id)
      .eq("org_id", orgId);
    
    if (deleteError) {
      console.error("[RENTRI-REGISTRI] Errore eliminazione registro:", deleteError);
      return NextResponse.json(
        { error: "Errore eliminazione registro", details: deleteError.message },
        { status: 500, headers }
      );
    }
    
    return NextResponse.json(
      {
        success: true,
        message: "Registro eliminato"
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

