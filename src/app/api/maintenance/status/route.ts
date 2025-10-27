import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

/**
 * GET /api/maintenance/status
 * Verifica se l'app è in modalità manutenzione
 */
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('maintenance_mode')
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Error getting maintenance status:', error);
      return NextResponse.json(
        { is_active: false, message: null },
        { status: 200 }
      );
    }

    return NextResponse.json({
      is_active: data?.is_active || false,
      message: data?.message || null,
      started_at: data?.started_at || null
    });

  } catch (error) {
    console.error('Maintenance status error:', error);
    return NextResponse.json(
      { is_active: false, message: null },
      { status: 200 }
    );
  }
}

