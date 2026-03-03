// src/app/dashboard/download/page.tsx
import { 
  Download, 
  Monitor, 
  Smartphone, 
  Globe, 
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
  Clock,
  Users
} from "lucide-react";

export default function DashboardDownloadPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-white mb-1">Download & Accessi</h1>
        <p className="text-slate-400">
          Scarica le applicazioni e accedi a tutti i servizi RescueManager.
        </p>
      </header>

      {/* App disponibili */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* App Desktop */}
        <div className="p-6 rounded-xl bg-[#1e293b] border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Monitor className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">App Desktop</h3>
              <p className="text-sm text-slate-400">Applicazione completa</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-sm text-slate-400">
              L&apos;applicazione desktop completa per gestire tutti gli aspetti della tua officina di soccorso stradale.
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Gestione completa flotta</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Fatturazione elettronica</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Sincronizzazione automatica</span>
              </div>
            </div>

            <div className="flex gap-2">
              <span className="px-2 py-1 rounded-md bg-slate-700 text-xs font-medium text-slate-300">macOS</span>
              <span className="px-2 py-1 rounded-md bg-slate-700 text-xs font-medium text-slate-300">Windows</span>
            </div>

            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors">
              <Download className="h-4 w-4" />
              Scarica App Desktop
            </button>
          </div>
        </div>

        {/* App Mobile */}
        <div className="p-6 rounded-xl bg-[#1e293b] border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">App Mobile</h3>
              <p className="text-sm text-slate-400">Per autisti</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-sm text-slate-400">
              App dedicata agli autisti per ricevere ordini, aggiornare lo stato dei trasporti e comunicare con l&apos;officina.
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Notifiche push</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>GPS tracking</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Foto e documenti</span>
              </div>
            </div>

            <div className="flex gap-2">
              <span className="px-2 py-1 rounded-md bg-slate-700 text-xs font-medium text-slate-300">iOS</span>
              <span className="px-2 py-1 rounded-md bg-slate-700 text-xs font-medium text-slate-300">Android</span>
            </div>

            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-slate-700 text-white font-medium hover:bg-white/5 transition-colors">
              <Download className="h-4 w-4" />
              Scarica App Mobile
            </button>
          </div>
        </div>

        {/* Accesso Web */}
        <div className="p-6 rounded-xl bg-[#1e293b] border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Accesso Web</h3>
              <p className="text-sm text-slate-400">Dashboard online</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-sm text-slate-400">
              Accedi alla dashboard web per gestire il tuo account, visualizzare report e configurare le impostazioni.
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Sempre aggiornato</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Accesso da qualsiasi browser</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Report e analytics</span>
              </div>
            </div>

            <div className="flex gap-2">
              <span className="px-2 py-1 rounded-md bg-slate-700 text-xs font-medium text-slate-300">Chrome</span>
              <span className="px-2 py-1 rounded-md bg-slate-700 text-xs font-medium text-slate-300">Safari</span>
              <span className="px-2 py-1 rounded-md bg-slate-700 text-xs font-medium text-slate-300">Firefox</span>
            </div>

            <a 
              href="/dashboard" 
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-slate-700 text-white font-medium hover:bg-white/5 transition-colors"
            >
              <Globe className="h-4 w-4" />
              Vai alla Dashboard
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Informazioni aggiuntive */}
      <div className="p-6 rounded-xl bg-[#1e293b] border border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Informazioni Importanti</h3>
            <p className="text-sm text-slate-400">Tutto quello che devi sapere</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
              <Shield className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <div className="font-medium text-slate-100 text-sm">Sicurezza</div>
              <div className="text-xs text-slate-400">Tutti i dati sono protetti con crittografia end-to-end</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
              <Clock className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <div className="font-medium text-slate-100 text-sm">Sincronizzazione</div>
              <div className="text-xs text-slate-400">I dati si sincronizzano automaticamente tra tutti i dispositivi</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <Users className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <div className="font-medium text-slate-100 text-sm">Supporto</div>
              <div className="text-xs text-slate-400">Assistenza tecnica disponibile 24/7 per tutti i piani</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
