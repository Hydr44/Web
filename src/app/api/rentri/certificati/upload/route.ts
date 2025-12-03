/**
 * API Route: Upload Certificato RENTRI .p12
 * POST /api/rentri/certificati/upload
 * 
 * Usa OpenSSL per estrarre certificato e chiave (più robusto di node-forge)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { handleCors, corsHeaders } from "@/lib/cors";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, unlink, readFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

const execAsync = promisify(exec);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function POST(request: NextRequest) {
  const headers = corsHeaders(request.headers.get('origin'));
  
  // File temporanei
  let tempP12: string | null = null;
  let tempCert: string | null = null;
  let tempKey: string | null = null;
  
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
    
    // 1. Salva file .p12 temporaneo
    console.log("[CERT-UPLOAD] Salvataggio file temporaneo...");
    const arrayBuffer = await p12File.arrayBuffer();
    const p12Buffer = Buffer.from(arrayBuffer);
    
    const tempDir = tmpdir();
    const timestamp = Date.now();
    tempP12 = join(tempDir, `cert_${timestamp}.p12`);
    tempCert = join(tempDir, `cert_${timestamp}.pem`);
    tempKey = join(tempDir, `key_${timestamp}.pem`);
    
    await writeFile(tempP12, p12Buffer);
    console.log("[CERT-UPLOAD] File temporaneo salvato:", tempP12);
    
    // 2. Estrai certificato con OpenSSL
    console.log("[CERT-UPLOAD] Estrazione certificato con OpenSSL...");
    // Escape password per shell
    const escapedPassword = password.replace(/'/g, "'\\''");
    const certCmd = `openssl pkcs12 -in "${tempP12}" -clcerts -nokeys -out "${tempCert}" -passin pass:'${escapedPassword}' 2>&1`;
    
    try {
      const { stdout: certOut, stderr: certErr } = await execAsync(certCmd);
      console.log("[CERT-UPLOAD] OpenSSL cert output:", certOut);
      if (certErr) console.log("[CERT-UPLOAD] OpenSSL cert stderr:", certErr);
      
      // Verifica che il comando sia riuscito
      if (certOut.includes('invalid') || certOut.includes('error') || certOut.includes('Error')) {
        throw new Error("Password errata o file .p12 non valido");
      }
      
      console.log("[CERT-UPLOAD] Certificato estratto con successo");
    } catch (error: any) {
      console.error("[CERT-UPLOAD] Errore estrazione certificato:", error.message, error.stderr);
      return NextResponse.json(
        { error: "Password errata o file .p12 corrotto", details: error.message },
        { status: 400, headers }
      );
    }
    
    // 3. Estrai chiave privata con OpenSSL
    console.log("[CERT-UPLOAD] Estrazione chiave privata con OpenSSL...");
    const keyCmd = `openssl pkcs12 -in "${tempP12}" -nocerts -nodes -out "${tempKey}" -passin pass:'${escapedPassword}' 2>&1`;
    
    try {
      const { stdout: keyOut, stderr: keyErr } = await execAsync(keyCmd);
      console.log("[CERT-UPLOAD] OpenSSL key output:", keyOut);
      if (keyErr) console.log("[CERT-UPLOAD] OpenSSL key stderr:", keyErr);
      
      if (keyOut.includes('invalid') || keyOut.includes('error') || keyOut.includes('Error')) {
        throw new Error("Impossibile estrarre chiave privata");
      }
      
      console.log("[CERT-UPLOAD] Chiave privata estratta con successo");
    } catch (error: any) {
      console.error("[CERT-UPLOAD] Errore estrazione chiave:", error.message, error.stderr);
      return NextResponse.json(
        { error: "Impossibile estrarre chiave privata dal certificato", details: error.message },
        { status: 400, headers }
      );
    }
    
    // 4. Leggi certificato e chiave
    const certificatePem = await readFile(tempCert, 'utf-8');
    const privateKeyPem = await readFile(tempKey, 'utf-8');
    
    console.log("[CERT-UPLOAD] Certificato PEM letto, lunghezza:", certificatePem.length);
    console.log("[CERT-UPLOAD] Chiave PEM letta, lunghezza:", privateKeyPem.length);
    
    // Verifica che non siano vuoti
    if (!certificatePem.includes('BEGIN CERTIFICATE') || !privateKeyPem.includes('BEGIN')) {
      return NextResponse.json(
        { error: "Certificato o chiave estratti non validi" },
        { status: 400, headers }
      );
    }
    
    // 5. Estrai date validità dal certificato con OpenSSL
    console.log("[CERT-UPLOAD] Estrazione date validità...");
    const datesCmd = `openssl x509 -in "${tempCert}" -noout -dates 2>&1`;
    const { stdout: datesOut } = await execAsync(datesCmd);
    
    console.log("[CERT-UPLOAD] Date output:", datesOut);
    
    // Parse date: "notBefore=Dec  3 14:12:12 2025 GMT" e "notAfter=Dec  3 14:12:12 2027 GMT"
    const notBeforeMatch = datesOut.match(/notBefore=(.+)/);
    const notAfterMatch = datesOut.match(/notAfter=(.+)/);
    
    const issuedAt = notBeforeMatch ? new Date(notBeforeMatch[1]) : new Date();
    const expiresAt = notAfterMatch ? new Date(notAfterMatch[1]) : new Date(Date.now() + 730 * 24 * 60 * 60 * 1000);
    
    console.log("[CERT-UPLOAD] Certificato estratto:", {
      cf: cf_operatore,
      issued: issuedAt,
      expires: expiresAt
    });
    
    // 6. Verifica scadenza
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Certificato scaduto!" },
        { status: 400, headers }
      );
    }
    
    // 7. Salva nel database
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
        certificate_password: password,
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
    
    // Pulizia file temporanei
    try {
      if (tempP12) await unlink(tempP12);
      if (tempCert) await unlink(tempCert);
      if (tempKey) await unlink(tempKey);
      console.log("[CERT-UPLOAD] File temporanei rimossi");
    } catch (cleanupError) {
      console.warn("[CERT-UPLOAD] Errore rimozione file temporanei:", cleanupError);
    }
    
    return NextResponse.json({
      success: true,
      certificate_id: data.id,
      cf_operatore,
      environment,
      issued_at: issuedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      message: "Certificato caricato con successo"
    }, { headers });
    
  } catch (error: any) {
    console.error("[CERT-UPLOAD] Errore:", error);
    
    // Pulizia file temporanei in caso di errore
    try {
      if (tempP12) await unlink(tempP12);
      if (tempCert) await unlink(tempCert);
      if (tempKey) await unlink(tempKey);
    } catch (cleanupError) {
      console.warn("[CERT-UPLOAD] Errore rimozione file temporanei:", cleanupError);
    }
    
    return NextResponse.json(
      { error: "Errore interno server", details: error.message },
      { status: 500, headers }
    );
  }
}
