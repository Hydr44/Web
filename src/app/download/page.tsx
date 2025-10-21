"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  Monitor, 
  Globe, 
  Smartphone, 
  Download, 
  ArrowRight, 
  CheckCircle2, 
  Shield, 
  Clock,
  Star,
  ExternalLink,
  Play
} from "lucide-react";

export default function Accessi() {
  const ITEMS = [
    {
      name: "Portale centrale operativa",
      desc: "Accesso diretto da browser per dispatcher e amministrazione.",
      href: "/dashboard", // link al portale web
      icon: Globe,
      cta: "Apri portale",
      color: "blue",
      status: "available",
      features: ["Accesso immediato", "Nessuna installazione", "Aggiornamenti automatici", "Multi-dispositivo"],
      screenshot: "/670shots_so.png"
    },
    {
      name: "App desktop RescueManager",
      desc: "Applicazione dedicata per Windows e MacOS, con prestazioni ottimizzate e aggiornamenti automatici.",
      downloads: [
        { label: "Scarica per Windows", href: "#", icon: Monitor, size: "45 MB" },
        { label: "Scarica per Mac", href: "#", icon: Monitor, size: "52 MB" },
      ],
      icon: Monitor,
      color: "purple",
      status: "available",
      features: ["Prestazioni ottimizzate", "Offline mode", "Notifiche desktop", "Sincronizzazione automatica"],
      screenshot: "/670shots_so.png"
    },
    {
      name: "App mobile per autisti",
      desc: "App nativa per i driver con interventi, foto e firme digitali. Disponibile a breve su iOS e Android.",
      href: "#", // placeholder, in futuro store link
      icon: Smartphone,
      cta: "In arrivo",
      color: "green",
      status: "coming-soon",
      features: ["Interventi real-time", "Foto e firme", "GPS integrato", "Funziona offline"],
      screenshot: "/670shots_so.png"
    },
  ];

  return (
    <main className="hero-bg">
      {/* HERO */}
      <section className="relative overflow-hidden pt-18 md:pt-24 pb-16 bg-gradient-to-br from-primary/5 via-white to-blue-50/30">
        {/* Background elements */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        
        <div className="rm-container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="inline-flex items-center gap-2 text-xs rounded-full ring-1 ring-primary/30 px-3 py-1.5 mb-6 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary font-medium"
              >
                <Download className="h-3 w-3" />
                Accessi multipli per ogni esigenza
              </motion.div>
              
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                Accessi & Download per{" "}
                <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  ogni dispositivo
                </span>
          </h1>
              
              <p className="mt-6 text-lg text-gray-600 max-w-2xl leading-relaxed">
                Usa RescueManager dal browser, scarica la versione desktop per Windows e Mac, e a breve anche l'app mobile per autisti.
              </p>

              {/* Feature badges */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-8 flex flex-wrap gap-3"
              >
                {[
                  { icon: Globe, text: "Web App", color: "blue" },
                  { icon: Monitor, text: "Desktop App", color: "purple" },
                  { icon: Smartphone, text: "Mobile App", color: "green" },
                  { icon: Shield, text: "Sicuro", color: "emerald" },
                ].map((badge, i) => (
                  <motion.div
                    key={badge.text}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.5 + i * 0.1 }}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm hover:shadow-md transition-all duration-200 ${
                      badge.color === 'blue' ? 'ring-1 ring-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700' :
                      badge.color === 'purple' ? 'ring-1 ring-purple-200 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700' :
                      badge.color === 'green' ? 'ring-1 ring-green-200 bg-gradient-to-r from-green-50 to-green-100 text-green-700' :
                      'ring-1 ring-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700'
                    }`}
                  >
                    <badge.icon className="h-4 w-4" />
                    {badge.text}
                  </motion.div>
                ))}
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="mt-8 flex flex-wrap gap-4"
              >
                <Link
                  href="#accessi"
                  className="group inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
                >
                  Vedi tutti gli accessi
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/contatti"
                  className="inline-flex items-center gap-2 px-6 py-4 rounded-xl ring-2 ring-gray-200 bg-white text-gray-900 font-semibold hover:bg-gray-50 hover:ring-gray-300 transition-all duration-300"
                >
                  <Play className="h-4 w-4" />
                  Richiedi demo
                </Link>
              </motion.div>
            </motion.div>

            {/* Right visual */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <Image 
                  src="/670shots_so.png" 
                  alt="RescueManager Dashboard" 
                  width={600} 
                  height={400} 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              
              {/* Floating device icons */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4 border"
              >
                <Globe className="h-6 w-6 text-blue-600" />
                <div className="text-xs text-gray-600 mt-1">Web App</div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
                className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 border"
              >
                <Monitor className="h-6 w-6 text-purple-600" />
                <div className="text-xs text-gray-600 mt-1">Desktop</div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ACCESSI */}
      <section id="accessi" className="py-16 bg-gray-50/50">
        <div className="rm-container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Scegli il tuo accesso</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Tre modi per accedere a RescueManager, ottimizzati per ogni esigenza
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {ITEMS.map((item, i) => (
              <motion.article
                key={item.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`group relative p-8 rounded-3xl transition-all duration-300 hover:-translate-y-1 ${
                  item.color === 'blue' ? 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:shadow-xl hover:shadow-blue-200/50' :
                  item.color === 'purple' ? 'bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 hover:shadow-xl hover:shadow-purple-200/50' :
                  'bg-gradient-to-br from-green-50 to-green-100 border border-green-200 hover:shadow-xl hover:shadow-green-200/50'
                }`}
              >
                {item.status === "coming-soon" && (
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-orange-400 to-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    IN ARRIVO
                  </div>
                )}
                
                <div className="flex items-center gap-4 mb-6">
                  <div className={`p-3 rounded-xl text-white ${
                    item.color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                    item.color === 'purple' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                    'bg-gradient-to-r from-green-500 to-green-600'
                  }`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                </div>
                
                {/* Screenshot preview */}
                <div className="mb-6 rounded-xl overflow-hidden shadow-lg">
                  <Image 
                    src={item.screenshot} 
                    alt={item.name} 
                    width={300} 
                    height={200} 
                    className="w-full h-32 object-cover"
                  />
                </div>
                
                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {item.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 className={`h-4 w-4 shrink-0 ${
                        item.color === 'blue' ? 'text-blue-500' :
                        item.color === 'purple' ? 'text-purple-500' :
                        'text-green-500'
                      }`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {/* Actions */}
                <div className="space-y-3">
                  {item.downloads ? (
                    <div className="space-y-2">
                      {item.downloads.map((download) => (
                        <a
                          key={download.label}
                          href={download.href}
                          className={`group/btn flex items-center justify-between w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 text-white hover:shadow-lg group-hover:scale-105 ${
                            item.color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                            item.color === 'purple' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                            'bg-gradient-to-r from-green-500 to-green-600'
                          }`}
            >
              <div className="flex items-center gap-3">
                            <download.icon className="h-4 w-4" />
                            <span>{download.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs opacity-75">{download.size}</span>
                            <Download className="h-4 w-4" />
                          </div>
                        </a>
                      ))}
              </div>
                  ) : (
                    <a
                      href={item.href}
                      className={`group/btn flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                        item.status === "available" 
                          ? (item.color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg group-hover:scale-105' :
                             item.color === 'purple' ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-lg group-hover:scale-105' :
                             'bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg group-hover:scale-105')
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {item.status === "available" ? (
                        <>
                          <ExternalLink className="h-4 w-4" />
                          {item.cta}
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4" />
                          {item.cta}
                        </>
                      )}
                    </a>
                  )}
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="py-16 bg-gradient-to-r from-primary/10 via-green-50/50 to-primary/10">
        <div className="rm-container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl bg-gradient-to-r from-primary to-blue-600 p-8 md:p-12 text-white overflow-hidden"
          >
            {/* Background pattern */}
            <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Hai bisogno di aiuto?
                </h2>
                <p className="text-lg text-blue-100 mb-6">
                  Il nostro team è pronto ad aiutarti con l'installazione e la configurazione di RescueManager.
                </p>
                <div className="flex items-center gap-4 text-sm text-blue-100">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Supporto 24/7</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Installazione guidata</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-4">
                <Link
                  href="/contatti"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-primary font-bold hover:bg-gray-50 transition-all duration-300 hover:scale-105"
                >
                  Richiedi supporto tecnico
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/prodotto"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-all duration-300"
                >
                  <Star className="h-4 w-4" />
                  Scopri tutti i moduli
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="rm-container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Domande frequenti</h3>
            <p className="text-lg text-gray-600">Le risposte alle domande più comuni sugli accessi</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                q: "Qual è la differenza tra web app e desktop app?",
                a: "La web app funziona da browser senza installazione, mentre la desktop app offre prestazioni migliori e funziona offline.",
                icon: Globe
              },
              {
                q: "Quando sarà disponibile l'app mobile?",
                a: "L'app mobile per autisti sarà disponibile entro il prossimo trimestre su iOS e Android.",
                icon: Smartphone
              },
              {
                q: "Posso usare più accessi contemporaneamente?",
                a: "Sì, puoi accedere da web, desktop e mobile con lo stesso account senza limitazioni.",
                icon: Monitor
              },
              {
                q: "I dati sono sincronizzati tra tutti gli accessi?",
                a: "Assolutamente sì. Tutti i dati sono sincronizzati in tempo reale tra web, desktop e mobile.",
                icon: Shield
              }
            ].map((faq, i) => (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="group rounded-2xl border border-gray-200 p-6 bg-white hover:shadow-lg hover:border-primary/20 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <faq.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">{faq.q}</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}