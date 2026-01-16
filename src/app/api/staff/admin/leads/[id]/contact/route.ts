import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const origin = request.headers.get('origin');
    const leadId = params.id;
    
    console.log(`Admin lead contact API called for: ${leadId}`);
    
    // TODO: Implementare logica reale quando la tabella leads sarà creata
    // Per ora simuliamo l'aggiornamento
    
    return NextResponse.json({ 
      success: true, 
      message: 'Lead contattato con successo' 
    }, {
      headers: corsHeaders(origin)
    });

  } catch (error: any) {
    console.error('Admin lead contact API error:', error);
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
