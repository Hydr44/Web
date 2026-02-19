import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

/**
 * POST /api/maintenance/disable
 * Disattiva modalità manutenzione (admin only — richiede ADMIN_SECRET_KEY)
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check: richiede header x-admin-secret
    const secret = request.headers.get("x-admin-secret");
    if (!secret || secret !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: "Non autorizzato" },
        { status: 401 }
      );
    }

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('maintenance_mode')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching maintenance record:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch maintenance record' }, { status: 500 });
    }

    if (!existing) {
      return NextResponse.json({ success: true });
    }

    const { error } = await supabaseAdmin
      .from('maintenance_mode')
      .update({
        is_active: false,
        message: null,
        started_at: null
      })
      .eq('id', existing.id);

    if (error) {
      console.error('Error updating maintenance:', error);
      return NextResponse.json({ error: 'Failed to disable maintenance' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Maintenance disable error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
