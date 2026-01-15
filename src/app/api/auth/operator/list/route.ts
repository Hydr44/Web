// GET /api/auth/operator/list
// Lista operatori disponibili per l'utente SSO autenticato
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
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
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .single();

    if (orgError || !orgMember) {
      return NextResponse.json(
        { error: 'Non autorizzato per questa organizzazione' },
        { status: 403 }
      );
    }

    // Carica operatori dell'org
    const { data: operators, error: operatorsError } = await supabase
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
