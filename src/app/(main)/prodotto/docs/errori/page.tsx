"use client";

import { useState } from "react";
import { AlertCircle, Search, BookOpen } from "lucide-react";

interface ErrorInfo {
  code: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  solution: string;
  related: string[];
}

const errorCategories = [
  {
    id: "database",
    name: "Database & Sincronizzazione",
    prefix: "DB",
    icon: "💾",
    color: "blue",
    errors: [
      {
        code: "DB-SYNC-1001",
        title: "Errore connessione database",
        severity: "high" as const,
        solution: "Verifica la connessione internet. Se il problema persiste, contatta il supporto.",
        related: ["connettività", "sincronizzazione", "database"]
      },
      {
        code: "DB-SYNC-1002",
        title: "Timeout query database",
        severity: "medium" as const,
        solution: "Riprova l'operazione. Se il problema persiste, chiudi e riapri l'app.",
        related: ["timeout", "performance", "database"]
      },
      {
        code: "DB-QUERY-1003",
        title: "Query database non valida",
        severity: "high" as const,
        solution: "Aggiorna l'app all'ultima versione disponibile dalla sezione Impostazioni.",
        related: ["aggiornamenti", "versioni", "database"]
      },
      {
        code: "DB-PERM-1004",
        title: "Permessi insufficienti",
        severity: "critical" as const,
        solution: "Contatta l'amministratore della tua organizzazione per ottenere i permessi necessari.",
        related: ["permessi", "autorizzazioni", "admin"]
      }
    ]
  },
  {
    id: "oauth",
    name: "Autenticazione OAuth",
    prefix: "OAUTH",
    icon: "🔐",
    color: "purple",
    errors: [
      {
        code: "OAUTH-AUTH-2001",
        title: "Token scaduto",
        severity: "medium" as const,
        solution: "Effettua di nuovo il login dal menu utente. La sessione scade dopo 1 ora di inattività.",
        related: ["login", "autenticazione", "token"]
      },
      {
        code: "OAUTH-AUTH-2002",
        title: "Token non valido",
        severity: "high" as const,
        solution: "Esegui logout dal menu utente e rieffettua il login.",
        related: ["logout", "login", "autenticazione"]
      },
      {
        code: "OAUTH-AUTH-2003",
        title: "Errore server OAuth",
        severity: "high" as const,
        solution: "Il server di autenticazione è temporaneamente non disponibile. Riprova tra qualche minuto.",
        related: ["server", "autenticazione", "connessione"]
      },
      {
        code: "OAUTH-CALL-2004",
        title: "Callback OAuth fallito",
        severity: "medium" as const,
        solution: "Rimuovi la cache del browser (Cache + LocalStorage) e riprova il login.",
        related: ["callback", "browser", "cache"]
      }
    ]
  },
  {
    id: "sync",
    name: "Sincronizzazione Dati",
    prefix: "SYNC",
    icon: "🔄",
    color: "green",
    errors: [
      {
        code: "SYNC-PULL-3001",
        title: "Errore download dati",
        severity: "medium" as const,
        solution: "Verifica la connessione internet. I dati rimangono salvati localmente.",
        related: ["download", "dati", "connessione"]
      },
      {
        code: "SYNC-PUSH-3002",
        title: "Errore upload dati",
        severity: "high" as const,
        solution: "Riprova l'upload. I dati sono salvati localmente e verranno sincronizzati automaticamente.",
        related: ["upload", "dati", "sincronizzazione"]
      },
      {
        code: "SYNC-CONF-3003",
        title: "Conflitto dati",
        severity: "high" as const,
        solution: "I dati locali entrano in conflitto con quelli del server. Contatta il supporto per risoluzione manuale.",
        related: ["conflitto", "dati", "server"]
      },
      {
        code: "SYNC-NET-3004",
        title: "Timeout sincronizzazione",
        severity: "medium" as const,
        solution: "La sincronizzazione sta richiedendo troppo tempo. Riprova più tardi o verifica la connessione.",
        related: ["timeout", "sincronizzazione", "performance"]
      }
    ]
  },
  {
    id: "rvfu",
    name: "RVFU & Demolizioni",
    prefix: "RVFU",
    icon: "🚗",
    color: "orange",
    errors: [
      {
        code: "RVFU-AUTH-4001",
        title: "Credenziali RVFU non valide",
        severity: "critical" as const,
        solution: "Verifica le credenziali MIT nella sezione Impostazioni → RVFU. Assicurati che siano attive.",
        related: ["credenziali", "rvfu", "mit"]
      },
      {
        code: "RVFU-IMPORT-4002",
        title: "Errore import dati RVFU",
        severity: "high" as const,
        solution: "Controlla il formato dei dati secondo le specifiche MIT. La documentazione è disponibile in Help.",
        related: ["import", "dati", "formato"]
      },
      {
        code: "RVFU-DOC-4003",
        title: "Documento RVFU non valido",
        severity: "high" as const,
        solution: "Verifica che il documento rispetti il formato richiesto dal MIT. Consulta la guida in Help.",
        related: ["documento", "formato", "mit"]
      },
      {
        code: "RVFU-SYNC-4004",
        title: "Errore sincronizzazione MIT",
        severity: "high" as const,
        solution: "Il server MIT è temporaneamente non disponibile. Riprova tra qualche ora.",
        related: ["mit", "sincronizzazione", "server"]
      }
    ]
  },
  {
    id: "fatturazione",
    name: "Fatturazione Elettronica",
    prefix: "FATT",
    icon: "💰",
    color: "yellow",
    errors: [
      {
        code: "FATT-SDI-5001",
        title: "Errore invio fattura SDI",
        severity: "high" as const,
        solution: "Verifica la connessione con SDI e che il codice destinatario sia valido.",
        related: ["sdi", "fattura", "invio"]
      },
      {
        code: "FATT-XML-5002",
        title: "XML fattura non valido",
        severity: "high" as const,
        solution: "Correggi i dati della fattura. Verifica CF, PIVA e altri campi obbligatori.",
        related: ["xml", "fattura", "validazione"]
      },
      {
        code: "FATT-CF-5003",
        title: "Codice fiscale non valido",
        severity: "high" as const,
        solution: "Verifica il codice fiscale del destinatario. Deve essere di 16 caratteri per persone fisiche o 11 per persone giuridiche.",
        related: ["codice fiscale", "validazione", "destinatario"]
      },
      {
        code: "FATT-SIGN-5004",
        title: "Errore firma digitale",
        severity: "critical" as const,
        solution: "Riconfigura la firma digitale nella sezione Impostazioni → Fatturazione.",
        related: ["firma digitale", "configurazione"]
      }
    ]
  }
];

