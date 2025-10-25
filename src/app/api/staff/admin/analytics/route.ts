import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';
    const metric = searchParams.get('metric') || 'all';

    console.log(`Analytics API called: ${metric} for ${timeRange}`);

    // Calculate date range
    const now = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 30;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

    let analytics: any = {};

    // Get basic counts
    const [
      { count: totalUsers },
      { count: totalOrgs },
      { count: totalStaff },
      { count: totalSessions },
      { count: totalLeads }
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('orgs').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('is_staff', true),
      supabaseAdmin.from('user_sessions').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('leads').select('*', { count: 'exact', head: true })
    ]);

    // Get recent activity counts
    const [
      { count: recentUsers },
      { count: recentOrgs },
      { count: recentSessions },
      { count: recentLeads }
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', startDate),
      supabaseAdmin.from('orgs').select('*', { count: 'exact', head: true }).gte('created_at', startDate),
      supabaseAdmin.from('user_sessions').select('*', { count: 'exact', head: true }).gte('created_at', startDate),
      supabaseAdmin.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', startDate)
    ]);

    // User analytics
    if (metric === 'all' || metric === 'users') {
      const { data: userStats } = await supabaseAdmin
        .from('profiles')
        .select('created_at, provider, is_admin')
        .gte('created_at', startDate);

      const userGrowth = userStats?.map(stat => ({
        date: stat.created_at.split('T')[0],
        count: 1,
        provider: stat.provider,
        is_admin: stat.is_admin
      })) || [];

      analytics.users = {
        total: totalUsers || 0,
        recent: recentUsers || 0,
        growth: userGrowth,
        by_provider: userStats?.reduce((acc: any, user: any) => {
          acc[user.provider] = (acc[user.provider] || 0) + 1;
          return acc;
        }, {}) || {},
        admin_count: userStats?.filter(u => u.is_admin).length || 0
      };
    }

    // Organization analytics
    if (metric === 'all' || metric === 'organizations') {
      const { data: orgStats } = await supabaseAdmin
        .from('orgs')
        .select('created_at, name')
        .gte('created_at', startDate);

      const orgGrowth = orgStats?.map(stat => ({
        date: stat.created_at.split('T')[0],
        count: 1,
        name: stat.name
      })) || [];

      analytics.organizations = {
        total: totalOrgs || 0,
        recent: recentOrgs || 0,
        growth: orgGrowth
      };
    }

    // Session analytics
    if (metric === 'all' || metric === 'sessions') {
      const { data: sessionStats } = await supabaseAdmin
        .from('user_sessions')
        .select('created_at, is_active, last_activity')
        .gte('created_at', startDate);

      const activeSessions = sessionStats?.filter(s => s.is_active).length || 0;
      const avgSessionDuration = sessionStats?.reduce((acc, session) => {
        if (session.last_activity) {
          const duration = new Date(session.last_activity).getTime() - new Date(session.created_at).getTime();
          return acc + duration;
        }
        return acc;
      }, 0) / (sessionStats?.length || 1) || 0;

      analytics.sessions = {
        total: totalSessions || 0,
        recent: recentSessions || 0,
        active: activeSessions,
        avg_duration_hours: Math.round(avgSessionDuration / (1000 * 60 * 60) * 100) / 100
      };
    }

    // Lead analytics
    if (metric === 'all' || metric === 'leads') {
      const { data: leadStats } = await supabaseAdmin
        .from('leads')
        .select('created_at, status, type, priority')
        .gte('created_at', startDate);

      const leadGrowth = leadStats?.map(stat => ({
        date: stat.created_at.split('T')[0],
        count: 1,
        status: stat.status,
        type: stat.type,
        priority: stat.priority
      })) || [];

      analytics.leads = {
        total: totalLeads || 0,
        recent: recentLeads || 0,
        growth: leadGrowth,
        by_status: leadStats?.reduce((acc: any, lead: any) => {
          acc[lead.status] = (acc[lead.status] || 0) + 1;
          return acc;
        }, {}) || {},
        by_type: leadStats?.reduce((acc: any, lead: any) => {
          acc[lead.type] = (acc[lead.type] || 0) + 1;
          return acc;
        }, {}) || {},
        by_priority: leadStats?.reduce((acc: any, lead: any) => {
          acc[lead.priority] = (acc[lead.priority] || 0) + 1;
          return acc;
        }, {}) || {}
      };
    }

    // System health metrics
    if (metric === 'all' || metric === 'system') {
      analytics.system = {
        uptime: '99.9%', // Mock data
        response_time: '120ms', // Mock data
        error_rate: '0.1%', // Mock data
        database_size: '2.3 GB', // Mock data
        last_backup: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        active_connections: Math.floor(Math.random() * 50) + 20
      };
    }

    // Performance metrics
    if (metric === 'all' || metric === 'performance') {
      analytics.performance = {
        page_views: Math.floor(Math.random() * 10000) + 5000,
        unique_visitors: Math.floor(Math.random() * 2000) + 1000,
        bounce_rate: Math.floor(Math.random() * 30) + 20,
        avg_session_duration: Math.floor(Math.random() * 10) + 5,
        top_pages: [
          { page: '/dashboard', views: Math.floor(Math.random() * 1000) + 500 },
          { page: '/login', views: Math.floor(Math.random() * 800) + 300 },
          { page: '/organizations', views: Math.floor(Math.random() * 600) + 200 }
        ]
      };
    }

    return NextResponse.json({
      success: true,
      analytics,
      timeRange,
      generated_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Analytics API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Errore interno del server'
    }, { status: 500 });
  }
}
