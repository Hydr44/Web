"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, Send, CheckCircle2 } from "lucide-react";

export default function ContattiPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simula invio (da implementare con API)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Reset form dopo 3 secondi
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: "", email: "", phone: "", company: "", message: "" });
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <main className="min-h-screen bg-[#141c27] pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna alla home
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-100 mb-4">
            Contattaci
          </h1>
          <p className="text-lg text-slate-400 max-w-3xl">
            Hai domande su RescueManager? Vuoi richiedere una demo o parlare con il nostro team? Compila il form o contattaci direttamente.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Form contatti */}
          <div className="p-8 rounded-2xl bg-[#1a2536] border border-[#243044]">
            <h2 className="text-2xl font-semibold text-slate-100 mb-6">Richiedi Informazioni</h2>
            
            {isSubmitted ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-100 mb-2">Messaggio Inviato!</h3>
                <p className="text-sm text-slate-400 text-center">
                  Ti risponderemo al più presto. Controlla la tua email.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                    Nome e Cognome *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-[#141c27] border border-[#243044] text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Mario Rossi"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-[#141c27] border border-[#243044] text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="mario.rossi@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-2">
                    Telefono
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-[#141c27] border border-[#243044] text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="+39 123 456 7890"
                  />
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-slate-300 mb-2">
                    Azienda
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-[#141c27] border border-[#243044] text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Nome azienda"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">
                    Messaggio *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl bg-[#141c27] border border-[#243044] text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="Scrivi qui la tua richiesta..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Invio in corso...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Invia Richiesta
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Info contatti */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#1a2536] border border-[#243044]">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-2">Email</h3>
                  <a href="mailto:info@rescuemanager.eu" className="text-slate-400 hover:text-blue-400 transition-colors">
                    info@rescuemanager.eu
                  </a>
                  <p className="text-sm text-slate-500 mt-2">
                    Rispondiamo entro 24 ore lavorative
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#1a2536] border border-[#243044]">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-2">Telefono</h3>
                  <a href="tel:+393921723028" className="text-slate-400 hover:text-emerald-400 transition-colors">
                    +39 392 172 3028
                  </a>
                  <p className="text-sm text-slate-500 mt-2">
                    Lun-Ven: 9:00 - 18:00
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#1a2536] border border-[#243044]">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-2">Sede</h3>
                  <p className="text-slate-400">
                    Italia
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    Assistenza remota disponibile
                  </p>
                </div>
              </div>
            </div>

            {/* Demo box */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-emerald-500/10 border border-blue-500/30">
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Richiedi una Demo</h3>
              <p className="text-sm text-slate-400 mb-4">
                Scopri RescueManager in azione con una demo personalizzata per la tua azienda.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors"
              >
                Prova Gratis
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
