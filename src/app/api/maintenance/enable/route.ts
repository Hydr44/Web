import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

/**
 * POST /api/maintenance/enable
 * Attiva modalità manutenzione (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    const { error } = await supabaseAdmin
      .from('maintenance_mode')
      .update({
        is_active: true,
        message: message || null,
        started_at: new Date().toISOString()
      })
      .eq('id', (await supabaseAdmin.from('maintenance_mode').select('id').maybeSingle()).data?.id);

    if (error) {
      console.error('Error enabling maintenance:', error);
      return NextResponse.json({ error: 'Failed to enable maintenance' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Maintenance enable error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

