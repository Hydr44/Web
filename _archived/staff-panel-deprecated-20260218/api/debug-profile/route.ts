import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    console.log('Debugging profile for:', email);

    // Check auth users
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = authUsers?.users?.find(u => u.email === email);

    console.log('Auth user found:', authUser ? 'Yes' : 'No');

    if (authUser) {
      // Check profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      console.log('Profile found:', profile ? 'Yes' : 'No');
      console.log('Profile error:', profileError);

      return NextResponse.json({ 
        success: true, 
        authUser: authUser ? { id: authUser.id, email: authUser.email } : null,
        profile: profile || null,
        profileError: profileError?.message || null
      });
    }

    return NextResponse.json({ 
      success: true, 
      authUser: null,
      profile: null,
      profileError: 'No auth user found'
    });

  } catch (error: any) {
    console.error('Debug profile error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
