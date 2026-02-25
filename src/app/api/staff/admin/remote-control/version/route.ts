import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin');
    const { min_version, force_update } = await request.json();

    // Upsert version settings in system_settings (key-value)
    const updates = [
      { key: 'min_app_version', value: min_version || '', description: 'Versione minima app desktop' },
      { key: 'force_update', value: force_update || false, description: 'Forza aggiornamento app desktop' },
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

    return NextResponse.json({ success: true, message: 'Impostazioni versione salvate' }, { headers: corsHeaders(origin) });

  } catch (error: any) {
    console.error('Admin set version settings API error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json({ success: false, error: 'Errore interno del server' }, { status: 500, headers: corsHeaders(origin) });
  }
}
