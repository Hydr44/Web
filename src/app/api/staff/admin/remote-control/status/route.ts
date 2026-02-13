import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function GET(request: Request) {
  try {
    const origin = request.headers.get('origin');

    // Legge tutte le chiavi rilevanti da system_settings
    const { data: rows } = await supabaseAdmin
      .from('system_settings')
      .select('key, value')
      .in('key', [
        'maintenance_enabled', 'maintenance_message',
        'min_app_version', 'force_update',
        'website_maintenance_enabled', 'website_maintenance_message',
      ]);

    const settings: Record<string, any> = {};
    for (const row of rows || []) {
      settings[row.key] = row.value;
    }

    // Conta utenti online (ultimi 5 minuti)
    let onlineUsers = 0;
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { count } = await supabaseAdmin
        .from('user_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('last_activity', fiveMinutesAgo);
      onlineUsers = count || 0;
    } catch { /* user_sessions potrebbe non esistere */ }

    const status = {
      maintenance_mode: settings.maintenance_enabled === true || settings.maintenance_enabled === 'true',
      maintenance_message: settings.maintenance_message || '',
      min_app_version: settings.min_app_version || '',
      force_update: settings.force_update === true,
      online_users: onlineUsers,
      website_maintenance_enabled: settings.website_maintenance_enabled === true,
      website_maintenance_message: settings.website_maintenance_message || '',
    };

    return NextResponse.json({ success: true, data: status }, { headers: corsHeaders(origin) });

  } catch (error: any) {
    console.error('Admin get remote control status API error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json({
      success: true,
      data: {
        maintenance_mode: false,
        maintenance_message: '',
        min_app_version: '',
        force_update: false,
        online_users: 0,
        website_maintenance_enabled: false,
        website_maintenance_message: '',
      }
    }, { headers: corsHeaders(origin) });
  }
}
