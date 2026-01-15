// POST /api/auth/operator/create
// Crea un nuovo operatore (solo admin org)
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
    const { org_id, nome, cognome, email, password, ruolo, codice_operatore } = body;

    if (!org_id || !nome || !cognome || !password) {
      return NextResponse.json(
        { error: 'org_id, nome, cognome e password richiesti' },
        { status: 400 }
      );
    }

    // Verifica che l'utente sia admin dell'org
    const { data: orgMember, error: orgError } = await supabase
      .from('org_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('org_id', org_id)
      .single();

    if (orgError || !orgMember || orgMember.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo admin organizzazione possono creare operatori' },
        { status: 403 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Genera codice operatore se non fornito
    let finalCodice = codice_operatore;
    if (!finalCodice) {
      const { data: codeData } = await supabaseAdmin.rpc('generate_operator_code', {
        org_uuid: org_id
      });
      finalCodice = codeData || null;
    }

    // Verifica unicità codice se fornito
    if (finalCodice) {
      const { data: existing } = await supabaseAdmin
        .from('operators')
        .select('id')
        .eq('org_id', org_id)
        .eq('codice_operatore', finalCodice)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'Codice operatore già esistente' },
          { status: 400 }
        );
      }
    }

    // Crea operatore
    const { data: operator, error: createError } = await supabaseAdmin
      .from('operators')
      .insert({
        org_id,
        user_id: user.id, // Opzionale: può essere null
        nome,
        cognome,
        email: email || null,
        codice_operatore: finalCodice,
        ruolo: ruolo || 'operatore',
        password_hash: passwordHash,
        attivo: true,
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
    });
  } catch (error: any) {
    console.error('Error in /api/auth/operator/create:', error);
    return NextResponse.json(
      { error: error.message || 'Errore interno' },
      { status: 500 }
    );
  }
}
