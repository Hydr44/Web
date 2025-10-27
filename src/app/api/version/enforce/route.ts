import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

/**
 * POST /api/version/enforce
 * Imposta aggiornamento forzato (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { force_update } = body;

    const { error } = await supabaseAdmin
      .from('app_versions')
      .update({
        force_update: force_update || false
      })
      .eq('version', (await supabaseAdmin.from('app_versions').select('version').order('created_at', { ascending: false }).limit(1).maybeSingle()).data?.version);

    if (error) {
      console.error('Error enforcing version:', error);
      return NextResponse.json({ error: 'Failed to enforce version' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Version enforce error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

