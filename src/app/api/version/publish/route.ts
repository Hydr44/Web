import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

/**
 * POST /api/version/publish
 * Pubblica una nuova versione dell'app
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { version, download_url, force_update, notes } = body;

    if (!version || !download_url) {
      return NextResponse.json(
        { error: "version e download_url sono obbligatori" },
        { status: 400 }
      );
    }

    console.log('[Version Publish] Publishing version:', version);

    // Inserisci nuova versione
    const { error: insertError } = await supabaseAdmin
      .from('app_versions')
      .insert({
        version: version,
        min_required: version, // La nuova versione è sempre la minima richiesta
        force_update: force_update || false,
        notes: notes || null,
        download_url: download_url
      });

    if (insertError) {
      console.error('[Version Publish] Insert error:', insertError);
      return NextResponse.json(
        { error: "Errore nell'inserimento versione" },
        { status: 500 }
      );
    }

    // Log informazioni aggiuntive
    console.log('[Version Publish] Version published successfully');
    console.log('- Version:', version);
    console.log('- Force update:', force_update);
    console.log('- Download URL:', download_url);
    console.log('- Notes:', notes);

    return NextResponse.json({
      success: true,
      version: version,
      message: `Versione ${version} pubblicata con successo`
    });

  } catch (error) {
    console.error('[Version Publish] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

