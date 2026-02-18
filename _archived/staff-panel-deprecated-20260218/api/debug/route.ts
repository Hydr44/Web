import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    console.log('Staff debug API called');
    
    // Test Supabase connection
    const supabase = supabaseAdmin;
    
    // Check if profiles table exists and has staff columns
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, is_staff, staff_role, is_admin')
      .limit(5);
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: profilesError.message
      });
    }
    
    // Check if leads table exists
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, name, email, type, status')
      .limit(5);
    
    if (leadsError) {
      console.error('Error fetching leads:', leadsError);
      return NextResponse.json({
        success: false,
        error: 'Leads table not accessible',
        details: leadsError.message
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: {
        profiles: profiles || [],
        leads: leads || [],
        profilesCount: profiles?.length || 0,
        leadsCount: leads?.length || 0
      }
    });
    
  } catch (error: any) {
    console.error('Staff debug error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}
