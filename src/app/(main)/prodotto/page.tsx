"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Truck,
  FileSpreadsheet,
  BarChart3,
  Users,
  Car,
  Smartphone,
  FileText,
  Settings,
  ArrowRight,
  Star,
  Shield,
  Zap,
} from "lucide-react";

type Module = {
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  points: string[];
  category: string;
  color: string;
  description: string;
  featured?: boolean;
};

const MODULES: Module[] = [
  // MODULO TRASPORTI
  {
    title: "Modulo Trasporti",
    icon: Truck,
    category: "Operativo",
    color: "blue",
    description: "Il cuore operativo del sistema",
    featured: true,
    points: [
      "Dashboard Completa",
      "Gestione Clienti",
      "Gestione Mezzi",
      "Calendario trasporti",
      "Preventivi e offerte",
      "Richiesta posizione GPS cliente",
      "Gestione autisti",
      "Accesso App Autisti",
    ],
  },
  
  // RADIAZIONI RVFU
  {
    title: "Modulo Radiazioni RVFU",
    icon: Car,
    category: "Specializzato",
    color: "orange",
    description: "Gestione completa demolizioni",
    featured: true,
    points: [
      "Ricercare veicoli tramite PRA",
      "Compilare radiazione, generare il certificato di demolizione",
      "Gestire il Fascicolo Digitale del Veicolo",
      "Effettuare da solo la radiazione del veicolo",
      "In alternativa inviarlo allo STA e verificarne l'avvenuta radiazione",
    ],
  },
  
  // FATTURAZIONE ELETTRONICA
  {
    title: "Fatturazione Elettronica",
    icon: FileText,
    category: "Amministrativo",
    color: "green",
    description: "Fatturazione digitale completa",
    featured: true,
    points: [
      "Fatture elettroniche XML per PA",
      "Integrazione Agenzia delle Entrate",
      "Pro-forma e fatture commerciali",
      "Gestione incassi e pagamenti",
      "Export contabile automatico",
      "Gestione SDI e codici destinatario",
      "Invio automatico fatture",
      "Storico fatturazione completo",
    ],
  },
  
  // APP MOBILE AUTISTI
  {
    title: "App Mobile per Autisti",
    icon: Smartphone,
    category: "Mobile",
    color: "purple",
    description: "App nativa per autisti",
    featured: true,
    points: [
      "Interventi assegnati in tempo reale",
      "Foto e firme digitali sui rapportini",
      "Navigazione GPS integrata",
      "Funziona offline con sincronizzazione",
      "Notifiche push per nuove chiamate",
    ],
  },
  
  // ANALYTICS & REPORT
  {
    title: "Analytics & Report",
    icon: BarChart3,
    category: "Business Intelligence",
    color: "emerald",
    description: "Business Intelligence avanzata",
    points: [
      "Dashboard operativa in tempo reale",
      "Volumi per zona/cliente/mezzo",
      "Tempi medi e performance",
      "Redditività per intervento",
      "Report personalizzabili",
      "KPI e metriche avanzate",
      "Export dati per analisi",
      "Alert automatici su soglie",
    ],
  },

  // INTEGRAZIONI & SICUREZZA
  {
    title: "Integrazioni & Sicurezza",
    icon: Settings,
    category: "Sistema",
    color: "gray",
    description: "Sicurezza e integrazioni",
    points: [
      "Integrazione telefonia (3CX)",
      "Protocolli email/PEC",
      "Ruoli e permessi granulari",
      "Audit log e backup automatici",
      "API per integrazioni custom",
      "Integrazione sistemi contabili",
      "Sicurezza GDPR compliant",
      "Monitoraggio sistema 24/7",
    ],
  },
];

