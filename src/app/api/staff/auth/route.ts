import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders, handleCors } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      const origin = request.headers.get('origin');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email e password sono richiesti' 
        },
        { 
          status: 400,
          headers: corsHeaders(origin)
        }
      );
    }

    console.log('Staff auth API called for:', email);

    // Find user by email first
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = authUsers?.users?.find(u => u.email === email);

    if (!authUser) {
      console.log('Auth user not found:', email);
      const origin = request.headers.get('origin');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Credenziali non valide' 
        },
        { 
          status: 401,
          headers: corsHeaders(origin)
        }
      );
    }

    // For now, we'll use a simple password check for known staff users
    // In production, you should implement proper password hashing
    const knownStaffCredentials = {
      'haxiesz@gmail.com': 'AdminStaff2024!',
      // Add more staff credentials here
    };

    if (knownStaffCredentials[email] !== password) {
      console.log('Invalid password for:', email);
      const origin = request.headers.get('origin');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Credenziali non valide' 
        },
        { 
          status: 401,
          headers: corsHeaders(origin)
        }
      );
    }

    console.log('Password verified for:', email);

    // Get user profile from database
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      console.log('Profile not found:', profileError);
      const origin = request.headers.get('origin');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Profilo utente non trovato' 
        },
        { 
          status: 401,
          headers: corsHeaders(origin)
        }
      );
    }

    // Check if user is staff
    if (!profile.is_staff) {
      console.log('User is not staff:', email);
      const origin = request.headers.get('origin');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Accesso negato: utente non autorizzato' 
        },
        { 
          status: 403,
          headers: corsHeaders(origin)
        }
      );
    }

    // Create staff user object
    const user = {
      id: profile.id,
      email: profile.email || authUser.email || '',
      full_name: profile.full_name || '',
      staff_role: profile.staff_role || 'staff',
      is_staff: profile.is_staff,
      is_admin: profile.is_admin || false,
      last_login: new Date().toISOString(),
      created_at: profile.created_at,
      avatar_url: profile.avatar_url
    };

    console.log('Staff auth successful:', user);
    const origin = request.headers.get('origin');
    return NextResponse.json(
      { success: true, user },
      { headers: corsHeaders(origin) }
    );

  } catch (error: any) {
    console.error('Staff auth API error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json(
      { 
        success: false, 
        error: 'Errore interno del server' 
      },
      { 
        status: 500,
        headers: corsHeaders(origin)
      }
    );
  }
}
