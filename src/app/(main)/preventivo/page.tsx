"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Calculator, 
  CheckCircle2, 
  ArrowRight,
  Clock
} from "lucide-react";

export default function PreventivoPage() {
  const [formData, setFormData] = useState({
    nome: "", cognome: "", email: "", telefono: "",
    azienda: "", ruolo: "", mezzi: "", dipendenti: "",
    esigenze: "", budget: "", timeline: "", note: ""
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
          type: 'quote', source: 'website',
          name: `${formData.nome} ${formData.cognome}`,
          email: formData.email, phone: formData.telefono,
          company: formData.azienda, role: formData.ruolo,
          vehicles: formData.mezzi, message: formData.esigenze,
          additional_data: {
            vehicles_count: formData.mezzi, employees: formData.dipendenti,
            budget: formData.budget, timeline: formData.timeline, notes: formData.note
          }
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
          <h2 className="text-xl font-bold text-gray-900 mb-3">Preventivo richiesto!</h2>
          <p className="text-sm text-gray-600 mb-5">Ti invieremo un preventivo personalizzato entro 48 ore.</p>
          <div className="space-y-2 text-sm text-gray-600 mb-6">
            <div className="flex items-center gap-2"><Calculator className="h-4 w-4 text-gray-400" /> Personalizzato per le tue esigenze</div>
            <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-gray-400" /> Consegna entro 48 ore</div>
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
      <section className="pt-28 pb-10 bg-gray-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Richiedi un preventivo</h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Raccontaci la tua attività e ti prepariamo un preventivo su misura. Nessun impegno.
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-12">
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-3">
                {[
                  { icon: Calculator, text: "Preventivo personalizzato" },
                  { icon: Clock, text: "Risposta entro 48 ore" },
                  { icon: CheckCircle2, text: "Nessun impegno" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-700">
                    <item.icon className="h-4 w-4 text-[#2563EB] flex-shrink-0" />
                    {item.text}
                  </div>
                ))}
              </div>

              <div className="p-5 rounded-lg bg-gray-50 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Cosa riceverai</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  {[
                    "Costi mensili e annuali dettagliati",
                    "Piano personalizzato per la tua attività",
                    "Tempi di installazione e formazione",
                    "Dettagli su assistenza e garanzie",
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Ruolo *</label>
                    <select name="ruolo" required value={formData.ruolo} onChange={handleChange} className={inputClass}>
                      <option value="">Seleziona</option>
                      <option value="proprietario">Proprietario</option>
                      <option value="direttore">Direttore</option>
                      <option value="responsabile">Responsabile</option>
                      <option value="acquisti">Resp. Acquisti</option>
                      <option value="altro">Altro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Numero mezzi *</label>
                    <select name="mezzi" required value={formData.mezzi} onChange={handleChange} className={inputClass}>
                      <option value="">Quanti mezzi?</option>
                      <option value="1-5">1-5</option>
                      <option value="6-15">6-15</option>
                      <option value="16-30">16-30</option>
                      <option value="30+">30+</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Esigenze principali *</label>
                  <textarea name="esigenze" required value={formData.esigenze} onChange={handleChange} rows={3} className={`${inputClass} resize-none`} placeholder="Cosa ti serve: gestione trasporti, fatturazione, RVFU, RENTRI..." />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Quando vorresti iniziare?</label>
                  <select name="timeline" value={formData.timeline} onChange={handleChange} className={inputClass}>
                    <option value="">Seleziona</option>
                    <option value="immediato">Subito</option>
                    <option value="1-mese">Entro 1 mese</option>
                    <option value="3-mesi">Entro 3 mesi</option>
                    <option value="pianificazione">Sto solo valutando</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Note</label>
                  <textarea name="note" value={formData.note} onChange={handleChange} rows={2} className={`${inputClass} resize-none`} placeholder="Altre informazioni utili..." />
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-[#2563EB] text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {isSubmitting ? (
                    <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Invio in corso...</>
                  ) : (
                    <><Calculator className="h-4 w-4" /> Richiedi preventivo</>
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
