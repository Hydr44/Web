import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

// Definizione statica dei flag disponibili (metadata)
const FLAG_DEFINITIONS = [
  { id: 'rentri_enabled', name: 'RENTRI Integration', description: 'Integrazione con sistema RENTRI per tracciamento rifiuti', category: 'integrations', default: true },
  { id: 'sdi_enabled', name: 'SDI Integration', description: 'Invio fatture elettroniche tramite SDI', category: 'integrations', default: true },
  { id: 'rvfu_enabled', name: 'RVFU Integration', description: 'Integrazione con sistema RVFU (MIT)', category: 'integrations', default: false },
  { id: 'spare_parts_enabled', name: 'Ricambi', description: 'Modulo gestione ricambi e magazzino', category: 'general', default: true },
  { id: 'yard_enabled', name: 'Piazzale', description: 'Modulo gestione piazzale veicoli', category: 'general', default: true },
  { id: 'ai_validation', name: 'AI Validation', description: 'Validazione AI per fatture e documenti', category: 'general', default: true },
  { id: 'email_notifications', name: 'Email Notifications', description: 'Notifiche email automatiche', category: 'notifications', default: true },
  { id: 'push_notifications', name: 'Push Notifications', description: 'Notifiche push su mobile', category: 'notifications', default: false },
  { id: 'two_factor_auth', name: 'Two Factor Auth', description: 'Autenticazione a due fattori obbligatoria', category: 'security', default: false },
  { id: 'registration_open', name: 'Registrazione Aperta', description: 'Consenti nuove registrazioni dal sito', category: 'security', default: true },
];

export async function GET(request: Request) {
  try {
    const origin = request.headers.get('origin');

    // Legge feature_flags da system_settings
    const { data } = await supabaseAdmin
      .from('system_settings')
      .select('value')
      .eq('key', 'feature_flags')
      .single();

    const savedFlags: Record<string, boolean> = data?.value && typeof data.value === 'object' ? data.value : {};

    // Merge definizioni con valori salvati
    const flags = FLAG_DEFINITIONS.map(def => ({
      id: def.id,
      name: def.name,
      description: def.description,
      category: def.category,
      enabled: savedFlags[def.id] !== undefined ? savedFlags[def.id] : def.default,
    }));

    return NextResponse.json({ success: true, flags }, { headers: corsHeaders(origin) });

  } catch (error: any) {
    console.error('Admin settings feature flags API error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json({ success: false, error: 'Errore interno del server' }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function PUT(request: Request) {
  try {
    const origin = request.headers.get('origin');
    const body = await request.json();
    const { flags } = body;

    // Costruisce oggetto { flag_id: boolean }
    const flagValues: Record<string, boolean> = {};
    for (const flag of flags) {
      flagValues[flag.id] = flag.enabled;
    }

    // Upsert in system_settings
    const { error } = await supabaseAdmin
      .from('system_settings')
      .upsert({
        key: 'feature_flags',
        value: flagValues,
        description: 'Feature flags globali',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

    if (error) {
      console.error('Error saving feature flags:', error);
      return NextResponse.json({ success: false, error: 'Errore salvataggio feature flags' }, { status: 500, headers: corsHeaders(origin) });
    }

    return NextResponse.json({ success: true, message: 'Feature flags aggiornate con successo' }, { headers: corsHeaders(origin) });

  } catch (error: any) {
    console.error('Admin settings update feature flags API error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json({ success: false, error: 'Errore interno del server' }, { status: 500, headers: corsHeaders(origin) });
  }
}
