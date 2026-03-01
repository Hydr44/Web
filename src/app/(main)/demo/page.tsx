"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  Shield
} from "lucide-react";

export default function DemoPage() {
  const [formData, setFormData] = useState({
    nome: "", cognome: "", email: "", telefono: "",
    azienda: "", ruolo: "", mezzi: "", note: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'demo', source: 'website',
          name: `${formData.nome} ${formData.cognome}`,
          email: formData.email, phone: formData.telefono,
          company: formData.azienda, role: formData.ruolo,
          vehicles: formData.mezzi, message: formData.note,
          additional_data: { vehicles_count: formData.mezzi }
        }),
      });
      setIsSubmitted(true);
    } catch {
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-[#2563EB] focus:border-transparent";

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg p-8 text-center border border-gray-200 shadow-sm">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Richiesta inviata!</h2>
          <p className="text-sm text-gray-600 mb-5">
            Ti contatteremo entro 24 ore per organizzare la dimostrazione.
          </p>
          <div className="space-y-2 text-sm text-gray-600 mb-6">
            <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-gray-400" /> Durata: 30-45 minuti</div>
            <div className="flex items-center gap-2"><Users className="h-4 w-4 text-gray-400" /> Personalizzata per la tua azienda</div>
          </div>
          <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
            Torna alla Home <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <section className="pt-16 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-3">Richiedi demo<span className="text-blue-500">.</span></h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            Ti facciamo vedere il programma in 30 minuti. Personalizzata per la tua attività, senza impegno.
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-12">
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-3">
                {[
                  { icon: Calendar, text: "Durata 30 minuti" },
                  { icon: Users, text: "Personalizzata per te" },
                  { icon: Shield, text: "Nessun impegno" },
                  { icon: Clock, text: "Ti ricontattiamo in 24h" }
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-700">
                    <item.icon className="h-4 w-4 text-[#2563EB] flex-shrink-0" />
                    {item.text}
                  </div>
                ))}
              </div>

              <div className="p-5 rounded-lg bg-gray-50 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Cosa vedrai nella demo</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  {[
                    "Gestione trasporti e dispatch",
                    "Piazzale e schede veicolo",
                    "Fatturazione elettronica SDI",
                    "Radiazioni RVFU",
                    "App mobile per autisti",
                    "Report e statistiche"
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="lg:col-span-3">
              <form onSubmit={handleSubmit} className="p-7 rounded-lg bg-white border border-gray-200 shadow-sm space-y-5">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Compila il modulo</h3>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome *</label>
                    <input type="text" name="nome" required value={formData.nome} onChange={handleChange} className={inputClass} placeholder="Il tuo nome" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Cognome *</label>
                    <input type="text" name="cognome" required value={formData.cognome} onChange={handleChange} className={inputClass} placeholder="Il tuo cognome" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                  <input type="email" name="email" required value={formData.email} onChange={handleChange} className={inputClass} placeholder="la-tua@email.com" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefono *</label>
                  <input type="tel" name="telefono" required value={formData.telefono} onChange={handleChange} className={inputClass} placeholder="+39 ..." />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Azienda *</label>
                  <input type="text" name="azienda" required value={formData.azienda} onChange={handleChange} className={inputClass} placeholder="Nome della tua azienda" />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Ruolo</label>
                    <select name="ruolo" value={formData.ruolo} onChange={handleChange} className={inputClass}>
                      <option value="">Seleziona</option>
                      <option value="proprietario">Proprietario</option>
                      <option value="direttore">Direttore</option>
                      <option value="responsabile">Responsabile</option>
                      <option value="tecnico">Tecnico</option>
                      <option value="altro">Altro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Numero mezzi</label>
                    <select name="mezzi" value={formData.mezzi} onChange={handleChange} className={inputClass}>
                      <option value="">Quanti mezzi?</option>
                      <option value="1-5">1-5</option>
                      <option value="6-15">6-15</option>
                      <option value="16-30">16-30</option>
                      <option value="30+">30+</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Note</label>
                  <textarea name="note" value={formData.note} onChange={handleChange} rows={3} className={`${inputClass} resize-none`} placeholder="Raccontaci le tue esigenze..." />
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-[#2563EB] text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {isSubmitting ? (
                    <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Invio in corso...</>
                  ) : (
                    <><Calendar className="h-4 w-4" /> Richiedi dimostrazione</>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
