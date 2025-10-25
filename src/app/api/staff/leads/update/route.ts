import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { leadId, status } = await request.json();

    if (!leadId || !status) {
      return NextResponse.json({ 
        success: false, 
        error: 'leadId e status sono richiesti' 
      }, { status: 400 });
    }

    console.log('Updating lead:', leadId, 'to status:', status);

    const { error } = await supabaseAdmin
      .from('leads')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
        ...(status === 'contacted' && { contacted_at: new Date().toISOString() }),
        ...(status === 'converted' && { converted_at: new Date().toISOString() })
      })
      .eq('id', leadId);

    if (error) {
      console.error('Error updating lead:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Errore nell\'aggiornamento del lead' 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Staff leads update API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Errore interno del server' 
    }, { status: 500 });
  }
}
