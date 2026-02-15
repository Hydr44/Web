import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const origin = request.headers.get('origin');
    const { id: subscriptionId } = await params;
    
    console.log(`Admin reactivate subscription API called for: ${subscriptionId}`);
    
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
    
    if (subscription.status === 'active') {
      return NextResponse.json({
        success: false,
        error: 'Abbonamento già attivo'
      }, { 
        status: 400,
        headers: corsHeaders(origin)
      });
    }
    
    // Calcola nuova data di scadenza (30 giorni da oggi)
    const newPeriodEnd = new Date();
    newPeriodEnd.setDate(newPeriodEnd.getDate() + 30);
    
    // TODO: Integrare con Stripe per riattivare l'abbonamento
    // Per ora aggiorniamo solo il database
    const { data: updatedSubscription, error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_end: newPeriodEnd.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error reactivating subscription:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Errore durante la riattivazione'
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
          current_plan: subscription.price_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.user_id);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Abbonamento riattivato con successo',
      subscription: updatedSubscription
    }, {
      headers: corsHeaders(origin)
    });
    
  } catch (error: any) {
    console.error('Admin reactivate subscription API error:', error);
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
