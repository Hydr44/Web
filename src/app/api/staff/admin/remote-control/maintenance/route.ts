import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin');
    const { enabled, message } = await request.json();

    // 1. Upsert maintenance settings in system_settings (key-value) — usato dall'admin panel per leggere lo stato
    const updates = [
      { key: 'maintenance_enabled', value: enabled, description: 'Modalità manutenzione app desktop' },
      { key: 'maintenance_message', value: message || '', description: 'Messaggio manutenzione app desktop' },
    ];

    for (const u of updates) {
      const { error } = await supabaseAdmin
        .from('system_settings')
        .upsert({ key: u.key, value: u.value, description: u.description, updated_at: new Date().toISOString() }, { onConflict: 'key' });

      if (error) {
        console.error(`Error saving ${u.key}:`, error);
        return NextResponse.json({ success: false, error: `Errore salvataggio ${u.key}` }, { status: 500, headers: corsHeaders(origin) });
      }
    }

    // 2. Sincronizza anche la tabella maintenance_mode — usata dalla desktop app via GET /api/maintenance/status
    try {
      // Prima verifica se esiste già un record
      const { data: existing } = await supabaseAdmin
        .from('maintenance_mode')
        .select('id')
        .maybeSingle();

      if (existing) {
        // Aggiorna il record esistente
        const { error: updateError } = await supabaseAdmin
          .from('maintenance_mode')
          .update({
            is_active: enabled,
            message: message || null,
            started_at: enabled ? new Date().toISOString() : null,
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Error syncing maintenance_mode (update):', updateError);
        }
      } else {
        // Crea un nuovo record
        const { error: insertError } = await supabaseAdmin
          .from('maintenance_mode')
          .insert({
            is_active: enabled,
            message: message || null,
            started_at: enabled ? new Date().toISOString() : null,
          });

        if (insertError) {
          console.error('Error syncing maintenance_mode (insert):', insertError);
        }
      }
    } catch (syncError) {
      // Non bloccare la risposta se la sincronizzazione fallisce — system_settings è già aggiornato
      console.error('Error syncing maintenance_mode table:', syncError);
    }

    return NextResponse.json({
      success: true,
      message: `Modalità manutenzione ${enabled ? 'attivata' : 'disattivata'}`
    }, { headers: corsHeaders(origin) });

  } catch (error: any) {
    console.error('Admin set maintenance mode API error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json({ success: false, error: 'Errore interno del server' }, { status: 500, headers: corsHeaders(origin) });
  }
}
