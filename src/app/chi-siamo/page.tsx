"use client";

import { motion } from "framer-motion";
import { 
  Users, 
  Target, 
  Heart, 
  Lightbulb,
  Award,
  Globe,
  Shield,
  Zap,
  Building2,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import Image from "next/image";

export default function ChiSiamoPage() {
  const team = [
    {
      name: "Marco Rossi",
      role: "CEO & Founder",
      description: "15 anni di esperienza nel settore automotive",
      image: "/team/marco-rossi.jpg"
    },
    {
      name: "Sara Bianchi",
      role: "CTO",
      description: "Esperta in tecnologie cloud e mobile",
      image: "/team/sara-bianchi.jpg"
    },
    {
      name: "Luca Verdi",
      role: "Head of Product",
      description: "Specialista in UX/UI e product management",
      image: "/team/luca-verdi.jpg"
    }
  ];

  const values = [
    {
      icon: Heart,
      title: "Passione",
      description: "Crediamo nel valore del lavoro artigianale e nella passione per i dettagli"
    },
    {
      icon: Shield,
      title: "Affidabilità",
      description: "Garantiamo soluzioni stabili e sicure per le vostre attività"
    },
    {
      icon: Lightbulb,
      title: "Innovazione",
      description: "Sempre alla ricerca di nuove tecnologie per migliorare il vostro lavoro"
    },
    {
      icon: Users,
      title: "Collaborazione",
      description: "Lavoriamo insieme per raggiungere obiettivi comuni"
    }
  ];

  const milestones = [
    {
      year: "2020",
      title: "Fondazione",
      description: "Nascita di RescueManager con la visione di digitalizzare il settore"
    },
    {
      year: "2021",
      title: "Primo MVP",
      description: "Lancio della prima versione per 50 officine pilota"
    },
    {
      year: "2022",
      title: "Espansione",
      description: "Raggiungimento di 500 officine attive in tutta Italia"
    },
    {
      year: "2023",
      title: "Innovazione",
      description: "Introduzione dell'AI per la gestione intelligente dei ricambi"
    },
    {
      year: "2024",
      title: "Crescita",
      description: "Oltre 1000 officine attive e espansione internazionale"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-blue-50/30">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        
        <div className="rm-container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-2xl"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 text-xs rounded-full ring-1 ring-primary/30 px-3 py-1.5 mb-6 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary font-medium"
              >
                <Users className="h-3 w-3" />
                Chi Siamo
              </motion.div>
              
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                La storia di{" "}
                <span className="text-primary">RescueManager</span>
              </h1>
              
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Nata dalla passione per l'innovazione nel settore automotive, 
                RescueManager è la piattaforma che sta rivoluzionando la gestione 
                delle officine di soccorso stradale in Italia e nel mondo.
              </p>
              
              <div className="flex flex-wrap gap-4">
                {[
                  { icon: Building2, text: "1000+ Officine" },
                  { icon: Globe, text: "5 Paesi" },
                  { icon: Award, text: "Innovazione" }
                ].map((item, i) => (
                  <motion.div
                    key={item.text}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200"
                  >
                    <item.icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-gray-700">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="relative"
            >
              <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">La Nostra Mission</h3>
                  <p className="text-gray-600">
                    Digitalizzare e ottimizzare la gestione delle officine di soccorso 
                    stradale attraverso tecnologie innovative e soluzioni user-friendly.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16">
        <div className="rm-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-4xl mx-auto"
          >
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Mission</h3>
                <p className="text-gray-600 leading-relaxed">
                  Semplificare e ottimizzare la gestione quotidiana delle officine di soccorso 
                  stradale attraverso tecnologie innovative, permettendo ai professionisti del 
                  settore di concentrarsi su ciò che conta davvero: aiutare le persone in difficoltà.
                </p>
              </div>
              
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <Lightbulb className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Vision</h3>
                <p className="text-gray-600 leading-relaxed">
                  Diventare la piattaforma di riferimento mondiale per la gestione digitale 
                  delle officine di soccorso stradale, creando un ecosistema integrato che 
                  connette tutti gli attori del settore.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-gray-50">
        <div className="rm-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="max-w-6xl mx-auto"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">I Nostri Valori</h2>
              <p className="text-lg text-gray-600">
                I principi che guidano ogni nostra decisione e azione
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, i) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{value.title}</h3>
                  <p className="text-gray-600 text-sm">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16">
        <div className="rm-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">La Nostra Storia</h2>
              <p className="text-lg text-gray-600">
                Un percorso di crescita e innovazione
              </p>
            </div>
            
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-primary/20"></div>
              
              <div className="space-y-8">
                {milestones.map((milestone, i) => (
                  <motion.div
                    key={milestone.year}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                    className="relative flex items-start gap-6"
                  >
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg z-10">
                      {milestone.year}
                    </div>
                    <div className="flex-1 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {milestone.title}
                      </h3>
                      <p className="text-gray-600">
                        {milestone.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-gray-50">
        <div className="rm-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="max-w-6xl mx-auto"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Il Nostro Team</h2>
              <p className="text-lg text-gray-600">
                Professionisti appassionati che rendono possibile la nostra visione
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {team.map((member, i) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 + i * 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center"
                >
                  <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-primary font-medium mb-2">{member.role}</p>
                  <p className="text-gray-600 text-sm">{member.description}</p>
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
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-8 text-white">
              <h2 className="text-3xl font-bold mb-4">
                Unisciti alla Rivoluzione
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Scopri come RescueManager può trasformare la tua officina
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                  <Zap className="h-5 w-5" />
                  Inizia Gratis
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button className="inline-flex items-center gap-2 px-6 py-3 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors">
                  <Users className="h-5 w-5" />
                  Contattaci
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
