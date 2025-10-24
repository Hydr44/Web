import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function GET(req: Request) {
  return handleLogout(req);
}

export async function POST(req: Request) {
  return handleLogout(req);
}

async function handleLogout(req: Request) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: "", ...options, maxAge: 0 });
          },
        },
      }
    );

    // Logout da Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error("Logout error:", error);
    }

    // Pulisci tutti i cookie di sessione e redirect
    const baseUrl = new URL(req.url).origin;
    const response = NextResponse.redirect(new URL('/', baseUrl));
    
    // Rimuovi cookie Supabase
    response.cookies.set('sb-access-token', '', { maxAge: 0, path: '/' });
    response.cookies.set('sb-refresh-token', '', { maxAge: 0, path: '/' });
    response.cookies.set('supabase-auth-token', '', { maxAge: 0, path: '/' });
    
    return response;
    
  } catch (error) {
    console.error("Logout route error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}