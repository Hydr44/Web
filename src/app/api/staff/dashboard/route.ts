import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    console.log('Dashboard API called');
    
    // Get total users
    const { count: totalUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get total organizations
    const { count: totalOrgs } = await supabaseAdmin
      .from('organizations')
      .select('*', { count: 'exact', head: true });

    // Get total leads
    const { count: totalLeads } = await supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact', head: true });

    // Get active users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { count: activeUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', thirtyDaysAgo.toISOString());

    // Get new leads today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: newLeadsToday } = await supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

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
