import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      address,
      phone,
      email,
      website,
      vat,
      taxCode
    } = body;

    // Validazione
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Nome organizzazione richiesto" },
        { status: 400 }
      );
    }

    const supabase = await supabaseServer();
    
    // Verifica autenticazione
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Non autenticato" },
        { status: 401 }
      );
    }

    // Usa la funzione SQL per creare organizzazione
    const { data: orgId, error: createError } = await supabase
      .rpc('create_organization_with_owner', {
        org_name: name.trim(),
        org_description: description?.trim() || null,
        org_address: address?.trim() || null,
        org_phone: phone?.trim() || null,
        org_email: email?.trim() || null,
        org_website: website?.trim() || null,
        org_vat: vat?.trim() || null,
        org_tax_code: taxCode?.trim() || null
      });

    if (createError) {
      console.error("Errore creazione organizzazione:", createError);
      return NextResponse.json(
        { error: "Errore durante la creazione dell'organizzazione" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orgId: orgId,
      message: "Organizzazione creata con successo"
    });

  } catch (error) {
    console.error("Errore API creazione organizzazione:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}
