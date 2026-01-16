import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function GET(request: Request) {
  try {
    const origin = request.headers.get('origin');
    
    console.log('Admin get remote control status API called');
    
    // Carica configurazione sistema
    const { data: config, error: configError } = await supabaseAdmin
      .from('system_config')
      .select('*')
      .single();
    
    // Conta utenti online (ultimi 5 minuti)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count: onlineUsers } = await supabaseAdmin
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('last_activity', fiveMinutesAgo);
    
    const status = {
      maintenance_mode: config?.maintenance_mode || false,
      maintenance_message: config?.maintenance_message || '',
      min_app_version: config?.min_app_version || '',
      force_update: config?.force_update || false,
      online_users: onlineUsers || 0,
    };
    
    return NextResponse.json({
      success: true,
      data: status
    }, {
      headers: corsHeaders(origin)
    });
    
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
      }
    }, {
      headers: corsHeaders(origin)
    });
  }
}
