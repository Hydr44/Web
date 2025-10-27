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

    // Recupera l'ID del record esistente
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('maintenance_mode')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching maintenance record:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch maintenance record' }, { status: 500 });
    }

    let result;
    if (existing) {
      // Update existing record
      const { error } = await supabaseAdmin
        .from('maintenance_mode')
        .update({
          is_active: true,
          message: message || null,
          started_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) {
        console.error('Error updating maintenance:', error);
        return NextResponse.json({ error: 'Failed to update maintenance' }, { status: 500 });
      }
      result = { success: true };
    } else {
      // Insert new record
      const { error } = await supabaseAdmin
        .from('maintenance_mode')
        .insert({
          is_active: true,
          message: message || null,
          started_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error inserting maintenance:', error);
        return NextResponse.json({ error: 'Failed to insert maintenance' }, { status: 500 });
      }
      result = { success: true };
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Maintenance enable error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