export default function ErroriPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch(severity) {
      case 'critical': return 'Critico';
      case 'high': return 'Alto';
      case 'medium': return 'Medio';
      default: return 'Basso';
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-16 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Gestione Errori</h1>
        <p className="text-xl text-gray-600">
          Trova la soluzione ai problemi più comuni con i relativi codici errore
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca per codice errore (es: DB-SYNC-1001) o parola chiave..."
          className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* How to find error code */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <div className="flex items-start gap-4">
          <BookOpen className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold mb-2">Come trovare il codice errore</h3>
            <p className="text-sm text-gray-700 mb-2">
              Quando si verifica un errore nell'app desktop, compare un codice nella forma:
            </p>
            <code className="bg-white px-3 py-1 rounded border text-sm">
              TIPO-FASE-NUMERO (es: OAUTH-AUTH-2001)
            </code>
            <p className="text-sm text-gray-700 mt-3">
              Cerca qui il codice per trovare la soluzione specifica al problema.
            </p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-8">
        {errorCategories.map((category) => {
          const filteredErrors = category.errors.filter(error => 
            search === "" || 
            error.code.toLowerCase().includes(search.toLowerCase()) ||
            error.title.toLowerCase().includes(search.toLowerCase()) ||
            error.solution.toLowerCase().includes(search.toLowerCase())
          );

          if (filteredErrors.length === 0 && search !== "") return null;

          return (
            <div key={category.id} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{category.icon}</span>
                <h2 className="text-2xl font-semibold">{category.name}</h2>
              </div>
              
              <div className="space-y-4">
                {filteredErrors.map((error) => (
                  <div
                    key={error.code}
                    className="bg-white border-2 rounded-lg p-5 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <AlertCircle className={`h-6 w-6 text-${category.color}-500 flex-shrink-0`} />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900">{error.title}</h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border-2 ${getSeverityColor(error.severity)}`}>
                          {getSeverityLabel(error.severity)}
                        </span>
                        <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono border border-gray-200">
                          {error.code}
                        </code>
                      </div>
                    </div>
                    
                    <div className="ml-9">
                      <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-3">
                        <p className="text-sm text-gray-700">
                          <strong>💡 Soluzione:</strong> {error.solution}
                        </p>
                      </div>
                      
                      <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                        <span className="font-medium">Tags:</span>
                        {error.related.map((tag, idx) => (
                          <span key={idx} className="bg-gray-100 px-2 py-1 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* No results */}
      {search && errorCategories.every(cat => 
        cat.errors.filter(e => e.code.toLowerCase().includes(search.toLowerCase())).length === 0
      ) && (
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-lg text-gray-600 mb-2">Nessun risultato trovato</p>
          <p className="text-sm text-gray-500">
            Prova con un altro codice o parola chiave
          </p>
        </div>
      )}

      {/* How to report */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">📧 Come segnalare un errore</h3>
        <p className="text-sm text-gray-700 mb-4">
          Se non trovi la soluzione qui, segnala l'errore al supporto includendo:
        </p>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          <li>Il <strong>codice errore completo</strong> (es: <code className="bg-white px-2 py-1 rounded">OAUTH-AUTH-2001</code>)</li>
          <li>Una <strong>descrizione dettagliata</strong> del problema</li>
          <li><strong>Screenshot</strong> dell'errore (se possibile)</li>
          <li>Il <strong>timestamp</strong> esatto dell'errore</li>
          <li>Versione app e sistema operativo</li>
        </ul>
        <div className="mt-4">
          <a
            href="mailto:support@rescuemanager.eu"
            className="text-blue-600 hover:underline text-sm font-medium"
          >
            Contatta Supporto →
          </a>
        </div>
      </div>
    </div>
  );
}

