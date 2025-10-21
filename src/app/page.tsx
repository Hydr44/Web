"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { SmoothScrollLink } from "@/components/SmoothScrollLink";
import { BackToTopButton } from "@/components/BackToTopButton";
import { 
  Clock, 
  FileText, 
  BarChart3, 
  ArrowRight, 
  CheckCircle2, 
  Star, 
  Zap, 
  Shield, 
  Users,
  TrendingUp,
  Award,
  Calculator
} from "lucide-react";

export default function Home() {
  return (
    <main className="hero-bg">
      {/* HERO */}
      <section id="hero" className="relative overflow-hidden pt-18 md:pt-24 pb-20 md:pb-28 bg-gradient-to-br from-primary/5 via-white to-blue-50/30">
        {/* Background elements */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        
        {/* scrim per leggibilità del testo */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[460px] md:h-[560px]
                     bg-gradient-to-r from-background/96 via-background/82 to-background/0"
        />

        <div className="rm-container relative z-20">
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
              Operatività h24 per il soccorso stradale
              </motion.div>
              
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                Riduci i tempi di intervento{" "}
                <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  fino al 32%
                </span>
            </h1>

              <p className="mt-6 text-lg text-gray-600 max-w-2xl leading-relaxed">
              Dalla chiamata al traino: dispatch su mappa, rapportini con foto/firma, fatture e analisi —
                tutto in un&apos;unica piattaforma veloce.
            </p>

            {/* Value bullets */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4"
              >
                {[
                  { icon: Clock, text: "Dispatch in tempo reale" },
                  { icon: FileText, text: "Rapportini con foto & firma" },
                  { icon: BarChart3, text: "Fatture & analytics" },
                ].map((bullet, i) => (
                  <motion.div
                    key={bullet.text}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.5 + i * 0.1 }}
                    className="flex items-center gap-3 text-sm text-gray-700"
                  >
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <bullet.icon className="h-4 w-4" />
                    </div>
                    <span>{bullet.text}</span>
                  </motion.div>
                ))}
              </motion.div>

            {/* CTA */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="mt-8 flex flex-wrap gap-4"
              >
                <Link
                  href="/demo"
                  className="group inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
                >
                  Richiedi demo gratuita
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                  href="/preventivo"
                  className="inline-flex items-center gap-2 px-6 py-4 rounded-xl ring-2 ring-gray-200 bg-white text-gray-900 font-semibold hover:bg-gray-50 hover:ring-gray-300 transition-all duration-300"
              >
                  <Calculator className="h-4 w-4" />
                  Preventivo personalizzato
              </Link>
              </motion.div>

            {/* Micro-trust badges */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1 }}
                className="mt-8 flex flex-wrap items-center gap-3"
              >
                {[
                  { icon: Users, text: "Oltre 120 officine" },
                  { icon: Award, text: "8 consorzi in 5 regioni" },
                  { icon: TrendingUp, text: "5.000+ interventi/mese" },
                ].map((badge, i) => (
                  <motion.div
                    key={badge.text}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 1.1 + i * 0.1 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full ring-1 ring-gray-200 bg-white shadow-sm text-xs text-gray-600 hover:shadow-md transition-all duration-200"
                  >
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <badge.icon className="h-3 w-3" />
                    <span>{badge.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right visual */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative"
            >
        {/* mockup tappeto: arrotondato + fade top/right/bottom */}
              <div className="pointer-events-none relative mx-auto w-[1200px] max-w-none rounded-[28px] md:rounded-[32px] overflow-hidden ring-1 ring-black/5 shadow-2xl">
            <Image
              src="/mockups/dashboard-mockup.jpg"
                  alt="RescueManager Dashboard"
              width={2400}
              height={1200}
              priority
              sizes="(min-width: 1200px) 1200px, 100vw"
              className="w-full h-auto object-cover"
            />
            {/* Fades di fusione */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/0 to-transparent" />
            <div className="absolute inset-y-0 right-0 w-72 md:w-[28rem] bg-gradient-to-l from-background/80 via-background/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-28 md:h-32 bg-gradient-to-t from-background/65 via-background/30 to-transparent" />
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
                <div className="text-2xl font-bold text-blue-600">99.9%</div>
                <div className="text-xs text-gray-600">uptime</div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* PARTNERSHIP & INTEGRAZIONI */}
      <section id="integrations" className="py-16 bg-gradient-to-r from-gray-50/50 to-white">
        <div className="rm-container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Integrazioni certificate</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Compatibile con i principali sistemi del settore per una gestione completa
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-items-center">
            {/* ACI */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="group flex flex-col items-center gap-3 p-6 rounded-2xl bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center border border-blue-200 p-3 group-hover:scale-110 transition-transform duration-300">
                <Image 
                  src="/21-9_1320x566_1977.jpg" 
                  alt="ACI Automobile Club Italia" 
                  width={56} 
                  height={56} 
                  className="object-contain"
                />
              </div>
              <div className="text-center">
                <span className="text-sm font-semibold text-gray-900">Automobile Club</span>
                <div className="text-xs text-gray-600">Italia</div>
              </div>
            </motion.div>

            {/* Registro Rentri */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="group flex flex-col items-center gap-3 p-6 rounded-2xl bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center border border-green-200 p-3 group-hover:scale-110 transition-transform duration-300">
                <Image 
                  src="/logo-rentri.png" 
                  alt="Registro Rentri" 
                  width={56} 
                  height={56} 
                  className="object-contain"
                />
              </div>
              <div className="text-center">
                <span className="text-sm font-semibold text-gray-900">Registro Nazionale</span>
                <div className="text-xs text-gray-600">Trasporti</div>
              </div>
            </motion.div>

            {/* Agenzia Entrate */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="group flex flex-col items-center gap-3 p-6 rounded-2xl bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center border border-purple-200 p-3 group-hover:scale-110 transition-transform duration-300">
                <Image 
                  src="/download.jpg" 
                  alt="Agenzia delle Entrate" 
                  width={56} 
                  height={56} 
                  className="object-contain"
                />
              </div>
              <div className="text-center">
                <span className="text-sm font-semibold text-gray-900">Fatturazione</span>
                <div className="text-xs text-gray-600">Elettronica</div>
              </div>
            </motion.div>

            {/* Plus icon for more */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="group flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border border-gray-300 group-hover:scale-110 transition-transform duration-300">
                <svg width="40" height="40" viewBox="0 0 40 40" className="text-gray-600 group-hover:text-primary transition-colors duration-300">
                  <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="2"/>
                  <path d="M20 12 L20 28 M12 20 L28 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="text-center">
                <span className="text-sm font-semibold text-gray-900">Altre</span>
                <div className="text-xs text-gray-600">integrazioni</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FEATURE GRID */}
      <section id="features" className="py-16 md:py-20 bg-white">
        <div className="rm-container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Tutto quello che ti serve</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Tre funzionalità chiave per ottimizzare la gestione del soccorso stradale
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: Clock, 
                title: "Dispatch in tempo reale", 
                desc: "Smista chiamate, assegna mezzi, ETA e stato su mappa.",
                color: "blue",
                features: ["Mappa interattiva", "Assegnazione automatica", "Tracking real-time", "Notifiche push"]
              },
              { 
                icon: FileText, 
                title: "Rapportini completi", 
                desc: "Foto, firme, allegati e consegna veicolo, tutto digitale.",
                color: "green",
                features: ["Foto integrate", "Firme digitali", "Allegati PDF", "Consegna certificata"]
              },
              { 
                icon: BarChart3, 
                title: "Analytics utili", 
                desc: "Tempi medi, volumi e margini per mezzo/intervento.",
                color: "purple",
                features: ["Dashboard analytics", "Report personalizzati", "Metriche KPI", "Export dati"]
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`group relative p-8 rounded-3xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${
                  feature.color === 'blue' ? 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:shadow-blue-200/50' :
                  feature.color === 'green' ? 'bg-gradient-to-br from-green-50 to-green-100 border border-green-200 hover:shadow-green-200/50' :
                  'bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 hover:shadow-purple-200/50'
                }`}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className={`p-4 rounded-xl text-white ${
                    feature.color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                    feature.color === 'green' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                    'bg-gradient-to-r from-purple-500 to-purple-600'
                  }`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.desc}</p>
                  </div>
                </div>
                
                <ul className="space-y-3">
                  {feature.features.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
                      <CheckCircle2 className={`h-4 w-4 shrink-0 ${
                        feature.color === 'blue' ? 'text-blue-500' :
                        feature.color === 'green' ? 'text-green-500' :
                        'text-purple-500'
                      }`} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
            </motion.div>
          ))}
          </div>
        </div>
      </section>

      {/* SEZIONE PRODOTTO */}
      <section id="product" className="py-16 md:py-20 bg-gradient-to-br from-primary/5 via-white to-blue-50/30">
        <div className="rm-container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl bg-gradient-to-r from-white to-gray-50/50 p-8 md:p-12 shadow-xl border border-gray-200/50 overflow-hidden"
          >
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="inline-flex items-center gap-2 text-xs rounded-full ring-1 ring-primary/30 px-3 py-1.5 mb-6 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary font-medium"
                >
                  <Shield className="h-3 w-3" />
                  Gestione completa flotta
                </motion.div>
                
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Flotta, turni e manutenzioni{" "}
                  <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    senza caos
                  </span>
                </h2>
                
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Disponibilità mezzi in tempo reale, reperibilità, storico viaggi e costi per mezzo.
                Tutto tracciato, niente fogli sparsi.
              </p>
                
                <ul className="space-y-4 mb-8">
                  {[
                    { icon: Clock, text: "Calendario turni e reperibilità" },
                    { icon: Shield, text: "Scadenze e manutenzioni" },
                    { icon: BarChart3, text: "Storico interventi per mezzo" },
                  ].map((item, i) => (
                    <motion.li
                      key={item.text}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
                      className="flex items-center gap-3 text-gray-700"
                    >
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span>{item.text}</span>
                    </motion.li>
                  ))}
              </ul>
                
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="flex flex-wrap gap-4"
                >
                  <SmoothScrollLink 
                    href="#product" 
                    className="group inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
                  >
                  Vedi i moduli
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </SmoothScrollLink>
                  <Link 
                    href="/contatti" 
                    className="inline-flex items-center gap-2 px-6 py-4 rounded-xl ring-2 ring-gray-200 bg-white text-gray-900 font-semibold hover:bg-gray-50 hover:ring-gray-300 transition-all duration-300"
                  >
                    <Star className="h-4 w-4" />
                  Parla con noi
                </Link>
                </motion.div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="relative"
              >
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <Image 
                    src="/670shots_so.png" 
                    alt="RescueManager Desktop App - Gestione flotta e turni" 
                    width={600} 
                    height={400} 
                    className="w-full h-auto object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
              </div>
                
                {/* Floating elements */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4 border"
                >
                  <div className="text-2xl font-bold text-blue-600">100%</div>
                  <div className="text-xs text-gray-600">digitalizzato</div>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 1 }}
                  className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 border"
                >
                  <div className="text-2xl font-bold text-primary">24/7</div>
                  <div className="text-xs text-gray-600">disponibile</div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section id="stats" className="py-16 bg-gradient-to-r from-gray-50/50 to-white">
        <div className="rm-container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Risultati che contano</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              I numeri parlano chiaro: RescueManager fa la differenza
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { 
                value: "-32%", 
                label: "tempi di assegnazione", 
                icon: "📉",
                color: "red",
                description: "Riduzione media dei tempi di intervento"
              },
              { 
                value: "+18%", 
                label: "interventi/mezzo", 
                icon: "📈",
                color: "green",
                description: "Aumento della produttività"
              },
              { 
                value: "99.9%", 
                label: "uptime garantito", 
                icon: "⚡",
                color: "blue",
                description: "Affidabilità del sistema"
              },
              { 
                value: "< 2m", 
                label: "presa → dispatch", 
                icon: "⏱️",
                color: "purple",
                description: "Tempo medio di risposta"
              },
            ].map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`group relative p-8 rounded-3xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${
                  stat.color === 'red' ? 'bg-gradient-to-br from-red-50 to-red-100 border border-red-200 hover:shadow-red-200/50' :
                  stat.color === 'green' ? 'bg-gradient-to-br from-green-50 to-green-100 border border-green-200 hover:shadow-green-200/50' :
                  stat.color === 'blue' ? 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:shadow-blue-200/50' :
                  'bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 hover:shadow-purple-200/50'
                }`}
              >
                <div className="text-center">
                  <motion.div 
                    initial={{ scale: 0.8 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                    className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300"
                  >
                    {stat.icon}
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.4 + i * 0.1 }}
                    className={`text-3xl font-bold mb-2 ${
                      stat.color === 'red' ? 'text-red-600' :
                      stat.color === 'green' ? 'text-green-600' :
                      stat.color === 'blue' ? 'text-blue-600' :
                      'text-purple-600'
                    }`}
                  >
                    {stat.value}
                  </motion.div>
                  
                  <div className="text-sm font-semibold text-gray-900 mb-2">{stat.label}</div>
                  <div className="text-xs text-gray-600">{stat.description}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 bg-white">
        <div className="rm-container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Domande frequenti</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Le risposte alle domande più comuni su RescueManager
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                q: "Quanto tempo serve per iniziare?",
                a: "Di solito 1-3 giorni: creiamo l'ambiente, importiamo i dati esistenti e facciamo un onboarding rapido con il tuo team.",
                icon: Clock
              },
              {
                q: "Posso importare i miei clienti esistenti?",
                a: "Sì, supportiamo import da CSV/Excel con mappatura guidata dei campi. Ti aiutiamo anche con la migrazione dei dati.",
                icon: Users
              },
              {
                q: "È sicuro per i dati sensibili?",
                a: "Certamente. GDPR-by-design, backup giornalieri, crittografia end-to-end e audit log completi per la tracciabilità.",
                icon: Shield
              },
              {
                q: "Funziona anche offline?",
                a: "L'app mobile per autisti funziona offline e sincronizza automaticamente quando torna la connessione.",
                icon: Zap
              },
              {
                q: "Posso integrare il mio sistema contabile?",
                a: "Sì, esportiamo in tutti i formati standard (XML, CSV) e abbiamo integrazioni dirette con i principali software contabili.",
                icon: BarChart3
              },
              {
                q: "Cosa succede se cresco la flotta?",
                a: "Puoi aumentare o ridurre i mezzi senza penali. I piani sono flessibili e si adattano alle tue esigenze.",
                icon: TrendingUp
              }
            ].map((faq, i) => (
              <motion.div
                key={faq.q}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="group rounded-2xl border border-gray-200 p-6 bg-white hover:shadow-lg hover:border-primary/20 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <faq.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                  </div>
            </div>
              </motion.div>
            ))}
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-center mt-12"
          >
            <Link 
              href="/contatti" 
              className="group inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors duration-200"
            >
              Altre domande? Contattaci
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* PRICING PREVIEW */}
      <section id="pricing" className="py-16 bg-gradient-to-br from-primary/5 via-white to-blue-50/30">
        <div className="rm-container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Piani semplici e trasparenti</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Scegli il piano giusto per la tua officina, senza sorprese
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Starter",
                price: "€19,99",
                period: "/mese",
                description: "Prezzo benvenuto - Per iniziare: 1-5 mezzi",
                features: ["Dashboard Completa", "Gestione Clienti", "Gestione Mezzi", "Modulo Trasporti"],
                highlight: true,
                color: "blue",
                icon: Star
              },
              {
                name: "Flotta", 
                price: "€98,99",
                period: "/mese",
                description: "Prezzo benvenuto - Per 6-15 mezzi e team",
                features: ["Tutto il piano starter", "Registro auto (confische, sequestri)", "Modulo Fatturazione elettronica", "Modulo Radiazioni RVFU"],
                highlight: false,
                color: "purple",
                icon: Users
              },
              {
                name: "Enterprise",
                price: "€149,99", 
                period: "/mese",
                description: "Prezzo benvenuto - Per flotte complesse (16+ mezzi)",
                features: ["Tutto da starter e flotta", "Supporto prioritario", "Manutenzione avanzata", "Installazione inclusa"],
                highlight: false,
                color: "emerald",
                icon: Award
              }
            ].map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`group relative p-8 rounded-3xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${
                  plan.highlight 
                    ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary shadow-lg shadow-primary/20' 
                    : `bg-gradient-to-br from-${plan.color}-50 to-${plan.color}-100 border border-${plan.color}-200 hover:shadow-${plan.color}-200/50`
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-primary to-blue-600 text-white text-xs font-bold">
                      PIÙ SCELTO
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${
                    plan.highlight ? 'bg-gradient-to-r from-primary to-blue-600 text-white' :
                    plan.color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' :
                    plan.color === 'green' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' :
                    'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                  }`}>
                    <plan.icon className="h-6 w-6" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                  
                  <div className="flex items-baseline justify-center mb-6">
                    <span className={`text-4xl font-bold ${
                      plan.highlight ? 'text-primary' :
                      plan.color === 'blue' ? 'text-blue-600' :
                      plan.color === 'green' ? 'text-green-600' :
                      'text-purple-600'
                    }`}>{plan.price}</span>
                    <span className="text-gray-600 ml-1">{plan.period}</span>
                  </div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm text-gray-700">
                      <CheckCircle2 className={`h-4 w-4 shrink-0 ${
                        plan.highlight ? 'text-primary' :
                        plan.color === 'blue' ? 'text-blue-500' :
                        plan.color === 'green' ? 'text-green-500' :
                        'text-purple-500'
                      }`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <SmoothScrollLink
                  href="#pricing"
                  className={`block w-full text-center py-4 rounded-xl font-semibold transition-all duration-300 group ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-primary to-blue-600 text-white hover:shadow-lg hover:shadow-primary/25'
                      : `bg-gradient-to-r from-${plan.color}-500 to-${plan.color}-600 text-white hover:shadow-lg hover:shadow-${plan.color}-200/50`
                  }`}
                >
                  {plan.highlight ? 'Attiva subito' : 'Vedi dettagli'}
                </SmoothScrollLink>
              </motion.div>
            ))}
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center mt-12"
          >
            <SmoothScrollLink 
              href="#pricing" 
              className="group inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors duration-200"
            >
              Confronta tutti i piani
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </SmoothScrollLink>
          </motion.div>
        </div>
      </section>

      {/* TESTIMONIAL + CTA */}
      <section id="cta" className="py-16 bg-gradient-to-r from-primary/10 via-blue-50/50 to-primary/10">
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
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="inline-flex items-center gap-2 text-xs rounded-full ring-1 ring-white/30 px-3 py-1.5 mb-6 bg-white/10 text-white font-medium"
                >
                  <Star className="h-3 w-3" />
                  Testimonial cliente
                </motion.div>
                
                <blockquote className="text-xl md:text-2xl leading-relaxed mb-6 font-medium">
                  &ldquo;Finalmente vediamo in tempo reale chi è più vicino, quanto manca e cosa serve.
                  I rapportini con foto e firma ci hanno tolto un mondo di carta.&rdquo;
          </blockquote>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Responsabile Operativo</div>
                    <div className="text-sm text-blue-100">Consorzio Sicilia</div>
                  </div>
                </div>
              </div>
              
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col gap-4"
              >
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  Pronto a iniziare?
                </h3>
                <p className="text-lg text-blue-100 mb-6">
                  Unisciti alle oltre 120 officine che hanno già scelto RescueManager per ottimizzare la loro operatività.
                </p>
                
                <div className="flex flex-col gap-4">
                  <Link
                    href="/contatti"
                    className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-primary font-bold hover:bg-gray-50 transition-all duration-300 hover:scale-105"
                  >
                    Richiedi una demo gratuita
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
                  <SmoothScrollLink
                    href="#pricing"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-all duration-300"
                  >
                    <Star className="h-4 w-4" />
                    Vedi i piani e prezzi
                  </SmoothScrollLink>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-blue-100 mt-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Demo gratuita</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Setup incluso</span>
                  </div>
                </div>
              </motion.div>
          </div>
          </motion.div>
        </div>
      </section>
      
      {/* Back to top button */}
      <BackToTopButton />
    </main>
  );
}