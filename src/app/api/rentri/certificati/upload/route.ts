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
    console.log("[CERT-UPLOAD] File ricevuto:", {
      name: p12File.name,
      size: p12File.size,
      type: p12File.type
    });
    
    // 1. Leggi file .p12
    console.log("[CERT-UPLOAD] Lettura file in buffer...");
    const arrayBuffer = await p12File.arrayBuffer();
    const p12Buffer = Buffer.from(arrayBuffer);
    console.log("[CERT-UPLOAD] Buffer creato, dimensione:", p12Buffer.length, "bytes");
    
    // 2. Parse .p12 con node-forge
    console.log("[CERT-UPLOAD] Parsing file .p12...");
    let p12Asn1;
    try {
      // Converti buffer a stringa binaria per node-forge
      const binaryString = p12Buffer.toString('binary');
      console.log("[CERT-UPLOAD] Stringa binaria creata, lunghezza:", binaryString.length);
      p12Asn1 = forge.asn1.fromDer(binaryString);
      console.log("[CERT-UPLOAD] ASN1 parsing completato");
    } catch (error: any) {
      console.error("[CERT-UPLOAD] Errore parsing ASN1:", error.message);
      return NextResponse.json(
        { error: "File .p12 non valido o corrotto", details: error.message },
        { status: 400, headers }
      );
    }
    
    // 3. Estrai certificato e chiave con password
    console.log("[CERT-UPLOAD] Estrazione certificato e chiave con password...");
    let p12;
    try {
      p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
      console.log("[CERT-UPLOAD] PKCS12 estratto con successo");
    } catch (error: any) {
      console.error("[CERT-UPLOAD] Errore estrazione PKCS12:", error.message);
      return NextResponse.json(
        { error: "Password errata o file .p12 non valido", details: error.message },
        { status: 400, headers }
      );
    }
    
    // 4. Estrai chiave privata (prova più formati)
    console.log("[CERT-UPLOAD] Estrazione chiave privata...");
    
    // Prova diversi tipi di bag per la chiave
    let privateKey: any = null;
    
    // Tentativo 1: pkcs8ShroudedKeyBag (più comune)
    const shroudedBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    if (shroudedBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]?.key) {
      privateKey = shroudedBags[forge.pki.oids.pkcs8ShroudedKeyBag][0].key;
      console.log("[CERT-UPLOAD] Chiave trovata in pkcs8ShroudedKeyBag");
    }
    
    // Tentativo 2: keyBag
    if (!privateKey) {
      const keyBags = p12.getBags({ bagType: forge.pki.oids.keyBag });
      if (keyBags[forge.pki.oids.keyBag]?.[0]?.key) {
        privateKey = keyBags[forge.pki.oids.keyBag][0].key;
        console.log("[CERT-UPLOAD] Chiave trovata in keyBag");
      }
    }
    
    // Tentativo 3: Cerca in tutti i bag disponibili
    if (!privateKey) {
      console.log("[CERT-UPLOAD] Cerco chiave in tutti i bag disponibili...");
      const allBags = p12.getBags({});
      console.log("[CERT-UPLOAD] Bag disponibili:", Object.keys(allBags));
      
      // Itera su tutti i bag types
      for (const bagType of Object.keys(allBags)) {
        const bags = allBags[bagType];
        if (Array.isArray(bags)) {
          for (const bag of bags) {
            if (bag.key) {
              privateKey = bag.key;
              console.log("[CERT-UPLOAD] Chiave trovata in bag type:", bagType);
              break;
            }
          }
        }
        if (privateKey) break;
      }
    }
    
    if (!privateKey) {
      console.error("[CERT-UPLOAD] Chiave privata non trovata in nessun bag");
      return NextResponse.json(
        { error: "Chiave privata non trovata nel .p12. Il file potrebbe essere corrotto o in un formato non supportato." },
        { status: 400, headers }
      );
    }
    
    console.log("[CERT-UPLOAD] Chiave privata trovata, conversione in PEM...");
    const privateKeyPem = forge.pki.privateKeyToPem(privateKey);
    console.log("[CERT-UPLOAD] Chiave PEM creata, lunghezza:", privateKeyPem.length);
    
    // 5. Estrai certificato
    console.log("[CERT-UPLOAD] Estrazione certificato...");
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certBag = certBags[forge.pki.oids.certBag]?.[0];
    
    if (!certBag || !certBag.cert) {
      console.error("[CERT-UPLOAD] Certificato non trovato");
      return NextResponse.json(
        { error: "Certificato non trovato nel .p12" },
        { status: 400, headers }
      );
    }
    
    console.log("[CERT-UPLOAD] Certificato trovato");
    
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

