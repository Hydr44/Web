/**
 * API Route: Crea Registro su RENTRI
 * POST /api/rentri/registri/create
 * 
 * Crea un nuovo registro su RENTRI e lo salva nel database locale
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateRentriJWTDynamic, generateRentriJWTIntegrity } from "@/lib/rentri/jwt-dynamic";
import { handleCors, corsHeaders } from "@/lib/cors";
import { createHash } from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RENTRI_BASE_URL = process.env.RENTRI_GATEWAY_URL || 'https://rentri-test.rescuemanager.eu';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  
  try {
    const { org_id, registro_id } = await request.json();
    
    if (!org_id) {
      return NextResponse.json(
        { error: "org_id mancante" },
        { status: 400, headers }
      );
    }
    
    if (!registro_id) {
      return NextResponse.json(
        { error: "registro_id mancante" },
        { status: 400, headers }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 1. Recupera registro locale
    const { data: registro, error: registroError } = await supabase
      .from("rentri_registri")
      .select("*")
      .eq("id", registro_id)
      .eq("org_id", org_id)
      .single();
    
    if (registroError || !registro) {
      return NextResponse.json(
        { error: "Registro non trovato" },
        { status: 404, headers }
      );
    }
    
    // 2. Se già ha rentri_id, non creare di nuovo
    if (registro.rentri_id) {
      return NextResponse.json(
        { 
          error: "Registro già creato su RENTRI",
          rentri_id: registro.rentri_id
        },
        { status: 400, headers }
      );
    }
    
    // 3. Recupera certificato RENTRI
    const { data: cert, error: certError } = await supabase
      .from("rentri_org_certificates")
      .select("*")
      .eq("org_id", org_id)
      .eq("environment", "demo")
      .eq("is_active", true)
      .eq("is_default", true)
      .single();
    
    if (certError || !cert) {
      return NextResponse.json(
        { error: "Certificato RENTRI non trovato per questa organizzazione" },
        { status: 404, headers }
      );
    }
    
    if (!cert.num_iscr_sito) {
      return NextResponse.json(
        { error: "num_iscr_sito mancante nel certificato. Configura l'unità locale prima di creare registri." },
        { status: 400, headers }
      );
    }
    
    // 4. Prepara payload per RENTRI
    // POST /anagrafiche/v1.0/registri
    // Body: { num_iscr_sito, attivita[], descrizione?, attivita_rec_smalt?[] }
    
    // Mappa tipo locale → attivita RENTRI
    // I valori RENTRI possibili sono: CentroRaccolta, Produzione, Recupero, Smaltimento, Trasporto, IntermediazioneSenzaDetenzione
    // IMPORTANTE: Se attivita contiene "Recupero" o "Smaltimento", attivita_rec_smalt è OBBLIGATORIO
    let attivitaRentri: string[] = ["Produzione"]; // Default sicuro (non richiede attivita_rec_smalt)
    
    if (registro.attivita && Array.isArray(registro.attivita)) {
      // Se abbiamo già attivita salvata nel DB, usiamola
      attivitaRentri = registro.attivita;
    } else {
      // Altrimenti mappiamo dal tipo locale
      // Per sicurezza, evita Recupero/Smaltimento se non abbiamo attivita_rec_smalt
      switch (registro.tipo) {
        case "carico":
          attivitaRentri = ["Produzione"]; // Registro carico → produzione rifiuti
          break;
        case "scarico":
          // Se non abbiamo attivita_rec_smalt salvato, usiamo solo Produzione per evitare errori
          // L'utente può poi modificare manualmente le attività se necessario
          attivitaRentri = ["Produzione"];
          break;
        case "carico_scarico":
          // Stessa logica: evita Recupero/Smaltimento senza codici
          attivitaRentri = ["Produzione"];
          break;
        default:
          attivitaRentri = ["Produzione"]; // Default
      }
    }
    
    // Se abbiamo Recupero/Smaltimento ma non abbiamo attivita_rec_smalt, recuperiamo le autorizzazioni
    let attivitaRecSmalt: string[] = [];
    let haRecuperoSmaltimento = attivitaRentri.some(a => a === "Recupero" || a === "Smaltimento");
    
    if (haRecuperoSmaltimento && (!registro.attivita_rec_smalt || !Array.isArray(registro.attivita_rec_smalt) || registro.attivita_rec_smalt.length === 0)) {
      // Recupera autorizzazioni dal sito per ottenere i codici
      try {
        const num_iscr = cert.num_iscr_sito.split('-')[0];
        const autorizzazioniUrl = `${RENTRI_BASE_URL}/anagrafiche/v1.0/operatore/${num_iscr}/siti/${cert.num_iscr_sito}/autorizzazioni`;
        
        const tempJwtAuth = await generateRentriJWTDynamic({
          issuer: cert.cf_operatore,
          certificatePem: cert.certificate_pem,
          privateKeyPem: cert.private_key_pem,
          audience: 'rentrigov.demo.api',
        });
        
        const authResponse = await fetch(autorizzazioniUrl, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${tempJwtAuth}`,
            "Content-Type": "application/json"
          },
          signal: AbortSignal.timeout(10000)
        });
        
        if (authResponse.ok) {
          const autorizzazioni = await authResponse.json();
          if (Array.isArray(autorizzazioni)) {
            // Estrai tutti i codici attivita_recupero_smaltimento da tutte le autorizzazioni
            const codiciSet = new Set<string>();
            autorizzazioni.forEach((auth: any) => {
              if (auth.attivita_recupero_smaltimento && Array.isArray(auth.attivita_recupero_smaltimento)) {
                auth.attivita_recupero_smaltimento.forEach((codice: string) => {
                  codiciSet.add(codice);
                });
              }
            });
            attivitaRecSmalt = Array.from(codiciSet);
            
            if (attivitaRecSmalt.length === 0) {
              // Nessun codice trovato: rimuovi Recupero/Smaltimento dalle attività
              console.warn(`[RENTRI-REGISTRI] Nessun codice attivita_rec_smalt trovato per ${cert.num_iscr_sito}, rimuovo Recupero/Smaltimento`);
              attivitaRentri = attivitaRentri.filter(a => a !== "Recupero" && a !== "Smaltimento");
              if (attivitaRentri.length === 0) {
                attivitaRentri = ["Produzione"]; // Fallback
              }
              haRecuperoSmaltimento = false; // Aggiorna flag
            }
          }
        } else {
          console.warn(`[RENTRI-REGISTRI] Errore recupero autorizzazioni: ${authResponse.status}, rimuovo Recupero/Smaltimento`);
          attivitaRentri = attivitaRentri.filter(a => a !== "Recupero" && a !== "Smaltimento");
          if (attivitaRentri.length === 0) {
            attivitaRentri = ["Produzione"]; // Fallback
          }
          haRecuperoSmaltimento = false; // Aggiorna flag
        }
      } catch (err) {
        console.error(`[RENTRI-REGISTRI] Errore recupero autorizzazioni:`, err);
        // In caso di errore, rimuovi Recupero/Smaltimento
        attivitaRentri = attivitaRentri.filter(a => a !== "Recupero" && a !== "Smaltimento");
        if (attivitaRentri.length === 0) {
          attivitaRentri = ["Produzione"]; // Fallback
        }
        haRecuperoSmaltimento = false; // Aggiorna flag
      }
    } else if (registro.attivita_rec_smalt && Array.isArray(registro.attivita_rec_smalt) && registro.attivita_rec_smalt.length > 0) {
      // Usa i codici salvati nel DB
      attivitaRecSmalt = registro.attivita_rec_smalt;
    }
    
    const payload: any = {
      num_iscr_sito: cert.num_iscr_sito,
      attivita: attivitaRentri,
      descrizione: registro.numero_registro || registro.unita_locale || null
    };
    
    // Ricalcola haRecuperoSmaltimento dopo eventuali modifiche
    haRecuperoSmaltimento = attivitaRentri.some(a => a === "Recupero" || a === "Smaltimento");
    
    // Aggiungi attivita_rec_smalt solo se necessario e disponibile
    if (haRecuperoSmaltimento && attivitaRecSmalt.length > 0) {
      payload.attivita_rec_smalt = attivitaRecSmalt;
    }
    
    // 5. Genera JWT per autenticazione e integrità
    const jwtAuth = await generateRentriJWTDynamic({
      issuer: cert.cf_operatore,
      certificatePem: cert.certificate_pem,
      privateKeyPem: cert.private_key_pem,
      audience: 'rentrigov.demo.api',
    });
    
    // Calcola digest SHA-256 del body per integrità
    const bodyString = JSON.stringify(payload);
    const bodyHash = createHash('sha256').update(bodyString).digest('base64');
    const digest = `SHA-256=${bodyHash}`;
    
    const jwtIntegrity = await generateRentriJWTIntegrity(
      {
        issuer: cert.cf_operatore,
        certificatePem: cert.certificate_pem,
        privateKeyPem: cert.private_key_pem,
        audience: 'rentrigov.demo.api',
      },
      {
        digest: digest,
        contentType: "application/json"
      }
    );
    
    // 6. Chiama RENTRI per creare registro
    const rentriUrl = `${RENTRI_BASE_URL}/anagrafiche/v1.0/registri`;
    
    console.log(`[RENTRI-REGISTRI] Creazione registro su RENTRI per ${cert.num_iscr_sito}...`);
    
    const rentriResponse = await fetch(rentriUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${jwtAuth}`,
        "Agid-JWT-Signature": jwtIntegrity,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000)
    });
    
    if (!rentriResponse.ok) {
      const errorText = await rentriResponse.text();
      let errorData: any = {};
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText || "Errore sconosciuto" };
      }
      
      console.error("[RENTRI-REGISTRI] Errore creazione registro su RENTRI:", {
        status: rentriResponse.status,
        statusText: rentriResponse.statusText,
        payload,
        error: errorData
      });
      
      // Ritorna errore 500 se è un errore interno del server, altrimenti passa lo status originale
      const statusCode = rentriResponse.status >= 500 ? 500 : rentriResponse.status;
      
      return NextResponse.json(
        {
          error: errorData.title || errorData.detail || errorData.message || "Errore creazione registro su RENTRI",
          status: rentriResponse.status,
          details: errorData
        },
        { status: statusCode, headers }
      );
    }
    
    const createResponse = await rentriResponse.json();
    const rentri_id = createResponse.identificativo;
    
    if (!rentri_id) {
      return NextResponse.json(
        { error: "RENTRI non ha restituito identificativo registro" },
        { status: 500, headers }
      );
    }
    
    console.log(`[RENTRI-REGISTRI] Registro creato su RENTRI: ${rentri_id}`);
    
    // 7. Aggiorna registro locale con rentri_id
    const { error: updateError } = await supabase
      .from("rentri_registri")
      .update({
        rentri_id: rentri_id,
        sync_status: "synced",
        sync_at: new Date().toISOString(),
        sync_error: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", registro_id);
    
    if (updateError) {
      console.error("[RENTRI-REGISTRI] Errore aggiornamento registro locale:", updateError);
      // Non fallire, il registro è stato creato su RENTRI
    }
    
    return NextResponse.json(
      {
        success: true,
        rentri_id: rentri_id,
        registro_id: registro_id,
        message: "Registro creato con successo su RENTRI"
      },
      { status: 200, headers }
    );
    
  } catch (error: any) {
    console.error("[RENTRI-REGISTRI] Errore:", error);
    return NextResponse.json(
      { error: "Errore interno", details: error.message },
      { status: 500, headers }
    );
  }
}

