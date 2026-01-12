/**
 * API Route: CRUD Movimenti Registro (Locale)
 * GET /api/rentri/registri/[id]/movimenti-crud - Lista movimenti
 * POST /api/rentri/registri/[id]/movimenti-crud - Crea movimento locale
 * 
 * Nota: Per trasmettere a RENTRI usare: POST /api/rentri/registri/[id]/movimenti
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
 * GET /api/rentri/registri/[id]/movimenti-crud
 * Lista movimenti di un registro con filtri
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  
  try {
    const { id: registroId } = params;
    const searchParams = request.nextUrl.searchParams;
    const orgId = searchParams.get('org_id');
    
    if (!orgId) {
      return NextResponse.json(
        { error: "org_id mancante" },
        { status: 400, headers }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verifica che il registro esista e appartenga all'org
    const { data: registro, error: registroError } = await supabase
      .from("rentri_registri")
      .select("id")
      .eq("id", registroId)
      .eq("org_id", orgId)
      .single();
    
    if (registroError || !registro) {
      return NextResponse.json(
        { error: "Registro non trovato" },
        { status: 404, headers }
      );
    }
    
    // Costruisci query movimenti con filtri
    let query = supabase
      .from("rentri_movimenti")
      .select("*")
      .eq("registro_id", registroId)
      .eq("org_id", orgId)
      .order("data_operazione", { ascending: false })
      .order("progressivo", { ascending: false });
    
    // Filtri opzionali
    const dataFrom = searchParams.get('data_from');
    if (dataFrom) {
      query = query.gte('data_operazione', dataFrom);
    }
    
    const dataTo = searchParams.get('data_to');
    if (dataTo) {
      query = query.lte('data_operazione', dataTo);
    }
    
    const tipo = searchParams.get('tipo');
    if (tipo) {
      query = query.eq('tipo_operazione', tipo);
    }
    
    const codiceEER = searchParams.get('codice_eer');
    if (codiceEER) {
      query = query.eq('codice_eer', codiceEER);
    }
    
    const { data: movimenti, error } = await query;
    
    if (error) {
      console.error("[RENTRI-MOVIMENTI] Errore lettura movimenti:", error);
      return NextResponse.json(
        { error: "Errore lettura movimenti", details: error.message },
        { status: 500, headers }
      );
    }
    
    return NextResponse.json(
      {
        success: true,
        movimenti: movimenti || [],
        count: movimenti?.length || 0
      },
      { status: 200, headers }
    );
    
  } catch (error: any) {
    console.error("[RENTRI-MOVIMENTI] Errore:", error);
    return NextResponse.json(
      { error: "Errore interno", details: error.message },
      { status: 500, headers }
    );
  }
}

/**
 * POST /api/rentri/registri/[id]/movimenti-crud
 * Crea movimento in DB locale (non sincronizza con RENTRI)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  
  try {
    const { id: registroId } = params;
    const body = await request.json();
    const { org_id, ...movimentoData } = body;
    
    if (!org_id) {
      return NextResponse.json(
        { error: "org_id mancante" },
        { status: 400, headers }
      );
    }
    
    // Validazione campi obbligatori
    if (!movimentoData.tipo_operazione) {
      return NextResponse.json(
        { error: "tipo_operazione mancante" },
        { status: 400, headers }
      );
    }
    
    if (!movimentoData.data_operazione) {
      return NextResponse.json(
        { error: "data_operazione mancante" },
        { status: 400, headers }
      );
    }
    
    if (!movimentoData.codice_eer) {
      return NextResponse.json(
        { error: "codice_eer mancante" },
        { status: 400, headers }
      );
    }
    
    if (!movimentoData.quantita) {
      return NextResponse.json(
        { error: "quantita mancante" },
        { status: 400, headers }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verifica che il registro esista e appartenga all'org
    const { data: registro, error: registroError } = await supabase
      .from("rentri_registri")
      .select("id, anno")
      .eq("id", registroId)
      .eq("org_id", org_id)
      .single();
    
    if (registroError || !registro) {
      return NextResponse.json(
        { error: "Registro non trovato" },
        { status: 404, headers }
      );
    }
    
    // Calcola progressivo automaticamente (max progressivo + 1 per questo registro/anno)
    const { data: maxMovimento, error: maxError } = await supabase
      .from("rentri_movimenti")
      .select("progressivo")
      .eq("registro_id", registroId)
      .eq("anno", movimentoData.anno || registro.anno || new Date().getFullYear())
      .order("progressivo", { ascending: false })
      .limit(1)
      .single();
    
    const progressivo = maxMovimento?.progressivo ? maxMovimento.progressivo + 1 : 1;
    const anno = movimentoData.anno || registro.anno || new Date().getFullYear();
    
    // Data/ora registrazione (UTC)
    const dataOraRegistrazione = movimentoData.data_ora_registrazione || new Date().toISOString();
    
    // Crea movimento in DB locale
    const { data: movimento, error } = await supabase
      .from("rentri_movimenti")
      .insert({
        org_id,
        registro_id: registroId,
        anno,
        progressivo,
        data_ora_registrazione: dataOraRegistrazione,
        causale_operazione: movimentoData.causale_operazione || null,
        tipo_operazione: movimentoData.tipo_operazione,
        data_operazione: movimentoData.data_operazione,
        numero_riga: movimentoData.numero_riga || null,
        codice_eer: movimentoData.codice_eer,
        descrizione_eer: movimentoData.descrizione_eer || null,
        quantita: movimentoData.quantita,
        unita_misura: movimentoData.unita_misura || 'kg',
        provenienza: movimentoData.provenienza || null,
        caratteristiche_pericolo: movimentoData.caratteristiche_pericolo || null,
        numero_fir: movimentoData.numero_fir || null,
        data_inizio_trasporto: movimentoData.data_inizio_trasporto || null,
        data_fine_trasporto: movimentoData.data_fine_trasporto || null,
        peso_verificato_destino: movimentoData.peso_verificato_destino || null,
        provenienza_destinazione: movimentoData.provenienza_destinazione || null,
        riferimento_fir: movimentoData.riferimento_fir || null,
        annotazioni: movimentoData.annotazioni || null,
        note: movimentoData.note || null,
        sync_status: 'pending', // Non ancora sincronizzato con RENTRI
        rentri_id: null,
      })
      .select()
      .single();
    
    if (error) {
      console.error("[RENTRI-MOVIMENTI] Errore creazione movimento:", error);
      return NextResponse.json(
        { error: "Errore creazione movimento", details: error.message },
        { status: 500, headers }
      );
    }
    
    return NextResponse.json(
      {
        success: true,
        movimento: movimento,
        message: "Movimento creato in locale (non ancora sincronizzato con RENTRI)"
      },
      { status: 201, headers }
    );
    
  } catch (error: any) {
    console.error("[RENTRI-MOVIMENTI] Errore:", error);
    return NextResponse.json(
      { error: "Errore interno", details: error.message },
      { status: 500, headers }
    );
  }
}

