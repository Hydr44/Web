/**
 * API Endpoint: Recupera i siti RENTRI per un operatore
 * 
 * GET /api/rentri/siti?org_id={org_id}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getRentriSitiOperatore } from '@/lib/rentri/get-siti-operatore';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const org_id = searchParams.get('org_id');
    
    if (!org_id) {
      return NextResponse.json(
        { error: 'org_id richiesto' },
        { status: 400 }
      );
    }
    
    // 1. Recupera certificato RENTRI per l'organizzazione
    const { data: cert, error: certError } = await supabase
      .from('rentri_org_certificates')
      .select('*')
      .eq('org_id', org_id)
      .eq('is_active', true)
      .eq('environment', 'demo')
      .single();
      
    if (certError || !cert) {
      return NextResponse.json(
        { error: 'Certificato RENTRI non trovato per questa organizzazione' },
        { status: 404 }
      );
    }
    
    // 2. Estrai num_iscr_operatore dal dnQualifier del certificato
    // Il subject del cert contiene: dnQualifier=RENTRI-100011134
    // Il num_iscr_operatore è: OP10001113400 (13 caratteri)
    
    // Parse del certificato X.509 usando node-forge
    const forge = require('node-forge');
    
    let dnCode: string | null = null;
    
    try {
      // Converti PEM a certificato forge
      const certificate = forge.pki.certificateFromPem(cert.certificate_pem);
      
      // Estrai subject
      const subject = certificate.subject;
      
      // Cerca dnQualifier negli attributi del subject
      for (const attr of subject.attributes) {
        console.log('[RENTRI-SITI] Attributo:', attr.name, '=', attr.value);
        
        // node-forge usa shortName "dnQualifier" o name "2.5.4.46"
        if (attr.name === 'dnQualifier' || attr.shortName === 'dnQualifier' || attr.type === '2.5.4.46') {
          const value = attr.value as string;
          // Value è "RENTRI-100011134"
          const match = value.match(/RENTRI-(\d+)/i);
          if (match) {
            dnCode = match[1];
            console.log('[RENTRI-SITI] dnQualifier trovato:', value, '→ codice:', dnCode);
            break;
          }
        }
      }
      
      if (!dnCode) {
        throw new Error('dnQualifier non trovato negli attributi del certificato');
      }
      
    } catch (parseError: any) {
      console.error('[RENTRI-SITI] Errore parse certificato:', parseError);
      throw new Error(`Impossibile parsare il certificato: ${parseError.message}`);
    }
    
    const numIscrOperatore = `OP${dnCode}00`; // Es: "OP10001113400" (13 caratteri)
    
    console.log('[RENTRI-SITI] Recupero siti per operatore:', numIscrOperatore);
    
    // 3. Chiama API RENTRI per recuperare i siti
    const siti = await getRentriSitiOperatore(numIscrOperatore, {
      cf_operatore: cert.cf_operatore,
      certificate_pem: cert.certificate_pem,
      private_key_pem: cert.private_key_pem,
      environment: cert.environment
    });
    
    console.log('[RENTRI-SITI] Siti trovati:', siti.length);
    
    return NextResponse.json({
      success: true,
      num_iscr_operatore: numIscrOperatore,
      siti: siti
    });
    
  } catch (error: any) {
    console.error('[RENTRI-SITI] Errore:', error);
    return NextResponse.json(
      { error: error.message || 'Errore recupero siti RENTRI' },
      { status: 500 }
    );
  }
}

