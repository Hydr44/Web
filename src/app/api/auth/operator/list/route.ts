// GET /api/auth/operator/list
// Lista operatori disponibili per l'utente SSO autenticato
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import jwt from 'jsonwebtoken';

export const runtime = 'nodejs';

// JWT Secret per desktop app (dovrebbe essere in env)
const JWT_SECRET = process.env.JWT_SECRET || 'desktop_oauth_secret_key_change_in_production';

// Verifica token OAuth
function verifyOAuthToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Leggi token Bearer dall'header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token non fornito' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyOAuthToken(token);
    
    if (!decoded || decoded.type !== 'access') {
      return NextResponse.json(
        { error: 'Token non valido o scaduto' },
        { status: 401 }
      );
    }

    const userId = decoded.user_id;
    if (!userId) {
      return NextResponse.json(
        { error: 'Token non valido' },
        { status: 401 }
      );
    }

    const supabase = await supabaseServer();

    // Ottieni org_id dalla query o dal header
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org_id');

    if (!orgId) {
      return NextResponse.json(
        { error: 'org_id richiesto' },
        { status: 400 }
      );
    }

    // Verifica che l'utente appartenga all'org
    const { data: orgMember, error: orgError } = await supabase
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .single();

    if (orgError || !orgMember) {
      return NextResponse.json(
        { error: 'Non autorizzato per questa organizzazione' },
        { status: 403 }
      );
    }

    // Carica operatori dell'org
    // Usa supabaseAdmin per bypassare RLS e vedere tutti gli operatori dell'org
    const { data: operators, error: operatorsError } = await supabaseAdmin
      .from('operators')
      .select('id, nome, cognome, email, codice_operatore, ruolo, attivo')
      .eq('org_id', orgId)
      .eq('attivo', true)
      .order('cognome', { ascending: true })
      .order('nome', { ascending: true });

    if (operatorsError) {
      console.error('Error loading operators:', operatorsError);
      return NextResponse.json(
        { error: 'Errore caricamento operatori' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      operators: operators || [],
    });
  } catch (error: any) {
    console.error('Error in /api/auth/operator/list:', error);
    return NextResponse.json(
      { error: error.message || 'Errore interno' },
      { status: 500 }
    );
  }
}
