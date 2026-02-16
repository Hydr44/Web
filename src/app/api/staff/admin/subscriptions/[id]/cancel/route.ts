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

    if (sub.status === 'canceled') {
      return NextResponse.json(
        { success: false, error: 'Abbonamento già cancellato' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from('org_subscriptions')
      .update({ status: 'canceled', updated_at: new Date().toISOString() })
      .eq('org_id', orgId);

    if (updateError) {
      console.error('Error canceling subscription:', updateError);
      return NextResponse.json(
        { success: false, error: 'Errore durante la cancellazione' },
        { status: 500, headers: corsHeaders(origin) }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Abbonamento cancellato con successo' },
      { headers: corsHeaders(origin) }
    );
  } catch (error: any) {
    console.error('Admin cancel subscription error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json(
      { success: false, error: 'Errore interno del server' },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}
