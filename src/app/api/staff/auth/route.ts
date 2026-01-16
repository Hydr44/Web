import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders, handleCors } from '@/lib/cors';

// Vercel timeout: 10s (Hobby), 60s (Pro)
// Riduciamo timeout Supabase a 3s per rispondere prima del timeout Vercel
export const maxDuration = 10;

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

    // Ottimizzazione: cerca direttamente nel database invece di listUsers() che è lento
    // Prima verifica password (veloce, senza chiamate Supabase)
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

    // Cerca utente direttamente nel database profiles (più veloce di listUsers)
    console.log('[Staff Auth] Searching user in profiles table...');
    const startTime = Date.now();
    
    let profile;
    try {
      // Query diretta al database con timeout
      const queryPromise = supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', email)
        .eq('is_staff', true)
        .single();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Supabase timeout: query non ha risposto entro 3 secondi. Il progetto potrebbe essere in pausa.')), 3000)
      );
      
      const result = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      if (result.error && result.error.code !== 'PGRST116') {
        throw result.error;
      }
      
      profile = result.data;
      
      const elapsed = Date.now() - startTime;
      console.log(`[Staff Auth] Profile query completed in ${elapsed}ms`);
      
      if (!profile) {
        console.log('Profile not found or user is not staff:', email);
        const origin = request.headers.get('origin');
        return NextResponse.json(
          { 
            success: false, 
            error: 'Credenziali non valide o utente non autorizzato' 
          },
          { 
            status: 401,
            headers: corsHeaders(origin)
          }
        );
      }
    } catch (error: any) {
      const elapsed = Date.now() - startTime;
      console.error(`[Staff Auth] Error after ${elapsed}ms:`, error);
      const origin = request.headers.get('origin');
      
      let errorMessage = 'Errore connessione Supabase';
      if (error.message?.includes('timeout')) {
        errorMessage = 'Timeout: Supabase non risponde. Il progetto potrebbe essere in pausa. Verifica su https://supabase.com/dashboard';
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

    // Profile già caricato sopra, verifica solo is_staff

    // Create staff user object
    const user = {
      id: profile.id,
      email: profile.email || email,
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
