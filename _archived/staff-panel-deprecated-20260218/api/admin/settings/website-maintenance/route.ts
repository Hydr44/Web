import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin');
    const { enabled, message } = await request.json();

    // Upsert website maintenance settings
    const updates = [
      { key: 'website_maintenance_enabled', value: enabled, description: 'Sito web in manutenzione' },
      { key: 'website_maintenance_message', value: message || '', description: 'Messaggio manutenzione sito web' },
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

    return NextResponse.json({
      success: true,
      message: `Manutenzione sito ${enabled ? 'attivata' : 'disattivata'}`
    }, { headers: corsHeaders(origin) });

  } catch (error: any) {
    console.error('Website maintenance API error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json({ success: false, error: 'Errore interno del server' }, { status: 500, headers: corsHeaders(origin) });
  }
}
