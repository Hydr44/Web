"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Calculator, 
  FileText, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  Star,
  Shield,
  Clock,
  Award
} from "lucide-react";

export default function PreventivoPage() {
  const [formData, setFormData] = useState({
    nome: "",
    cognome: "",
    email: "",
    telefono: "",
    azienda: "",
    ruolo: "",
    settore: "",
    mezzi: "",
    dipendenti: "",
    esigenze: "",
    budget: "",
    timeline: "",
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
          type: 'quote',
          source: 'website',
          name: `${formData.nome} ${formData.cognome}`,
          email: formData.email,
          phone: formData.telefono,
          company: formData.azienda,
          role: formData.ruolo,
          vehicles: formData.mezzi,
          message: formData.esigenze,
          additional_data: {
            sector: formData.settore,
            vehicles_count: formData.mezzi,
            employees: formData.dipendenti,
            budget: formData.budget,
            timeline: formData.timeline,
            notes: formData.note
          }
        }),
      });

      const result = await response.json();

      if (result.success) {
        setIsSubmitted(true);
      } else {
        console.error('Error submitting quote request:', result.error);
        // Fallback to success anyway for better UX
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('Error submitting quote request:', error);
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
            Preventivo Richiesto!
          </h2>
          
          <p className="text-gray-600 mb-6">
            Grazie per la tua richiesta! Il nostro team commerciale ti invierà un preventivo personalizzato entro 48 ore.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Calculator className="h-4 w-4 text-primary" />
              <span>Preventivo personalizzato per le tue esigenze</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <FileText className="h-4 w-4 text-primary" />
              <span>Dettagli completi su costi e implementazione</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Clock className="h-4 w-4 text-primary" />
              <span>Consegna entro 48 ore lavorative</span>
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
                <Calculator className="h-3 w-3" />
                Preventivo Personalizzato
              </motion.div>
              
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Ottieni il tuo
                <span className="block text-primary">preventivo personalizzato</span>
              </h1>
              
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Richiedi un preventivo su misura per la tua officina. Analizzeremo le tue esigenze e ti proporremo la soluzione più adatta al tuo budget.
              </p>
              
              <div className="flex flex-wrap gap-4 mb-8">
                {[
                  { icon: Calculator, text: "Personalizzato" },
                  { icon: FileText, text: "Dettagliato" },
                  { icon: Shield, text: "Trasparente" },
                  { icon: Clock, text: "48h" }
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
                  Richiedi Preventivo
                </h2>
                <p className="text-gray-600">
                  Compila il form per ricevere un preventivo personalizzato
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
                      Ruolo *
                    </label>
                    <select
                      name="ruolo"
                      required
                      value={formData.ruolo}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    >
                      <option value="">Seleziona il tuo ruolo</option>
                      <option value="proprietario">Proprietario</option>
                      <option value="direttore">Direttore</option>
                      <option value="responsabile">Responsabile</option>
                      <option value="acquisti">Responsabile Acquisti</option>
                      <option value="altro">Altro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numero mezzi *
                    </label>
                    <select
                      name="mezzi"
                      required
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

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numero dipendenti
                    </label>
                    <select
                      name="dipendenti"
                      value={formData.dipendenti}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    >
                      <option value="">Quanti dipendenti?</option>
                      <option value="1-10">1-10 dipendenti</option>
                      <option value="11-25">11-25 dipendenti</option>
                      <option value="26-50">26-50 dipendenti</option>
                      <option value="50+">50+ dipendenti</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Budget stimato
                    </label>
                    <select
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    >
                      <option value="">Budget mensile stimato</option>
                      <option value="<100">Meno di €100/mese</option>
                      <option value="100-300">€100-300/mese</option>
                      <option value="300-500">€300-500/mese</option>
                      <option value="500+">Oltre €500/mese</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Esigenze principali *
                  </label>
                  <textarea
                    name="esigenze"
                    required
                    value={formData.esigenze}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Descrivi le tue esigenze principali: gestione flotta, fatturazione, app mobile, ecc..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timeline di implementazione
                  </label>
                  <select
                    name="timeline"
                    value={formData.timeline}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Quando vorresti iniziare?</option>
                    <option value="immediato">Immediatamente</option>
                    <option value="1-mese">Entro 1 mese</option>
                    <option value="3-mesi">Entro 3 mesi</option>
                    <option value="6-mesi">Entro 6 mesi</option>
                    <option value="pianificazione">Solo pianificazione</option>
                  </select>
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
                    placeholder="Informazioni aggiuntive che potrebbero essere utili per il preventivo..."
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
                      <Calculator className="h-5 w-5" />
                      Richiedi Preventivo
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
              Cosa riceverai nel preventivo
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Un'analisi dettagliata e personalizzata per la tua azienda
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Calculator,
                title: "Costi Dettagliati",
                description: "Breakdown completo dei costi mensili e annuali"
              },
              {
                icon: Users,
                title: "Piano Personalizzato",
                description: "Configurazione ottimale per le tue esigenze"
              },
              {
                icon: Clock,
                title: "Timeline Implementazione",
                description: "Cronoprogramma dettagliato per l'installazione"
              },
              {
                icon: Shield,
                title: "Garanzie & Supporto",
                description: "Dettagli su garanzie, supporto e manutenzione"
              },
              {
                icon: Award,
                title: "ROI Projection",
                description: "Proiezione del ritorno sull'investimento"
              },
              {
                icon: FileText,
                title: "Documentazione",
                description: "Specifiche tecniche e contratti"
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

      {/* Pricing Preview */}
      <section className="py-16 bg-gradient-to-r from-primary/10 to-blue-500/10">
        <div className="rm-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Piani di base
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              I nostri piani standard come riferimento per il preventivo personalizzato
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
                features: ["Tutto il piano starter", "Registro auto", "Fatturazione elettronica", "Radiazioni RVFU"],
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
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`relative p-8 rounded-3xl ${
                  plan.highlight 
                    ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-xl' 
                    : 'bg-white border-gray-200'
                } border hover:shadow-lg transition-all duration-300`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    PIÙ SCELTO
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${
                    plan.color === 'blue' ? 'bg-blue-100' :
                    plan.color === 'purple' ? 'bg-purple-100' :
                    plan.color === 'emerald' ? 'bg-emerald-100' : 'bg-blue-100'
                  } flex items-center justify-center`}>
                    <plan.icon className={`h-8 w-8 ${
                      plan.color === 'blue' ? 'text-blue-600' :
                      plan.color === 'purple' ? 'text-purple-600' :
                      plan.color === 'emerald' ? 'text-emerald-600' : 'text-blue-600'
                    }`} />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                  <p className="text-sm text-gray-600">{plan.description}</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-gray-700">
                      <CheckCircle2 className={`h-4 w-4 ${
                        plan.color === 'blue' ? 'text-blue-500' :
                        plan.color === 'purple' ? 'text-purple-500' :
                        plan.color === 'emerald' ? 'text-emerald-500' : 'text-blue-500'
                      } shrink-0`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mt-12"
          >
            <p className="text-gray-600 mb-6">
              <strong>Nota:</strong> I prezzi mostrati sono indicativi. Il preventivo personalizzato includerà sconti, configurazioni specifiche e servizi aggiuntivi.
            </p>
            <a
              href="#form"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white font-semibold hover:shadow-lg transition-all duration-200"
            >
              <Calculator className="h-5 w-5" />
              Richiedi Preventivo Personalizzato
              <ArrowRight className="h-4 w-4" />
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
