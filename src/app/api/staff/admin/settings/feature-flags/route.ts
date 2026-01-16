import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function GET(request: Request) {
  try {
    const origin = request.headers.get('origin');
    
    console.log('Admin settings feature flags API called');
    
    // Per ora restituiamo feature flags hardcoded
    // TODO: Creare tabella feature_flags in database
    const featureFlags = [
      {
        id: 'rentri_enabled',
        name: 'RENTRI Integration',
        description: 'Abilita integrazione con sistema RENTRI per tracciamento rifiuti',
        enabled: true,
        category: 'integrations',
      },
      {
        id: 'sdi_enabled',
        name: 'SDI Integration',
        description: 'Abilita invio fatture elettroniche tramite SDI',
        enabled: true,
        category: 'integrations',
      },
      {
        id: 'rvfu_enabled',
        name: 'RVFU Integration',
        description: 'Abilita integrazione con sistema RVFU',
        enabled: false,
        category: 'integrations',
      },
      {
        id: 'ai_validation',
        name: 'AI Validation',
        description: 'Abilita validazione AI per fatture e documenti',
        enabled: true,
        category: 'general',
      },
      {
        id: 'email_notifications',
        name: 'Email Notifications',
        description: 'Abilita notifiche email automatiche',
        enabled: true,
        category: 'notifications',
      },
      {
        id: 'two_factor_auth',
        name: 'Two Factor Authentication',
        description: 'Richiedi autenticazione a due fattori per tutti gli utenti',
        enabled: false,
        category: 'security',
      },
    ];

    return NextResponse.json({ 
      success: true, 
      flags: featureFlags 
    }, {
      headers: corsHeaders(origin)
    });

  } catch (error: any) {
    console.error('Admin settings feature flags API error:', error);
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
    const body = await request.json();
    const { flags } = body;
    
    console.log('Admin settings update feature flags API called');
    
    // TODO: Salvare feature flags nel database
    // Per ora simuliamo il salvataggio
    
    return NextResponse.json({ 
      success: true, 
      message: 'Feature flags aggiornate con successo' 
    }, {
      headers: corsHeaders(origin)
    });

  } catch (error: any) {
    console.error('Admin settings update feature flags API error:', error);
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
