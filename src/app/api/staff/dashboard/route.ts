import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    console.log('[Staff Dashboard API] Called');
    
    // Get total users
    const { count: totalUsers, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (usersError) {
      console.error('[Staff Dashboard API] Error fetching users:', usersError);
    }
    console.log('[Staff Dashboard API] Total users:', totalUsers);

    // Get total organizations (prova prima 'orgs', poi 'organizations')
    let totalOrgs = 0;
    let orgsError = null;
    
    const { count: orgsCount, error: orgsErr } = await supabaseAdmin
      .from('orgs')
      .select('*', { count: 'exact', head: true });
    
    if (orgsErr) {
      console.log('[Staff Dashboard API] Table "orgs" not found, trying "organizations"');
      const { count: orgsCount2, error: orgsErr2 } = await supabaseAdmin
        .from('organizations')
        .select('*', { count: 'exact', head: true });
      
      if (orgsErr2) {
        console.error('[Staff Dashboard API] Error fetching organizations:', orgsErr2);
        orgsError = orgsErr2;
      } else {
        totalOrgs = orgsCount2 || 0;
      }
    } else {
      totalOrgs = orgsCount || 0;
    }
    
    console.log('[Staff Dashboard API] Total orgs:', totalOrgs);

    // Get total leads
    const { count: totalLeads, error: leadsError } = await supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact', head: true });
    
    if (leadsError) {
      console.error('[Staff Dashboard API] Error fetching leads:', leadsError);
    }
    console.log('[Staff Dashboard API] Total leads:', totalLeads);

    // Get active users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { count: activeUsers, error: activeUsersError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', thirtyDaysAgo.toISOString());
    
    if (activeUsersError) {
      console.error('[Staff Dashboard API] Error fetching active users:', activeUsersError);
    }
    console.log('[Staff Dashboard API] Active users:', activeUsers);

    // Get new leads today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: newLeadsToday, error: newLeadsError } = await supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());
    
    if (newLeadsError) {
      console.error('[Staff Dashboard API] Error fetching new leads:', newLeadsError);
    }
    console.log('[Staff Dashboard API] New leads today:', newLeadsToday);

    // Calculate user growth (mock for now)
    const userGrowth = 15.2;

    // Calculate lead conversion (mock for now)
    const leadConversion = 8.7;

    // Calculate monthly revenue (mock for now)
    const monthlyRevenue = 12500;

    const stats = {
      totalUsers: totalUsers || 0,
      totalOrgs: totalOrgs || 0,
      totalLeads: totalLeads || 0,
      monthlyRevenue,
      userGrowth,
      leadConversion,
      activeUsers: activeUsers || 0,
      newLeadsToday: newLeadsToday || 0
    };

    console.log('[Staff Dashboard API] Returning stats:', stats);

    return NextResponse.json({ 
      success: true, 
      stats 
    });

  } catch (error: any) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Errore interno del server' 
    }, { status: 500 });
  }
}
