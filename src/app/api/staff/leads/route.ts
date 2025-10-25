import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    console.log('Staff leads API called');
    
    const { data: leads, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Errore nel recupero dei lead' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      leads: leads || [] 
    });

  } catch (error: any) {
    console.error('Staff leads API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Errore interno del server' 
    }, { status: 500 });
  }
}
