import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    console.log('Debugging profiles table...');

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .limit(10);

    console.log('Profiles error:', profilesError);
    console.log('Profiles count:', profiles?.length || 0);

    // Get auth users
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    console.log('Auth users count:', authUsers?.users?.length || 0);

    return NextResponse.json({ 
      success: true, 
      profilesCount: profiles?.length || 0,
      authUsersCount: authUsers?.users?.length || 0,
      profiles: profiles || [],
      profilesError: profilesError?.message || null
    });

  } catch (error: any) {
    console.error('Debug table error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
