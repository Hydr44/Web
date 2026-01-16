import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function GET(request: Request) {
  try {
    const origin = request.headers.get('origin');
    
    console.log('Admin subscriptions API called');
    
    // Recupera tutte le subscriptions
    const { data: subscriptions, error } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        id,
        user_id,
        stripe_customer_id,
        stripe_subscription_id,
        price_id,
        status,
        current_period_end,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Errore nel recupero degli abbonamenti',
        details: error.message 
      }, { 
        status: 500,
        headers: corsHeaders(origin)
      });
    }

    // Recupera i profili per gli user_id unici
    const userIds = [...new Set((subscriptions || []).map((s: any) => s.user_id).filter(Boolean))];
    const profilesMap: Record<string, any> = {};
    
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);
      
      if (!profilesError && profiles) {
        profiles.forEach((profile: any) => {
          profilesMap[profile.id] = profile;
        });
      }
    }

    // Transform data to include user info
    const transformedSubscriptions = (subscriptions || []).map((sub: any) => {
      const profile = sub.user_id ? profilesMap[sub.user_id] : null;
      
      // Mappa price_id ai nomi dei piani
      const PLAN_MAPPING: Record<string, string> = {
        [process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER || ""]: "Starter",
        [process.env.STRIPE_PRICE_FLEET || ""]: "Flotta", 
        [process.env.STRIPE_PRICE_CONSORTIUM || ""]: "Azienda / Consorzio",
      };
      
      const planName = PLAN_MAPPING[sub.price_id || ""] || sub.price_id || "Sconosciuto";

      return {
        id: sub.id,
        user_id: sub.user_id,
        stripe_customer_id: sub.stripe_customer_id,
        stripe_subscription_id: sub.stripe_subscription_id,
        price_id: sub.price_id,
        status: sub.status,
        current_period_end: sub.current_period_end,
        created_at: sub.created_at,
        updated_at: sub.updated_at,
        plan_name: planName,
        user_email: profile?.email || null,
        user_name: profile?.full_name || null,
      };
    });

    return NextResponse.json({ 
      success: true, 
      subscriptions: transformedSubscriptions 
    }, {
      headers: corsHeaders(origin)
    });

  } catch (error: any) {
    console.error('Admin subscriptions API error:', error);
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
