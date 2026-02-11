"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Shield,
  Zap,
  ArrowRight,
  CheckCircle2,
  Code2,
  Wrench,
  FileText,
  Car,
  Recycle,
  Heart
} from "lucide-react";

export default function ChiSiamoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-blue-50/30">
      {/* Hero */}
      <section className="relative pt-18 md:pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />

        <div className="rm-container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 text-xs rounded-full ring-1 ring-primary/30 px-3 py-1.5 mb-6 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary font-medium">
              <Heart className="h-3 w-3" />
              La nostra storia
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Nato sul campo,{" "}
              <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
                costruito per il campo
              </span>
            </h1>
            
            <p className="text-lg text-gray-600 leading-relaxed">
              RescueManager non è nato in un ufficio di consulenza. È nato dalla frustrazione 
              di vedere autodemolizioni e centri di soccorso stradale sommersi da carta, fogli Excel 
              e procedure manuali che rubano tempo e generano errori.
            </p>
          </motion.div>
        </div>
      </section>

      {/* La storia */}
      <section className="py-16 bg-white">
        <div className="rm-container">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="prose prose-lg max-w-none">
                <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-2xl p-8 border border-blue-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Perché esiste RescueManager</h2>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Chi gestisce un&apos;autodemolizione o un centro di soccorso stradale lo sa: 
                    tra radiazioni RVFU, fatture elettroniche, registro RENTRI, confische, sequestri 
                    e la gestione quotidiana dei mezzi e degli autisti, il lavoro amministrativo 
                    rischia di mangiarsi più tempo del lavoro vero.
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    RescueManager è la risposta a questo problema. Un unico software che mette insieme 
                    tutto quello che serve: dal soccorso stradale alla demolizione, dalla fattura SDI 
                    al registro rifiuti. Senza dover saltare tra dieci programmi diversi, senza fogli 
                    sparsi, senza doppie digitazioni.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                    <Code2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Sviluppo continuo</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    RescueManager è in sviluppo attivo. Ogni mese aggiungiamo funzionalità, 
                    miglioriamo l&apos;interfaccia e ascoltiamo chi lo usa. Non è un prodotto finito 
                    messo in un cassetto — è un progetto vivo che cresce con le esigenze del settore.
                  </p>
                </div>
                
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4">
                    <Wrench className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Fatto per chi ci lavora</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Ogni funzionalità nasce da un problema reale. Non aggiungiamo cose perché 
                    &quot;fanno figo&quot; — le aggiungiamo perché qualcuno ne ha bisogno. 
                    Il risultato è un software che fa quello che deve, senza complicazioni inutili.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Cosa copre */}
      <section className="py-16 bg-gray-50">
        <div className="rm-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Cosa copre RescueManager</h2>
              <p className="text-lg text-gray-600">
                Un software, tante anime — tutte quelle che servono a un&apos;autodemolizione moderna
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Zap, title: "Soccorso stradale", desc: "Dispatch, autisti, rapportini con foto e firma, calendario turni", color: "blue" },
                { icon: Car, title: "Radiazioni RVFU", desc: "Demolizione veicoli, certificati, fascicolo digitale, invio a STA", color: "red" },
                { icon: FileText, title: "Fatturazione SDI", desc: "Fatture elettroniche XML, invio automatico, incassi e solleciti", color: "green" },
                { icon: Recycle, title: "Registro RENTRI", desc: "Tracciabilità rifiuti, formulari, registri di carico e scarico", color: "emerald" },
                { icon: Shield, title: "Deposito giudiziario", desc: "Confische, sequestri, registro auto in deposito, scadenze", color: "purple" },
                { icon: CheckCircle2, title: "App mobile", desc: "App dedicata per autisti con interventi, foto, firme e GPS", color: "amber" },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                    item.color === 'blue' ? 'bg-blue-500/10 text-blue-600' :
                    item.color === 'red' ? 'bg-red-500/10 text-red-600' :
                    item.color === 'green' ? 'bg-green-500/10 text-green-600' :
                    item.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-600' :
                    item.color === 'purple' ? 'bg-purple-500/10 text-purple-600' :
                    'bg-amber-500/10 text-amber-600'
                  }`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="rm-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="bg-gradient-to-r from-blue-600 to-emerald-500 rounded-2xl p-8 md:p-12 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-pattern opacity-10" />
              <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-4">
                  Vuoi vedere come funziona?
                </h2>
                <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
                  Raccontaci cosa fai e ti mostriamo come RescueManager può semplificarti il lavoro. 
                  Demo gratuita, zero impegno.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link 
                    href="/contatti"
                    className="group inline-flex items-center gap-2 px-6 py-3 bg-white text-primary font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Contattaci
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link 
                    href="/prodotto"
                    className="inline-flex items-center gap-2 px-6 py-3 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
                  >
                    Vedi i moduli
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
