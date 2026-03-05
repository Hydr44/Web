import Link from "next/link";
import { ArrowLeft, Truck, UserCheck, Wrench, MapPin, Clock, ArrowRight } from "lucide-react";

export default function MezziAutistiPage() {
  return (
    <main className="bg-white">
      <section className="pt-16 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Torna alla home
          </Link>
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">App Base</p>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-[1.05]">
            Mezzi & Autisti<span className="text-blue-500">.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            Gestione flotta veicoli e personale operativo. Scadenze automatiche, turni e assegnazioni intelligenti.
          </p>
        </div>
      </section>

      {/* PROBLEMA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-4">Perché serve</h2>
          <p className="text-gray-600 mb-6">
            Gestire mezzi e autisti senza un sistema centrale significa scadenze dimenticate, nessuna visibilità su disponibilità e costi fuori controllo.
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-left mb-6">
            <div className="p-4 bg-white border border-gray-200">
              <p className="text-sm text-gray-600">Scadenze dimenticate (multe e fermi)</p>
            </div>
            <div className="p-4 bg-white border border-gray-200">
              <p className="text-sm text-gray-600">Nessuna visibilità su chi è disponibile</p>
            </div>
            <div className="p-4 bg-white border border-gray-200">
              <p className="text-sm text-gray-600">Costi di manutenzione fuori controllo</p>
            </div>
          </div>
          <p className="text-lg font-bold text-gray-900">
            Il modulo Mezzi & Autisti centralizza tutto: anagrafica, scadenze, turni e posizioni in tempo reale.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 border border-gray-200">
              <Truck className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Anagrafica Mezzi</h3>
              <p className="text-sm text-gray-600">Targa, telaio, marca e modello, documenti e foto. Scadenze automatiche per revisione, assicurazione, bollo e tachigrafo.</p>
            </div>
            <div className="p-6 border border-gray-200">
              <UserCheck className="h-6 w-6 text-green-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Gestione Autisti</h3>
              <p className="text-sm text-gray-600">Anagrafica personale (nome, telefono, email), patenti e abilitazioni, turni e disponibilità, storico interventi.</p>
            </div>
            <div className="p-6 border border-gray-200">
              <Clock className="h-6 w-6 text-amber-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Scadenze monitorate</h3>
              <p className="text-sm text-gray-600">Notifiche automatiche per revisione, assicurazione, bollo, tachigrafo e patenti autisti. Nessuna multa o fermo mezzo.</p>
            </div>
            <div className="p-6 border border-gray-200">
              <Wrench className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Manutenzioni</h3>
              <p className="text-sm text-gray-600">Pianifica interventi periodici in base a km o scadenze temporali. Storico costi per ogni mezzo.</p>
            </div>
            <div className="p-6 border border-gray-200">
              <MapPin className="h-6 w-6 text-green-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Assegnazioni intelligenti</h3>
              <p className="text-sm text-gray-600">Il sistema suggerisce mezzo e autista ottimali in base a disponibilità e caratteristiche richieste.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Scadenze Monitorate</h3>
          <div className="grid sm:grid-cols-4 gap-3">
            {["Revisione","Assicurazione","Bollo","Tachigrafo"].map((s) => (
              <div key={s} className="flex items-center gap-2 p-3 border border-gray-200 bg-white">
                <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="text-sm font-medium text-gray-800">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COME FUNZIONA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-8 text-center">Come funziona</h2>
          <div className="space-y-4">
            {[
              { n: "1", title: "Crea anagrafica mezzi e autisti", desc: "Inserisci dati, documenti e scadenze." },
              { n: "2", title: "Imposta notifiche scadenze", desc: "Il sistema ti avvisa automaticamente quando serve." },
              { n: "3", title: "Pianifica turni", desc: "Assegna disponibilità e orari per ogni autista." },
              { n: "4", title: "Assegna interventi", desc: "Il sistema suggerisce mezzo e autista ottimali in base a disponibilità." },
              { n: "5", title: "Monitora e ottimizza", desc: "Consulta statistiche, costi manutenzione e performance." },
            ].map((s) => (
              <div key={s.n} className="flex gap-4 p-4 bg-white border border-gray-200">
                <div className="w-8 h-8 bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">{s.n}</div>
                <div>
                  <p className="font-bold text-gray-900 mb-1">{s.title}</p>
                  <p className="text-sm text-gray-600">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VANTAGGI */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-8 text-center">Vantaggi</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: Clock, title: "Zero scadenze dimenticate", desc: "Notifiche automatiche per revisioni, assicurazioni e patenti." },
              { icon: UserCheck, title: "Assegnazioni più rapide", desc: "Vedi subito chi è disponibile e dove si trova." },
              { icon: Wrench, title: "Costi sotto controllo", desc: "Storico manutenzioni e costi per ogni mezzo." },
              { icon: Truck, title: "Flotta sempre operativa", desc: "Meno fermi, più efficienza." },
            ].map((v) => (
              <div key={v.title} className="p-6 border border-gray-200">
                <v.icon className="h-6 w-6 text-blue-600 mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-sm text-gray-600">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-blue-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Flotta sempre operativa.</h2>
          <p className="text-blue-100 mb-8">Scadenze, turni, dispatch automatico. Demo gratuita, 30 minuti.</p>
          <Link href="/contatti" className="inline-flex items-center gap-2 px-8 py-4 bg-[#0f172a] text-white font-bold hover:bg-slate-800 transition-colors">
            RICHIEDI DEMO <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
