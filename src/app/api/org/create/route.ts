import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    console.log("API org/create called");
    
    const body = await request.json();
    console.log("Request body:", body);
    
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
      console.log("Validation failed: name required");
      return NextResponse.json(
        { error: "Nome organizzazione richiesto" },
        { status: 400 }
      );
    }

    const supabase = await supabaseServer();
    console.log("Supabase client created");
    
    // Verifica autenticazione
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log("Auth check:", { user: user?.email, error: authError });
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Non autenticato" },
        { status: 401 }
      );
    }

    // Prova prima a creare l'organizzazione manualmente
    console.log("Creating organization manually...");
    
    // 1. Crea organizzazione
    const { data: org, error: orgError } = await supabase
      .from("orgs")
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        website: website?.trim() || null,
        vat: vat?.trim() || null,
        tax_code: taxCode?.trim() || null,
        created_by: user.id
      })
      .select()
      .single();

    if (orgError) {
      console.error("Errore creazione organizzazione:", orgError);
      return NextResponse.json(
        { error: `Errore creazione organizzazione: ${orgError.message}` },
        { status: 500 }
      );
    }

    console.log("Organization created:", org.id);

    // 2. Aggiungi utente come owner
    const { error: memberError } = await supabase
      .from("org_members")
      .insert({
        org_id: org.id,
        user_id: user.id,
        role: "owner"
      });

    if (memberError) {
      console.error("Errore aggiunta membro:", memberError);
      return NextResponse.json(
        { error: `Errore aggiunta membro: ${memberError.message}` },
        { status: 500 }
      );
    }

    console.log("Member added successfully");

    // 3. Aggiorna profilo utente
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        current_org: org.id,
        email: user.email
      });

    if (profileError) {
      console.warn("Errore aggiornamento profilo:", profileError);
      // Non bloccare per questo errore
    }

    console.log("Profile updated successfully");

    return NextResponse.json({
      success: true,
      orgId: org.id,
      message: "Organizzazione creata con successo"
    });

  } catch (error) {
    console.error("Errore API creazione organizzazione:", error);
    return NextResponse.json(
      { error: `Errore interno del server: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
