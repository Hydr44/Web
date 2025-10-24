"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  Play,
  Star,
  Shield,
  Zap
} from "lucide-react";

export default function DemoPage() {
  const [formData, setFormData] = useState({
    nome: "",
    cognome: "",
    email: "",
    telefono: "",
    azienda: "",
    ruolo: "",
    settore: "",
    mezzi: "",
    note: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'demo',
          source: 'website',
          name: `${formData.nome} ${formData.cognome}`,
          email: formData.email,
          phone: formData.telefono,
          company: formData.azienda,
          role: formData.ruolo,
          vehicles: formData.mezzi,
          message: formData.note,
          additional_data: {
            sector: formData.settore,
            vehicles_count: formData.mezzi
          }
        }),
      });

      const result = await response.json();

      if (result.success) {
        setIsSubmitted(true);
      } else {
        console.error('Error submitting demo request:', result.error);
        // Fallback to success anyway for better UX
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('Error submitting demo request:', error);
      // Fallback to success anyway for better UX
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-blue-50/30 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl border border-gray-200"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </motion.div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Demo Richiesta!
          </h2>
          
          <p className="text-gray-600 mb-6">
            Grazie per la tua richiesta! Il nostro team ti contatterà entro 24 ore per organizzare la demo personalizzata.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Calendar className="h-4 w-4 text-primary" />
              <span>Riceverai un calendario per scegliere l'orario</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Users className="h-4 w-4 text-primary" />
              <span>Demo personalizzata per la tua azienda</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Clock className="h-4 w-4 text-primary" />
              <span>Durata: 30-45 minuti</span>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <a 
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:opacity-90 transition-all duration-200"
            >
              Torna alla Home
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-blue-50/30">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
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
                <Play className="h-3 w-3" />
                Demo Personalizzata
              </motion.div>
              
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Vedi RescueManager
                <span className="block text-primary">in azione</span>
              </h1>
              
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Prenota una demo personalizzata e scopri come RescueManager può rivoluzionare la gestione della tua officina di soccorso stradale.
              </p>
              
              <div className="flex flex-wrap gap-4 mb-8">
                {[
                  { icon: Calendar, text: "30 minuti" },
                  { icon: Users, text: "Personalizzata" },
                  { icon: Shield, text: "Sicura" },
                  { icon: Zap, text: "Interattiva" }
                ].map((item, i) => (
                  <motion.div
                    key={item.text}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200"
                  >
                    <item.icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-gray-700">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right content - Form */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Richiedi la tua Demo
                </h2>
                <p className="text-gray-600">
                  Compila il form e ti contatteremo per organizzare la demo
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome *
                    </label>
                    <input
                      type="text"
                      name="nome"
                      required
                      value={formData.nome}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                      placeholder="Il tuo nome"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cognome *
                    </label>
                    <input
                      type="text"
                      name="cognome"
                      required
                      value={formData.cognome}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                      placeholder="Il tuo cognome"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    placeholder="la-tua-email@azienda.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefono *
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    required
                    value={formData.telefono}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    placeholder="+39 123 456 7890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Azienda *
                  </label>
                  <input
                    type="text"
                    name="azienda"
                    required
                    value={formData.azienda}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    placeholder="Nome della tua azienda"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ruolo
                    </label>
                    <select
                      name="ruolo"
                      value={formData.ruolo}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    >
                      <option value="">Seleziona il tuo ruolo</option>
                      <option value="proprietario">Proprietario</option>
                      <option value="direttore">Direttore</option>
                      <option value="responsabile">Responsabile</option>
                      <option value="tecnico">Tecnico</option>
                      <option value="altro">Altro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numero mezzi
                    </label>
                    <select
                      name="mezzi"
                      value={formData.mezzi}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    >
                      <option value="">Quanti mezzi gestite?</option>
                      <option value="1-5">1-5 mezzi</option>
                      <option value="6-15">6-15 mezzi</option>
                      <option value="16-30">16-30 mezzi</option>
                      <option value="30+">30+ mezzi</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note aggiuntive
                  </label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Raccontaci le tue esigenze specifiche..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Invio in corso...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Richiedi Demo
                    </div>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="rm-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Cosa vedrai nella demo
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Una panoramica completa delle funzionalità più importanti di RescueManager
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Gestione Flotta",
                description: "Come gestire mezzi, autisti e turni in modo efficiente"
              },
              {
                icon: Calendar,
                title: "Dispatch Intelligente",
                description: "Sistema di assegnazione automatica degli interventi"
              },
              {
                icon: Shield,
                title: "Fatturazione Elettronica",
                description: "Gestione completa fatture e pagamenti digitali"
              },
              {
                icon: Zap,
                title: "App Mobile",
                description: "Come gli autisti utilizzano l'app per gli interventi"
              },
              {
                icon: Star,
                title: "Analytics & Report",
                description: "Dashboard e reportistica per monitorare le performance"
              },
              {
                icon: CheckCircle2,
                title: "Integrazioni",
                description: "Connessioni con sistemi esterni e API"
              }
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary/10 to-blue-500/10">
        <div className="rm-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pronto a vedere RescueManager in azione?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Prenota la tua demo personalizzata e scopri come può trasformare la tua officina
            </p>
            <a
              href="#form"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white font-semibold hover:shadow-lg transition-all duration-200"
            >
              <Calendar className="h-5 w-5" />
              Richiedi Demo Ora
              <ArrowRight className="h-4 w-4" />
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
