import Link from "next/link";
import { ArrowLeft, Calculator, TrendingUp, FileText, CheckCircle2, AlertCircle } from "lucide-react";

export default function ContabilitaPage() {
  return (
    <main className="min-h-screen bg-[#141c27] pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna alla home
        </Link>

        <div className="mb-12">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/30 mb-6">
            <Calculator className="h-5 w-5 text-purple-400" />
            <span className="text-sm font-medium text-purple-400">Modulo Specializzato</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-100 mb-4">
            Contabilità
          </h1>
          <p className="text-lg text-slate-400 max-w-3xl">
            Sistema completo di contabilità con prima nota, piano dei conti personalizzabile e partita doppia. Integrazione diretta con fatturazione elettronica SDI.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="p-6 rounded-xl bg-[#1a2536] border border-[#243044]">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
              <Calculator className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Piano dei Conti</h3>
            <p className="text-sm text-slate-400">
              Piano dei conti personalizzabile con struttura gerarchica. Conti patrimoniali, economici, costi e ricavi. Codifica standard italiana.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#1a2536] border border-[#243044]">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Prima Nota</h3>
            <p className="text-sm text-slate-400">
              Registrazione movimenti contabili con partita doppia automatica. Dare/Avere, causali predefinite e ricerca avanzata per periodo e conto.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#1a2536] border border-[#243044]">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Bilancio e Report</h3>
            <p className="text-sm text-slate-400">
              Bilancio di verifica, conto economico e stato patrimoniale. Report personalizzabili per periodo con export Excel e PDF.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#1a2536] border border-[#243044]">
            <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Integrazione SDI</h3>
            <p className="text-sm text-slate-400">
              Registrazione automatica fatture attive e passive da SDI. Collegamento diretto tra fattura elettronica e movimento contabile.
            </p>
          </div>
        </div>

        {/* Causali predefinite */}
        <div className="p-6 rounded-xl bg-[#1a2536] border border-[#243044] mb-12">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Causali Contabili Predefinite</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="text-sm">
              <span className="font-medium text-emerald-400">Fattura Emessa</span>
              <div className="text-xs text-slate-500 mt-0.5">Registrazione fatture attive da SDI</div>
            </div>
            <div className="text-sm">
              <span className="font-medium text-blue-400">Fattura Ricevuta</span>
              <div className="text-xs text-slate-500 mt-0.5">Import fatture passive fornitori</div>
            </div>
            <div className="text-sm">
              <span className="font-medium text-purple-400">Incasso Cliente</span>
              <div className="text-xs text-slate-500 mt-0.5">Registrazione pagamenti ricevuti</div>
            </div>
            <div className="text-sm">
              <span className="font-medium text-amber-400">Pagamento Fornitore</span>
              <div className="text-xs text-slate-500 mt-0.5">Registrazione pagamenti effettuati</div>
            </div>
            <div className="text-sm">
              <span className="font-medium text-slate-400">Nota Spese</span>
              <div className="text-xs text-slate-500 mt-0.5">Costi operativi e spese generali</div>
            </div>
            <div className="text-sm">
              <span className="font-medium text-slate-400">Stipendi</span>
              <div className="text-xs text-slate-500 mt-0.5">Costo del personale e contributi</div>
            </div>
          </div>
        </div>

        {/* Struttura piano dei conti */}
        <div className="p-6 rounded-xl bg-[#1a2536] border border-[#243044] mb-12">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Struttura Piano dei Conti</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-blue-400">1</span>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">Stato Patrimoniale</div>
                <div className="text-xs text-slate-500">Attività (cassa, banca, crediti) e Passività (debiti, mutui)</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-emerald-400">2</span>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">Conto Economico</div>
                <div className="text-xs text-slate-500">Ricavi (vendite, servizi) e Costi (acquisti, personale, ammortamenti)</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-purple-400">3</span>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">Conti d'Ordine</div>
                <div className="text-xs text-slate-500">Impegni, garanzie e rischi non iscritti in bilancio</div>
              </div>
            </div>
          </div>
        </div>

        {/* Alert commercialista */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-8 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-amber-400 mb-1">Supporto Commercialista</h3>
            <p className="text-xs text-slate-400">
              Il modulo Contabilità è pensato per la gestione operativa quotidiana. Per dichiarazioni fiscali e bilancio civilistico consigliamo sempre il supporto di un commercialista.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-purple-500/10 border border-purple-500/30">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-purple-400 mt-0.5" />
            <div>
              <h3 className="text-base font-semibold text-slate-100 mb-2">Modulo a scelta nei piani</h3>
              <p className="text-sm text-slate-400">
                Disponibile come modulo selezionabile nei piani Starter (1 modulo), Professional (2 moduli), Business (3 moduli) o incluso nel piano Full.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex gap-4">
          <Link
            href="/contatti"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors"
          >
            Richiedi Demo
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#243044] bg-[#1a2536] text-slate-300 font-medium hover:bg-[#243044] transition-colors"
          >
            Scopri altri moduli
          </Link>
        </div>
      </div>
    </main>
  );
}
