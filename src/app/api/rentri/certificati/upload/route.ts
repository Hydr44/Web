/**
 * API Route: Upload Certificato RENTRI .p12
 * POST /api/rentri/certificati/upload
 * 
 * Permette upload del file .p12, estrae certificato e chiave, salva nel DB
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { handleCors, corsHeaders } from "@/lib/cors";
import * as forge from "node-forge";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function POST(request: NextRequest) {
  const headers = corsHeaders(request.headers.get('origin'));
  
  try {
    const formData = await request.formData();
    
    const p12File = formData.get("p12_file") as File;
    const password = formData.get("password") as string;
    const org_id = formData.get("org_id") as string;
    const cf_operatore = formData.get("cf_operatore") as string;
    const ragione_sociale = formData.get("ragione_sociale") as string;
    const environment = formData.get("environment") as string || "demo";
    
    // Validazione input
    if (!p12File || !password || !org_id || !cf_operatore || !ragione_sociale) {
      return NextResponse.json(
        { error: "Parametri mancanti" },
        { status: 400, headers }
      );
    }
    
    console.log("[CERT-UPLOAD] Upload certificato per org:", org_id, "CF:", cf_operatore);
    
    // 1. Leggi file .p12
    const p12Buffer = Buffer.from(await p12File.arrayBuffer());
    
    // 2. Parse .p12 con node-forge
    let p12Asn1;
    try {
      p12Asn1 = forge.asn1.fromDer(p12Buffer.toString('binary'));
    } catch (error) {
      return NextResponse.json(
        { error: "File .p12 non valido o corrotto" },
        { status: 400, headers }
      );
    }
    
    // 3. Estrai certificato e chiave con password
    let p12;
    try {
      p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
    } catch (error) {
      return NextResponse.json(
        { error: "Password errata o file .p12 non valido" },
        { status: 400, headers }
      );
    }
    
    // 4. Estrai chiave privata
    const bags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const keyBag = bags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
    
    if (!keyBag || !keyBag.key) {
      return NextResponse.json(
        { error: "Chiave privata non trovata nel .p12" },
        { status: 400, headers }
      );
    }
    
    const privateKeyPem = forge.pki.privateKeyToPem(keyBag.key as any);
    
    // 5. Estrai certificato
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certBag = certBags[forge.pki.oids.certBag]?.[0];
    
    if (!certBag || !certBag.cert) {
      return NextResponse.json(
        { error: "Certificato non trovato nel .p12" },
        { status: 400, headers }
      );
    }
    
    const certificate = certBag.cert as any;
    const certificatePem = forge.pki.certificateToPem(certificate);
    
    // 6. Estrai date validità
    const issuedAt = certificate.validity.notBefore;
    const expiresAt = certificate.validity.notAfter;
    
    console.log("[CERT-UPLOAD] Certificato estratto:", {
      cf: cf_operatore,
      issued: issuedAt,
      expires: expiresAt
    });
    
    // 7. Verifica scadenza
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Certificato scaduto!" },
        { status: 400, headers }
      );
    }
    
    // 8. Salva nel database
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Prima disattiva eventuali altri certificati default per questa org/env
    await supabase
      .from("rentri_org_certificates")
      .update({ is_default: false })
      .eq("org_id", org_id)
      .eq("environment", environment);
    
    // Inserisci nuovo certificato
    const { data, error } = await supabase
      .from("rentri_org_certificates")
      .insert({
        org_id,
        cf_operatore,
        ragione_sociale,
        certificate_pem: certificatePem,
        private_key_pem: privateKeyPem,
        certificate_password: password, // Salvato criptato in produzione
        environment,
        issued_at: issuedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: true,
        is_default: true
      })
      .select()
      .single();
    
    if (error) {
      console.error("[CERT-UPLOAD] Errore inserimento DB:", error);
      return NextResponse.json(
        { error: "Errore salvataggio certificato", details: error.message },
        { status: 500, headers }
      );
    }
    
    console.log("[CERT-UPLOAD] Certificato salvato con ID:", data.id);
    
    return NextResponse.json({
      success: true,
      certificate_id: data.id,
      cf_operatore,
      environment,
      issued_at: issuedAt,
      expires_at: expiresAt,
      message: "Certificato caricato con successo"
    }, { headers });
    
  } catch (error: any) {
    console.error("[CERT-UPLOAD] Errore:", error);
    return NextResponse.json(
      { error: "Errore interno server", details: error.message },
      { status: 500, headers }
    );
  }
}

