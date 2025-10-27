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

    // Recupera la versione attuale
    const { data: currentVersion, error: fetchError } = await supabaseAdmin
      .from('app_versions')
      .select('version')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !currentVersion) {
      console.error('Error fetching current version:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch current version' }, { status: 500 });
    }

    // Update force_update flag
    const { error } = await supabaseAdmin
      .from('app_versions')
      .update({
        force_update: force_update || false
      })
      .eq('version', currentVersion.version);

    if (error) {
      console.error('Error updating version:', error);
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

