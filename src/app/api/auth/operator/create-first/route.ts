// POST /api/auth/operator/create-first
// Crea il primo operatore per un'organizzazione (senza bisogno di essere admin)
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { hashPassword } from '@/lib/operator-auth';
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

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { org_id, username, password, ruolo } = body;

    if (!org_id || !username || !password) {
      return NextResponse.json(
        { error: 'org_id, username e password richiesti' },
        { status: 400 }
      );
    }

    // Verifica che l'utente appartenga all'org
    const { data: orgMember, error: orgError } = await supabase
      .from('org_members')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', org_id)
      .single();

    if (orgError || !orgMember) {
      return NextResponse.json(
        { error: 'Non autorizzato per questa organizzazione' },
        { status: 403 }
      );
    }

    // Verifica che non esista già un operatore per questa org
    const { data: existingOperators, error: checkError } = await supabaseAdmin
      .from('operators')
      .select('id')
      .eq('org_id', org_id)
      .limit(1);

    if (checkError) {
      console.error('Error checking operators:', checkError);
      return NextResponse.json(
        { error: 'Errore verifica operatori esistenti' },
        { status: 500 }
      );
    }

    if (existingOperators && existingOperators.length > 0) {
      return NextResponse.json(
        { error: 'Esiste già un operatore per questa organizzazione. Solo admin possono creare nuovi operatori.' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Verifica che il codice operatore non esista già
    const { data: existing } = await supabaseAdmin
      .from('operators')
      .select('id')
      .eq('org_id', org_id)
      .eq('codice_operatore', username)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Username già esistente' },
        { status: 400 }
      );
    }

    // Crea operatore (il primo è sempre admin)
    const { data: operator, error: createError } = await supabaseAdmin
      .from('operators')
      .insert({
        org_id,
        user_id: userId, // Associa all'utente SSO corrente
        nome: username, // Usa username come nome
        cognome: '', // Vuoto
        email: null,
        codice_operatore: username,
        ruolo: ruolo || 'admin', // Il primo è sempre admin
        password_hash: passwordHash,
        attivo: true,
        permissions: ['*'], // Tutti i permessi
        created_by: userId,
      })
      .select('id, nome, cognome, codice_operatore, ruolo')
      .single();

    if (createError) {
      console.error('Error creating operator:', createError);
      return NextResponse.json(
        { error: 'Errore creazione operatore', details: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      operator,
      message: 'Primo operatore creato con successo. Ruolo: admin.',
    });
  } catch (error: any) {
    console.error('Error in /api/auth/operator/create-first:', error);
    return NextResponse.json(
      { error: error.message || 'Errore interno' },
      { status: 500 }
    );
  }
}
