// POST /api/auth/operator/create-first
// Crea il primo operatore per un'organizzazione (senza bisogno di essere admin)
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { hashPassword } from '@/lib/operator-auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // Verifica autenticazione SSO
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      );
    }

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
      .eq('user_id', user.id)
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
        user_id: user.id, // Associa all'utente SSO corrente
        nome: username, // Usa username come nome
        cognome: '', // Vuoto
        email: null,
        codice_operatore: username,
        ruolo: ruolo || 'admin', // Il primo è sempre admin
        password_hash: passwordHash,
        attivo: true,
        permissions: ['*'], // Tutti i permessi
        created_by: user.id,
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
