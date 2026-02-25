import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

// id = org_id (PK di org_subscriptions)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const origin = request.headers.get('origin');
    const { id: orgId } = await params;

    const { data: sub, error: fetchError } = await supabaseAdmin
      .from('org_subscriptions')
      .select('*')
      .eq('org_id', orgId)
      .single();

    if (fetchError || !sub) {
      return NextResponse.json(
        { success: false, error: 'Abbonamento non trovato' },
        { status: 404, headers: corsHeaders(origin) }
      );
    }

    if (sub.status === 'active') {
      return NextResponse.json(
        { success: false, error: 'Abbonamento già attivo' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    // Riattiva con 1 anno da oggi
    const newPeriodEnd = new Date();
    newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);

    const { error: updateError } = await supabaseAdmin
      .from('org_subscriptions')
      .update({
        status: 'active',
        current_period_end: newPeriodEnd.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId);

    if (updateError) {
      console.error('Error reactivating subscription:', updateError);
      return NextResponse.json(
        { success: false, error: 'Errore durante la riattivazione' },
        { status: 500, headers: corsHeaders(origin) }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Abbonamento riattivato con successo' },
      { headers: corsHeaders(origin) }
    );
  } catch (error: any) {
    console.error('Admin reactivate subscription error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json(
      { success: false, error: 'Errore interno del server' },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}
