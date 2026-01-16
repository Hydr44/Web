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
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Service role key present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Find user by email first con timeout
    console.log('[Staff Auth] Calling supabaseAdmin.auth.admin.listUsers()...');
    const startTime = Date.now();
    
    let authUsers;
    try {
      // Aggiungi timeout manuale (5 secondi - più corto per rispondere prima)
      const listUsersPromise = supabaseAdmin.auth.admin.listUsers();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Supabase timeout: listUsers() non ha risposto entro 5 secondi. Il progetto potrebbe essere in pausa.')), 5000)
      );
      
      const result = await Promise.race([listUsersPromise, timeoutPromise]) as any;
      authUsers = result;
      
      const elapsed = Date.now() - startTime;
      console.log(`[Staff Auth] listUsers() completed in ${elapsed}ms`);
      console.log(`[Staff Auth] Found ${authUsers?.data?.users?.length || 0} users`);
    } catch (error: any) {
      const elapsed = Date.now() - startTime;
      console.error(`[Staff Auth] Error after ${elapsed}ms:`, error);
      const origin = request.headers.get('origin');
      
      // Messaggio più dettagliato
      let errorMessage = 'Errore connessione Supabase';
      if (error.message?.includes('timeout')) {
        errorMessage = 'Timeout: Supabase non risponde entro 10 secondi. Possibili cause:\n' +
          '1. Il progetto Supabase è in pausa (piano gratuito)\n' +
          '2. Problemi di rete/VPS\n' +
          '3. Supabase temporaneamente non disponibile\n\n' +
          'Verifica: https://status.supabase.com o vai su https://supabase.com/dashboard e controlla se il progetto è attivo.';
      } else {
        errorMessage = `Errore Supabase: ${error.message}`;
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage
        },
        { 
          status: 503,
          headers: corsHeaders(origin)
        }
      );
    }
    
    const authUser = authUsers?.data?.users?.find((u: any) => u.email === email);

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
