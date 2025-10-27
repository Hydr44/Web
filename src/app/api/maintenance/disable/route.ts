import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

/**
 * POST /api/maintenance/disable
 * Disattiva modalità manutenzione (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const { error } = await supabaseAdmin
      .from('maintenance_mode')
      .update({
        is_active: false,
        message: null,
        started_at: null
      })
      .eq('id', (await supabaseAdmin.from('maintenance_mode').select('id').maybeSingle()).data?.id);

    if (error) {
      console.error('Error disabling maintenance:', error);
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

