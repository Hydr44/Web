import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

/**
 * GET /api/version/history
 * Recupera la cronologia delle versioni pubblicate
 */
export async function GET(request: NextRequest) {
  try {
    // Get all versions, ordered by most recent first
    const { data: versions, error } = await supabaseAdmin
      .from('app_versions')
      .select('version, min_required, force_update, notes, download_url, created_at')
      .order('created_at', { ascending: false })
      .limit(10); // Last 10 versions

    if (error) {
      console.error('[Version History] Error:', error);
      return NextResponse.json(
        { error: "Errore nel recupero cronologia versioni" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      versions: versions || []
    });

  } catch (error) {
    console.error('[Version History] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

