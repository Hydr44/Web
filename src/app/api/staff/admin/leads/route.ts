import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function GET(request: Request) {
  try {
    const origin = request.headers.get('origin');
    
    console.log('Admin leads API called');
    
    // Per ora restituiamo lead mock
    // TODO: Creare tabella leads in database e implementare logica reale
    const leads = [
      // Esempi di lead mock
    ];

    return NextResponse.json({ 
      success: true, 
      leads: leads 
    }, {
      headers: corsHeaders(origin)
    });

  } catch (error: any) {
    console.error('Admin leads API error:', error);
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
