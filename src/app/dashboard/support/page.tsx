import { 
  LifeBuoy, 
  MessageCircle, 
  BookOpen, 
  Mail, 
  Phone, 
  ArrowRight,
  Zap,
  Clock,
  CheckCircle2
} from "lucide-react";

export default function SupportPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="text-center lg:text-left">
        <div className="inline-flex items-center gap-2 text-sm rounded-full ring-1 ring-primary/30 px-4 py-2 mb-6 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary font-medium">
          <LifeBuoy className="h-4 w-4" />
          Supporto Tecnico
        </div>
        
        <h1 className="text-3xl lg:text-4xl font-bold text-slate-100 mb-4">
          Il nostro <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">supporto</span>
        </h1>
        
        <p className="text-lg text-slate-400 max-w-2xl">
          Siamo qui per aiutarti! Contatta il nostro team di supporto tecnico per assistenza immediata.
        </p>
      </header>

      {/* Canali di supporto */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Ticket di supporto */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-gray-50/50 border border-[#243044] shadow-lg shadow-black/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Ticket di Supporto</h3>
              <p className="text-sm text-slate-400">Assistenza prioritaria</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-sm text-slate-400">
              Apri un ticket per ricevere assistenza tecnica dedicata. Risposta garantita entro 24 ore.
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Clock className="h-4 w-4 text-blue-500" />
              <span>Tempo di risposta: 24h</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-400">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Disponibile per tutti i piani</span>
            </div>

            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-medium hover:shadow-lg shadow-black/20 transition-all duration-200">
              <MessageCircle className="h-4 w-4" />
              Apri un ticket
            </button>
          </div>
        </div>

        {/* Documentazione */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-blue-50/30 border border-primary/20 shadow-lg shadow-black/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Documentazione</h3>
              <p className="text-sm text-slate-400">Guide e FAQ</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-sm text-slate-400">
              Consulta la nostra documentazione completa con guide dettagliate e risposte alle domande più frequenti.
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Guide passo-passo</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>FAQ dettagliate</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Video tutorial</span>
              </div>
            </div>

            <a 
              href="#" 
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#1a2536] border border-[#243044] text-slate-300 font-medium hover:border-primary/30 hover:shadow-md transition-all duration-200"
            >
              <BookOpen className="h-4 w-4" />
              Vai alla documentazione
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Contatti diretti */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/5 via-white to-blue-50/30 border border-primary/20 shadow-lg shadow-black/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 flex items-center justify-center">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Contatti Diretti</h3>
            <p className="text-sm text-slate-400">Per emergenze e supporto urgente</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[#1a2536] border border-[#243044]">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/100/10 flex items-center justify-center">
              <Mail className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <div className="font-medium text-slate-100">Email</div>
              <div className="text-sm text-slate-400">support@rescuemanager.it</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-[#1a2536] border border-[#243044]">
            <div className="w-8 h-8 rounded-lg bg-blue-500/100/10 flex items-center justify-center">
              <Phone className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <div className="font-medium text-slate-100">Telefono</div>
              <div className="text-sm text-slate-400">+39 02 1234 5678</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}