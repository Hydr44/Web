import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

// Helper: legge un valore da system_settings
async function getSetting(key: string) {
  const { data } = await supabaseAdmin
    .from('system_settings')
    .select('value')
    .eq('key', key)
    .single();
  return data?.value;
}

// Helper: scrive un valore in system_settings (upsert)
async function setSetting(key: string, value: any, description?: string) {
  const { error } = await supabaseAdmin
    .from('system_settings')
    .upsert({ key, value, description, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  return error;
}

export async function GET(request: Request) {
  try {
    const origin = request.headers.get('origin');

    // Legge tutte le config da system_settings
    const { data: rows } = await supabaseAdmin
      .from('system_settings')
      .select('key, value')
      .in('key', [
        'email_from', 'email_support', 'max_users_per_org', 'max_vehicles_per_org',
        'maintenance_enabled', 'maintenance_message', 'registration_enabled',
        'trial_days', 'default_plan', 'website_maintenance_enabled', 'website_maintenance_message'
      ]);

    const settings: Record<string, any> = {};
    for (const row of rows || []) {
      settings[row.key] = row.value;
    }

    const config = {
      email_from: settings.email_from || process.env.EMAIL_FROM || 'noreply@rescuemanager.eu',
      email_support: settings.email_support || process.env.EMAIL_SUPPORT || 'support@rescuemanager.eu',
      max_users_per_org: settings.max_users_per_org ?? 100,
      max_vehicles_per_org: settings.max_vehicles_per_org ?? 1000,
      maintenance_mode: settings.maintenance_enabled === true || settings.maintenance_enabled === 'true',
      maintenance_message: settings.maintenance_message || '',
      registration_enabled: settings.registration_enabled !== false && settings.registration_enabled !== 'false',
      trial_days: settings.trial_days ?? 14,
      default_plan: settings.default_plan || 'base',
      website_maintenance_enabled: settings.website_maintenance_enabled === true,
      website_maintenance_message: settings.website_maintenance_message || '',
    };

    return NextResponse.json({ success: true, config }, { headers: corsHeaders(origin) });

  } catch (error: any) {
    console.error('Admin settings config API error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json({ success: false, error: 'Errore interno del server' }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function PUT(request: Request) {
  try {
    const origin = request.headers.get('origin');
    const body = await request.json();

    // Salva ogni campo come riga separata in system_settings
    const updates: { key: string; value: any; desc: string }[] = [];
    if (body.email_from !== undefined) updates.push({ key: 'email_from', value: body.email_from, desc: 'Email mittente sistema' });
    if (body.email_support !== undefined) updates.push({ key: 'email_support', value: body.email_support, desc: 'Email supporto' });
    if (body.max_users_per_org !== undefined) updates.push({ key: 'max_users_per_org', value: body.max_users_per_org, desc: 'Max utenti per organizzazione' });
    if (body.max_vehicles_per_org !== undefined) updates.push({ key: 'max_vehicles_per_org', value: body.max_vehicles_per_org, desc: 'Max veicoli per organizzazione' });
    if (body.registration_enabled !== undefined) updates.push({ key: 'registration_enabled', value: body.registration_enabled, desc: 'Registrazione nuovi utenti abilitata' });
    if (body.trial_days !== undefined) updates.push({ key: 'trial_days', value: body.trial_days, desc: 'Giorni di prova gratuita' });
    if (body.default_plan !== undefined) updates.push({ key: 'default_plan', value: body.default_plan, desc: 'Piano di default' });

    for (const u of updates) {
      const err = await setSetting(u.key, u.value, u.desc);
      if (err) {
        console.error(`Error saving ${u.key}:`, err);
        return NextResponse.json({ success: false, error: `Errore salvataggio ${u.key}` }, { status: 500, headers: corsHeaders(origin) });
      }
    }

    return NextResponse.json({ success: true, message: 'Configurazione aggiornata con successo' }, { headers: corsHeaders(origin) });

  } catch (error: any) {
    console.error('Admin settings update config API error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json({ success: false, error: 'Errore interno del server' }, { status: 500, headers: corsHeaders(origin) });
  }
}
