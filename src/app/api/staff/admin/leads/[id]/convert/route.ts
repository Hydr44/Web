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
    
    console.log(`Admin lead convert API called for: ${leadId}`);
    
    const { data, error } = await supabaseAdmin
      .from('leads')
      .update({ 
        status: 'converted',
        converted_at: new Date().toISOString()
      })
      .eq('id', leadId)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ 
        success: false, 
        error: error?.message || 'Lead non trovato' 
      }, { 
        status: error ? 500 : 404,
        headers: corsHeaders(origin)
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Lead convertito con successo',
      lead: data
    }, {
      headers: corsHeaders(origin)
    });

  } catch (error: any) {
    console.error('Admin lead convert API error:', error);
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
