/**
 * API Route: Gestione MUD singolo
 * GET /api/rentri/mud/[id] - Dettaglio MUD
 * PUT /api/rentri/mud/[id] - Aggiorna MUD
 * DELETE /api/rentri/mud/[id] - Elimina MUD
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
 * GET /api/rentri/mud/[id]
 * Dettaglio MUD
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    const { id: mudId } = params;
    const searchParams = request.nextUrl.searchParams;
    const org_id = searchParams.get('org_id');

    if (!org_id) {
      return NextResponse.json(
        { error: "org_id richiesto" },
        { status: 400, headers }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: mud, error } = await supabase
      .from("rentri_mud")
      .select("*")
      .eq("id", mudId)
      .eq("org_id", org_id)
      .single();

    if (error || !mud) {
      return NextResponse.json(
        { error: "MUD non trovato" },
        { status: 404, headers }
      );
    }

    return NextResponse.json(
      {
        success: true,
        mud
      },
      { status: 200, headers }
    );

  } catch (error: any) {
    console.error("[RENTRI-MUD] Errore:", error);
    return NextResponse.json(
      { error: "Errore interno", details: error.message },
      { status: 500, headers }
    );
  }
}

/**
 * PUT /api/rentri/mud/[id]
 * Aggiorna MUD
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    const { id: mudId } = params;
    const body = await request.json();
    const { org_id, stato, note } = body;

    if (!org_id) {
      return NextResponse.json(
        { error: "org_id richiesto" },
        { status: 400, headers }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const updateData: any = {};
    if (stato) updateData.stato = stato;
    if (note !== undefined) updateData.note = note;

    const { data: mud, error } = await supabase
      .from("rentri_mud")
      .update(updateData)
      .eq("id", mudId)
      .eq("org_id", org_id)
      .select()
      .single();

    if (error) {
      console.error("[RENTRI-MUD] Errore aggiornamento:", error);
      return NextResponse.json(
        { error: "Errore aggiornamento MUD", details: error.message },
        { status: 500, headers }
      );
    }

    return NextResponse.json(
      {
        success: true,
        mud
      },
      { status: 200, headers }
    );

  } catch (error: any) {
    console.error("[RENTRI-MUD] Errore:", error);
    return NextResponse.json(
      { error: "Errore interno", details: error.message },
      { status: 500, headers }
    );
  }
}