export default function Prodotto() {
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
                <Zap className="h-3 w-3" />
                Autodemolizioni e soccorso stradale, in un unico software
              </motion.div>
              
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                Ogni modulo che serve a chi{" "}
                <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
                  demolisce e soccorre
                </span>
              </h1>
              
              <p className="mt-6 text-lg text-gray-600 max-w-2xl leading-relaxed">
                Dal soccorso stradale alle radiazioni RVFU, dalla fatturazione SDI al registro RENTRI: 
                tutti i moduli per gestire la tua autodemolizione o centro di soccorso.
              </p>

              {/* Feature badges */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-8 flex flex-wrap gap-3"
              >
                {[
                  { icon: Truck, text: "Modulo Trasporti", color: "blue" },
                  { icon: Smartphone, text: "App Mobile", color: "purple" },
                  { icon: FileText, text: "Fatturazione", color: "green" },
                  { icon: BarChart3, text: "Analytics", color: "emerald" },
                ].map((badge, i) => (
                  <motion.div
                    key={badge.text}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.5 + i * 0.1 }}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ring-1 ring-${badge.color}-200 bg-gradient-to-r from-${badge.color}-50 to-${badge.color}-100 text-${badge.color}-700 font-medium text-sm hover:shadow-md transition-all duration-200`}
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
                  href="/contatti"
                  className="group inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
                >
                  Richiedi demo gratuita
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/prezzi"
                  className="inline-flex items-center gap-2 px-6 py-4 rounded-xl ring-2 ring-gray-200 bg-white text-gray-900 font-semibold hover:bg-gray-50 hover:ring-gray-300 transition-all duration-300"
                >
                  <Star className="h-4 w-4" />
                  Vedi prezzi
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
                  alt="RescueManager Desktop App" 
                  width={600} 
                  height={400} 
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                  className="w-full h-auto"
                  quality={80}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              
              {/* Floating stats */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4 border"
              >
                <div className="text-2xl font-bold text-primary">-32%</div>
                <div className="text-xs text-gray-600">tempi intervento</div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
                className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 border"
              >
                <div className="text-2xl font-bold text-emerald-600">99.9%</div>
                <div className="text-xs text-gray-600">uptime garantito</div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* MODULI ORGANIZZATI PER CATEGORIA */}
      <section className="py-16 bg-gray-50/50">
        <div className="rm-container">
          {/* Featured modules first */}
          <div className="mb-16">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Moduli Principali</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                I moduli più richiesti per iniziare subito con RescueManager
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {MODULES.filter(m => m.featured).map((module, i) => (
                <motion.article
                  key={module.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={`group relative p-8 rounded-3xl ${
                    module.color === 'blue' ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-blue-200/50' :
                    module.color === 'orange' ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-orange-200/50' :
                    module.color === 'green' ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-green-200/50' :
                    module.color === 'purple' ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-purple-200/50' :
                    module.color === 'red' ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-red-200/50' :
                    module.color === 'indigo' ? 'bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 hover:shadow-indigo-200/50' :
                    module.color === 'emerald' ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-emerald-200/50' :
                    module.color === 'gray' ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:shadow-gray-200/50' :
                    'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-blue-200/50'
                  } hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
                >
                  {module.featured && (
                    <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      POPOLARE
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-xl ${
                      module.color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                      module.color === 'orange' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                      module.color === 'green' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                      module.color === 'purple' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                      module.color === 'red' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                      module.color === 'indigo' ? 'bg-gradient-to-r from-indigo-500 to-indigo-600' :
                      module.color === 'emerald' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
                      module.color === 'gray' ? 'bg-gradient-to-r from-gray-500 to-gray-600' :
                      'bg-gradient-to-r from-blue-500 to-blue-600'
                    } text-white`}>
                      <module.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{module.title}</h3>
                      <p className="text-sm text-gray-600">{module.description}</p>
                    </div>
                  </div>
                  
                  <ul className="space-y-3">
                    {module.points.map((point) => (
                      <li key={point} className="flex items-start gap-3 text-sm text-gray-700">
                        <CheckCircle2 className={`h-4 w-4 ${
                          module.color === 'blue' ? 'text-blue-500' :
                          module.color === 'orange' ? 'text-orange-500' :
                          module.color === 'green' ? 'text-green-500' :
                          module.color === 'purple' ? 'text-purple-500' :
                          module.color === 'red' ? 'text-red-500' :
                          module.color === 'indigo' ? 'text-indigo-500' :
                          module.color === 'emerald' ? 'text-emerald-500' :
                          module.color === 'gray' ? 'text-gray-500' :
                          'text-blue-500'
                        } mt-0.5 shrink-0`} />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <button className={`w-full py-3 px-4 rounded-xl ${
                      module.color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                      module.color === 'orange' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                      module.color === 'green' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                      module.color === 'purple' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                      module.color === 'red' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                      module.color === 'indigo' ? 'bg-gradient-to-r from-indigo-500 to-indigo-600' :
                      module.color === 'emerald' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
                      module.color === 'gray' ? 'bg-gradient-to-r from-gray-500 to-gray-600' :
                      'bg-gradient-to-r from-blue-500 to-blue-600'
                    } text-white font-semibold hover:shadow-lg transition-all duration-200 group-hover:scale-105`}>
                      Scopri di più
                    </button>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>

          {/* All modules by category */}
          {["Operativo", "Specializzato", "Amministrativo", "Mobile", "Logistica", "Gestione", "Risorse Umane", "Commerciale", "Business Intelligence", "Sistema"].map((category) => {
            const categoryModules = MODULES.filter(m => m.category === category && !m.featured);
            if (categoryModules.length === 0) return null;
            
            return (
              <motion.div 
                key={category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="mb-16"
              >
                <h3 className="text-2xl font-bold mb-8 text-gray-900 flex items-center gap-3">
                  <div className="w-1 h-8 bg-gradient-to-b from-primary to-blue-600 rounded-full"></div>
                  {category}
                </h3>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {categoryModules.map((module) => (
                    <motion.article
                      key={module.title}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4 }}
                      className="group p-6 rounded-2xl bg-white border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg ${
                          module.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                          module.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                          module.color === 'green' ? 'bg-green-100 text-green-600' :
                          module.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                          module.color === 'red' ? 'bg-red-100 text-red-600' :
                          module.color === 'indigo' ? 'bg-indigo-100 text-indigo-600' :
                          module.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                          module.color === 'gray' ? 'bg-gray-100 text-gray-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          <module.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{module.title}</h4>
                          <p className="text-xs text-gray-500">{module.description}</p>
                        </div>
                      </div>
                      
                      <ul className="space-y-2 mb-4">
                        {module.points.slice(0, 3).map((point) => (
                          <li key={point} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className={`mt-1 h-1.5 w-1.5 rounded-full ${
                              module.color === 'blue' ? 'bg-blue-500' :
                              module.color === 'orange' ? 'bg-orange-500' :
                              module.color === 'green' ? 'bg-green-500' :
                              module.color === 'purple' ? 'bg-purple-500' :
                              module.color === 'red' ? 'bg-red-500' :
                              module.color === 'indigo' ? 'bg-indigo-500' :
                              module.color === 'emerald' ? 'bg-emerald-500' :
                              module.color === 'gray' ? 'bg-gray-500' :
                              'bg-blue-500'
                            } shrink-0`} />
                            <span>{point}</span>
                          </li>
                        ))}
                        {module.points.length > 3 && (
                          <li className="text-xs text-gray-500 font-medium">
                            +{module.points.length - 3} altre funzionalità
                          </li>
                        )}
                      </ul>
                      
                      <button className={`w-full text-center py-2 px-4 rounded-lg text-sm font-medium ${
                        module.color === 'blue' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' :
                        module.color === 'orange' ? 'bg-orange-50 text-orange-700 hover:bg-orange-100' :
                        module.color === 'green' ? 'bg-green-50 text-green-700 hover:bg-green-100' :
                        module.color === 'purple' ? 'bg-purple-50 text-purple-700 hover:bg-purple-100' :
                        module.color === 'red' ? 'bg-red-50 text-red-700 hover:bg-red-100' :
                        module.color === 'indigo' ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' :
                        module.color === 'emerald' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' :
                        module.color === 'gray' ? 'bg-gray-50 text-gray-700 hover:bg-gray-100' :
                        'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      } transition-colors duration-200`}>
                        Scopri di più
                      </button>
                    </motion.article>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="py-16 bg-gradient-to-r from-primary/10 via-blue-50/50 to-primary/10">
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
                  Vuoi vedere come funziona?
                </h2>
                <p className="text-lg text-blue-100 mb-6">
                  Raccontaci cosa gestisci e ti mostriamo i moduli giusti per te. Demo gratuita, zero impegno.
                </p>
                <div className="flex items-center gap-4 text-sm text-blue-100">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Demo gratuita</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <span>Setup in 1 giorno</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-4">
                <Link
                  href="/contatti"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-primary font-bold hover:bg-gray-50 transition-all duration-300 hover:scale-105"
                >
                  Richiedi demo gratuita
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/prezzi"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-all duration-300"
                >
                  <Star className="h-4 w-4" />
                  Vedi tutti i prezzi
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ BREVE */}
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
            <p className="text-lg text-gray-600">Le risposte alle domande più comuni sui nostri moduli</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                q: "Serve installazione sui PC dell'ufficio?",
                a: "RescueManager funziona da browser e ha anche un'app desktop dedicata per Windows e Mac. Per gli autisti c'è l'app mobile.",
                icon: Smartphone
              },
              {
                q: "Posso importare clienti e mezzi esistenti?",
                a: "Sì, supportiamo import da CSV/Excel e mappatura dei campi con assistenza guidata.",
                icon: FileSpreadsheet
              },
              {
                q: "È multi-sede / multi-utente?",
                a: "Certo. Ruoli e permessi granulari, audit log e limiti per area/settore.",
                icon: Users
              },
              {
                q: "Quanto tempo per partire?",
                a: "Di solito 1–3 giorni: creiamo l'ambiente, importiamo i dati e facciamo onboarding rapido.",
                icon: Zap
              }
            ].map((faq, i) => (
              <motion.div
                key={i}
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