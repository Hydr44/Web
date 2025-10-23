import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const error = searchParams.get('error');
  const error_description = searchParams.get('error_description');

  console.log('Auth callback received:', { code: !!code, next, error, error_description });

  // Se c'è un errore OAuth, redirect a login con messaggio
  if (error) {
    console.error('OAuth error:', error, error_description);
    return NextResponse.redirect(
      `${origin}/login?error=oauth_error&message=${encodeURIComponent(error_description || error)}`
    );
  }

  if (code) {
    try {
      const supabase = await supabaseServer();
      
      // Exchange code for session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error('Session exchange error:', exchangeError);
        return NextResponse.redirect(
          `${origin}/login?error=session_exchange_error&message=${encodeURIComponent(exchangeError.message)}`
        );
      }

      if (data?.user) {
        console.log('User authenticated successfully:', data.user.email);
        
        // Redirect to dashboard or specified next URL
        return NextResponse.redirect(`${origin}${next}`);
      }
      
    } catch (error) {
      console.error('Unexpected error in auth callback:', error);
      return NextResponse.redirect(
        `${origin}/login?error=unexpected_error&message=${encodeURIComponent('Errore imprevisto durante l\'autenticazione')}`
      );
    }
  }

  // Se non c'è codice, redirect a login
  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
