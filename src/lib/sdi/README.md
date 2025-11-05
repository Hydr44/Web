# Libreria SDI (Sistema di Interscambio)

Libreria per l'integrazione con il Sistema di Interscambio (SDI) per la fatturazione elettronica.

## 📁 **Struttura**

```
src/lib/sdi/
├── certificates.ts              # Gestione certificati SDI
├── certificate-verification.ts # Verifica certificati per ricezione
├── xml-generator.ts             # Generazione XML FatturaPA 1.2.2
├── soap-client.ts               # Client SOAP per trasmissione
└── README.md                    # Questa documentazione
```

## 🔧 **Funzionalità**

### **1. Gestione Certificati (`certificates.ts`)**

Funzioni per caricare e gestire certificati SDI:
- `getSDIClientCertPath()` - Percorso certificato SDI client
- `getSDIServerCertPath()` - Percorso certificato SDI server
- `getClientCertPath()` - Percorso certificato client nostro
- `loadSDIClientCert()` - Carica certificato SDI client
- `getSOAPClientConfig()` - Configurazione certificati per SOAP client

### **2. Generazione XML (`xml-generator.ts`)**

Generazione XML FatturaPA 1.2.2 conforme:
- `generateFatturaPAXML()` - Genera XML FatturaPA da dati strutturati
- `invoiceToFatturaPAData()` - Converte fattura database → formato FatturaPA
- `escapeXml()` - Sanitizza testo per XML

### **3. SOAP Client (`soap-client.ts`)**

Client SOAP per trasmissione fatture:
- `sendInvoiceToSDI()` - Invia fattura al SDI tramite web service SOAP
- `generateSDIFileName()` - Genera nome file conforme SDI

### **4. Verifica Certificati (`certificate-verification.ts`)**

Verifica richieste SDI:
- `verifySDIRequest()` - Verifica che richiesta provenga da SDI
- `verifySDICertificate()` - Verifica certificato SDI

## 📝 **Utilizzo**

### **Trasmissione Fattura**

```typescript
import { sendInvoiceToSDI, generateSDIFileName } from '@/lib/sdi/soap-client';
import { generateFatturaPAXML, invoiceToFatturaPAData } from '@/lib/sdi/xml-generator';

// Genera XML da fattura
const fatturaPAData = invoiceToFatturaPAData(invoice, orgSettings);
const xml = generateFatturaPAXML(fatturaPAData);

// Genera nome file
const fileName = generateSDIFileName('02166430856', invoice.number);

// Invia al SDI
const result = await sendInvoiceToSDI(xml, fileName, 'production');

if (result.success) {
  console.log('Fattura inviata:', result.identificativoSDI);
}
```

### **Ricezione Fattura**

```typescript
import { verifySDIRequest } from '@/lib/sdi/certificate-verification';

export async function POST(request: NextRequest) {
  // Verifica richiesta SDI
  if (!verifySDIRequest(request, 'production')) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  // Processa fattura...
}
```

## 🔐 **Certificati**

I certificati sono memorizzati in:
- `certificati/test/` - Certificati ambiente TEST
- `certificati/production/` - Certificati ambiente PRODUZIONE
- `certificati/client/` - Certificati client/server nostri

**⚠️ IMPORTANTE**: I certificati non devono essere committati su Git pubblicamente.

## 🔗 **Riferimenti**

- **Piano Implementazione**: `SDI-project/IMPLEMENTATION_PLAN.md`
- **Documentazione SDI**: https://www.fatturapa.gov.it/
- **WSDL SDI**:
  - Test: https://testservizi.fatturapa.it/SdI2WS_Fatturazione_2.0/SdI2WS_Fatturazione_2.0.wsdl
  - Produzione: https://servizi.fatturapa.it/SdI2WS_Fatturazione_2.0/SdI2WS_Fatturazione_2.0.wsdl

