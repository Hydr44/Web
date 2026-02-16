import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const origin = request.headers.get('origin');
    const subscriptionId = params.id;
    
    console.log(`Admin cancel subscription API called for: ${subscriptionId}`);
    
    // Trova la subscription
    const { data: subscription, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();
    
    if (fetchError || !subscription) {
      return NextResponse.json({
        success: false,
        error: 'Abbonamento non trovato'
      }, { 
        status: 404,
        headers: corsHeaders(origin)
      });
    }
    
    if (subscription.status === 'canceled') {
      return NextResponse.json({
        success: false,
        error: 'Abbonamento già cancellato'
      }, { 
        status: 400,
        headers: corsHeaders(origin)
      });
    }
    
    // TODO: Integrare con Stripe per cancellare l'abbonamento
    // Per ora aggiorniamo solo il database
    const { data: updatedSubscription, error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error canceling subscription:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Errore durante la cancellazione'
      }, { 
        status: 500,
        headers: corsHeaders(origin)
      });
    }
    
    // Aggiorna anche il profilo utente
    if (subscription.user_id) {
      await supabaseAdmin
        .from('profiles')
        .update({
          current_plan: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.user_id);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Abbonamento cancellato con successo',
      subscription: updatedSubscription
    }, {
      headers: corsHeaders(origin)
    });
    
  } catch (error: any) {
    console.error('Admin cancel subscription API error:', error);
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
