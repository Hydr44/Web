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

    // Controlla se l'utente è già membro di organizzazioni
    console.log("Checking existing memberships...");
    const { data: existingMemberships, error: membershipError } = await supabase
      .from("org_members")
      .select("org_id, role")
      .eq("user_id", user.id);

    if (membershipError) {
      console.error("Errore controllo memberships:", membershipError);
      return NextResponse.json(
        { error: `Errore controllo memberships: ${membershipError.message}` },
        { status: 500 }
      );
    }

    console.log("Existing memberships:", existingMemberships);

    // Prima org: qualsiasi utente può crearla. Dalla seconda in poi: solo staff
    if (existingMemberships && existingMemberships.length > 0) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_staff")
        .eq("id", user.id)
        .single();

      if (!profile?.is_staff) {
        return NextResponse.json(
          { error: "Solo lo staff può creare organizzazioni aggiuntive. Hai già un'organizzazione." },
          { status: 403 }
        );
      }
    }

    // Usa la funzione SQL create_organization_with_owner (SECURITY DEFINER = bypassa RLS)
    console.log("Creating organization via RPC...");
    
    const { data: orgId, error: rpcError } = await supabase.rpc("create_organization_with_owner", {
      org_name: name.trim(),
      org_description: description?.trim() || null,
      org_address: address?.trim() || null,
      org_phone: phone?.trim() || null,
      org_email: email?.trim() || null,
      org_website: website?.trim() || null,
      org_vat: vat?.trim() || null,
      org_tax_code: taxCode?.trim() || null
    });

    if (rpcError) {
      console.error("Errore creazione organizzazione:", rpcError);
      return NextResponse.json(
        { error: `Errore creazione organizzazione: ${rpcError.message}` },
        { status: 500 }
      );
    }

    if (!orgId) {
      return NextResponse.json(
        { error: "Errore creazione organizzazione" },
        { status: 500 }
      );
    }

    console.log("Organization created:", orgId);

    return NextResponse.json({
      success: true,
      orgId,
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
