// Client Aruba Fatturazione Elettronica
// Sostituisce l'invio diretto a SDI con Aruba come intermediario

interface ArubaConfig {
  apiKey: string;
  apiSecret?: string;
  endpoint: string; // es: https://ws.fatturazioneelettronica.aruba.it/api/v1
  webhookUrl?: string; // URL dove Aruba invia notifiche
}

interface ArubaInvoiceRequest {
  xml: string; // XML FatturaPA completo
  fileName: string; // es: IT02166430856_00001.xml
  metadata?: {
    invoiceId?: string;
    customerName?: string;
    invoiceNumber?: string;
  };
}

interface ArubaInvoiceResponse {
  success: boolean;
  invoiceId?: string; // ID Aruba della fattura
  sdiId?: string; // Identificativo SDI (se già disponibile)
  status?: string; // pending, sent, accepted, rejected
  error?: string;
}

export class ArubaClient {
  private config: ArubaConfig;

  constructor(config: ArubaConfig) {
    this.config = config;
  }

  /**
   * Invia una fattura ad Aruba
   * Aruba gestirà: firma digitale, invio SDI, notifiche
   */
  async sendInvoice(request: ArubaInvoiceRequest): Promise<ArubaInvoiceResponse> {
    try {
      const response = await fetch(`${this.config.endpoint}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-API-Key': this.config.apiKey,
        },
        body: JSON.stringify({
          xml: request.xml,
          filename: request.fileName,
          metadata: request.metadata,
          webhook_url: this.config.webhookUrl, // URL per notifiche
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Errore sconosciuto' }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        invoiceId: data.invoice_id,
        sdiId: data.sdi_id,
        status: data.status || 'pending',
      };
    } catch (error: any) {
      console.error('[Aruba] Errore invio fattura:', error);
      return {
        success: false,
        error: error.message || 'Errore invio ad Aruba',
      };
    }
  }

  /**
   * Verifica stato di una fattura inviata
   */
  async getInvoiceStatus(invoiceId: string): Promise<ArubaInvoiceResponse> {
    try {
      const response = await fetch(`${this.config.endpoint}/invoices/${invoiceId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-API-Key': this.config.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        invoiceId: data.invoice_id,
        sdiId: data.sdi_id,
        status: data.status,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Scarica PDF fattura generato da Aruba
   */
  async getInvoicePdf(invoiceId: string): Promise<Buffer | null> {
    try {
      const response = await fetch(`${this.config.endpoint}/invoices/${invoiceId}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-API-Key': this.config.apiKey,
        },
      });

      if (!response.ok) {
        return null;
      }

      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      console.error('[Aruba] Errore download PDF:', error);
      return null;
    }
  }
}

// Factory per creare client Aruba da variabili d'ambiente
export function createArubaClient(): ArubaClient | null {
  const apiKey = process.env.ARUBA_API_KEY;
  const endpoint = process.env.ARUBA_ENDPOINT || 'https://ws.fatturazioneelettronica.aruba.it/api/v1';
  const webhookUrl = process.env.ARUBA_WEBHOOK_URL;

  if (!apiKey) {
    console.warn('[Aruba] ARUBA_API_KEY non configurata');
    return null;
  }

  return new ArubaClient({
    apiKey,
    endpoint,
    webhookUrl,
  });
}

