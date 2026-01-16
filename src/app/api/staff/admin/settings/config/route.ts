import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function GET(request: Request) {
  try {
    const origin = request.headers.get('origin');
    
    console.log('Admin settings config API called');
    
    // Per ora restituiamo configurazione hardcoded
    // TODO: Creare tabella system_config in database
    const config = {
      email_from: process.env.EMAIL_FROM || 'noreply@rescuemanager.eu',
      email_support: process.env.EMAIL_SUPPORT || 'support@rescuemanager.eu',
      max_users_per_org: 100,
      max_vehicles_per_org: 1000,
      maintenance_mode: false,
      maintenance_message: '',
    };

    return NextResponse.json({ 
      success: true, 
      config 
    }, {
      headers: corsHeaders(origin)
    });

  } catch (error: any) {
    console.error('Admin settings config API error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json({ 
      success: false, 
      error: 'Errore interno del server' 
    }, { 
      status: 500,
      headers: corsHeaders(origin)
    });
  }
}

export async function PUT(request: Request) {
  try {
    const origin = request.headers.get('origin');
    const config = await request.json();
    
    console.log('Admin settings update config API called');
    
    // TODO: Salvare configurazione nel database
    // Per ora simuliamo il salvataggio
    
    return NextResponse.json({ 
      success: true, 
      message: 'Configurazione aggiornata con successo' 
    }, {
      headers: corsHeaders(origin)
    });

  } catch (error: any) {
    console.error('Admin settings update config API error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json({ 
      success: false, 
      error: 'Errore interno del server' 
    }, { 
      status: 500,
      headers: corsHeaders(origin)
    });
  }
}
