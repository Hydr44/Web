import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin');
    const { min_version, force_update } = await request.json();
    
    console.log(`Admin set version settings API called: ${min_version}, force: ${force_update}`);
    
    // Aggiorna configurazione sistema
    const { data: config, error: configError } = await supabaseAdmin
      .from('system_config')
      .select('*')
      .single();
    
    if (configError && configError.code !== 'PGRST116') {
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
          min_app_version: min_version || '',
          force_update: force_update || false,
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
          min_app_version: min_version || '',
          force_update: force_update || false,
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
      message: 'Impostazioni versione salvate'
    }, {
      headers: corsHeaders(origin)
    });
    
  } catch (error: any) {
    console.error('Admin set version settings API error:', error);
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
