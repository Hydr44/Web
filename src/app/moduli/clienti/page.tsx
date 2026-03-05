import Link from "next/link";
import { ArrowLeft, Users, Phone, FileText, TrendingUp, History, ArrowRight } from "lucide-react";

export default function ClientiPage() {
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
            Clienti & CRM<span className="text-blue-500">.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            Anagrafica completa, storico servizi, preventivi e fatture. Tutto in un unico posto per privati, assicurazioni e aziende.
          </p>
        </div>
      </section>

      {/* PROBLEMA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-4">Perché serve</h2>
          <p className="text-gray-600 mb-6">
            Gestire clienti senza un sistema centrale significa dati sparsi, nessuna visibilità su storico e fatturato, difficoltà a recuperare informazioni.
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-left mb-6">
            <div className="p-4 bg-white border border-gray-200">
              <p className="text-sm text-gray-600">Dati sparsi tra Excel e memoria</p>
            </div>
            <div className="p-4 bg-white border border-gray-200">
              <p className="text-sm text-gray-600">Nessuna visibilità su storico servizi</p>
            </div>
            <div className="p-4 bg-white border border-gray-200">
              <p className="text-sm text-gray-600">Tempo perso a cercare informazioni</p>
            </div>
          </div>
          <p className="text-lg font-bold text-gray-900">
            Il modulo Clienti centralizza tutte le informazioni: anagrafica, contatti, storico e statistiche in un'unica scheda.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Users, color: "text-blue-600", title: "Anagrafica completa", desc: "Dati anagrafici (nome, cognome, ragione sociale), Codice fiscale e Partita IVA, indirizzo, telefono, email e PEC." },
              { icon: Phone, color: "text-green-600", title: "Contatti multipli", desc: "Gestisci più numeri di telefono, email e referenti per ogni cliente. Utile per aziende con più sedi." },
              { icon: History, color: "text-purple-600", title: "Storico completo", desc: "Visualizza trasporti effettuati, preventivi inviati, fatture emesse e note in ordine cronologico." },
              { icon: TrendingUp, color: "text-red-600", title: "Statistiche cliente", desc: "Valore totale servizi, numero di interventi, fatturato generato e frequenza ordini." },
            ].map((f) => (
              <div key={f.title} className="p-6 border border-gray-200">
                <f.icon className={`h-6 w-6 ${f.color} mb-3`} />
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Tipologie di Clienti</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {[["Clienti Privati","Anagrafica semplificata, storico servizi e preferenze. Ideale per interventi occasionali o clienti abituali."],["Assicurazioni","Convenzioni, tariffari dedicati e referenti per ogni compagnia. Gestisci accordi commerciali e condizioni specifiche."],["Aziende & Flotte","Più sedi, flotte veicoli, contratti e condizioni dedicate. Perfetto per grandi clienti con esigenze complesse."]].map(([t,d]) => (
              <div key={t} className="p-4 border border-gray-200 bg-white">
                <p className="font-bold text-gray-900 mb-1 text-sm">{t}</p>
                <p className="text-xs text-gray-500">{d}</p>
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
              { n: "1", title: "Crea la scheda cliente", desc: "Inserisci dati anagrafici e contatti." },
              { n: "2", title: "Associa servizi", desc: "Ogni trasporto, preventivo o fattura viene collegato automaticamente al cliente." },
              { n: "3", title: "Consulta lo storico", desc: "Apri la scheda cliente e vedi tutto: servizi, documenti e statistiche." },
              { n: "4", title: "Esporta e analizza", desc: "Esporta liste clienti in CSV per analisi esterne o invio a commercialista." },
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
              { icon: Users, title: "Nessun dato perso", desc: "Tutto centralizzato e sempre accessibile." },
              { icon: TrendingUp, title: "Risposte più rapide", desc: "Quando il cliente chiama, hai subito tutte le informazioni." },
              { icon: FileText, title: "Migliore gestione commerciale", desc: "Statistiche e storico ti aiutano a capire quali clienti sono più redditizi." },
              { icon: History, title: "Meno errori", desc: "Dati univoci e aggiornati, niente duplicati o informazioni obsolete." },
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
          <h2 className="text-3xl font-extrabold text-white mb-4">Centralizza tutti i tuoi clienti.</h2>
          <p className="text-blue-100 mb-8">CRM completo incluso in tutti i piani. Demo gratuita.</p>
          <Link href="/contatti" className="inline-flex items-center gap-2 px-8 py-4 bg-[#0f172a] text-white font-bold hover:bg-slate-800 transition-colors">
            RICHIEDI DEMO <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
