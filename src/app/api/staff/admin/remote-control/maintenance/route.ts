import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin');
    const { enabled, message } = await request.json();
    
    console.log(`Admin set maintenance mode API called: ${enabled}`);
    
    // Aggiorna configurazione sistema
    const { data: config, error: configError } = await supabaseAdmin
      .from('system_config')
      .select('*')
      .single();
    
    if (configError && configError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, va bene, creiamo la config
      return NextResponse.json({
        success: false,
        error: 'Errore nel recupero configurazione'
      }, { 
        status: 500,
        headers: corsHeaders(origin)
      });
    }
    
    if (config) {
      // Aggiorna esistente
      const { error: updateError } = await supabaseAdmin
        .from('system_config')
        .update({
          maintenance_mode: enabled,
          maintenance_message: message || '',
        })
        .eq('id', config.id);
      
      if (updateError) {
        return NextResponse.json({
          success: false,
          error: 'Errore aggiornamento configurazione'
        }, { 
          status: 500,
          headers: corsHeaders(origin)
        });
      }
    } else {
      // Crea nuova configurazione
      const { error: insertError } = await supabaseAdmin
        .from('system_config')
        .insert({
          maintenance_mode: enabled,
          maintenance_message: message || '',
        });
      
      if (insertError) {
        return NextResponse.json({
          success: false,
          error: 'Errore creazione configurazione'
        }, { 
          status: 500,
          headers: corsHeaders(origin)
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Modalità manutenzione ${enabled ? 'attivata' : 'disattivata'}`
    }, {
      headers: corsHeaders(origin)
    });
    
  } catch (error: any) {
    console.error('Admin set maintenance mode API error:', error);
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
