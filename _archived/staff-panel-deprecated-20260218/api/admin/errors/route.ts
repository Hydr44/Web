import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function GET(request: Request) {
  try {
    const origin = request.headers.get('origin');
    
    console.log('Admin errors API called');
    
    // Per ora restituiamo errori mock
    // TODO: Creare tabella app_errors in database e loggare errori reali
    const errors = [
      // Esempi di errori mock
    ];

    return NextResponse.json({ 
      success: true, 
      errors: errors 
    }, {
      headers: corsHeaders(origin)
    });

  } catch (error: any) {
    console.error('Admin errors API error:', error);
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
