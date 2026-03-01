"use client";

import { useState } from "react";
import { Mail, Phone, Clock, Send, CheckCircle2 } from "lucide-react";

export default function Contatti() {
  const [formData, setFormData] = useState({ nome: "", email: "", telefono: "", messaggio: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "contact",
          source: "website",
          name: formData.nome,
          email: formData.email,
          phone: formData.telefono,
          message: formData.messaggio,
        }),
      });
      setIsSubmitted(true);
    } catch {
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="bg-white">
      <section className="pt-16 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-3">Contattaci<span className="text-blue-500">.</span></h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Raccontaci la tua attività e ti mostriamo come possiamo aiutarti. Demo gratuita, senza impegno.
          </p>
        </div>
      </section>

      <section className="py-14 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-12">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Parliamo</h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Che tu gestisca un&apos;autodemolizione, un centro di soccorso stradale o un deposito giudiziario,
                  siamo qui per capire le tue esigenze.
                </p>
              </div>

              <div className="space-y-3">
                <a href="mailto:info@rescuemanager.eu" className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
                  <Mail className="h-5 w-5 text-[#2563EB]" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Email</div>
                    <div className="text-sm text-gray-600">info@rescuemanager.eu</div>
                  </div>
                </a>
                <a href="tel:+393921723028" className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
                  <Phone className="h-5 w-5 text-[#2563EB]" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Telefono</div>
                    <div className="text-sm text-gray-600">392 172 3028</div>
                  </div>
                </a>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Orari</div>
                    <div className="text-sm text-gray-600">Lun-Ven 9:00-18:00</div>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-lg bg-gray-50 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Cosa succede dopo?</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  {[
                    "Ti rispondiamo entro 24 ore",
                    "Organizziamo una dimostrazione gratuita",
                    "Ti aiutiamo con l'installazione",
                    "Nessun vincolo, nessun impegno",
                  ].map((step) => (
                    <li key={step} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="lg:col-span-3">
              {isSubmitted ? (
                <div className="p-10 rounded-lg bg-gray-50 border border-gray-200 text-center">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 className="h-7 w-7 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Messaggio inviato!</h3>
                  <p className="text-gray-600 text-sm">Ti risponderemo il prima possibile. Controlla la tua email.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-7 rounded-lg bg-white border border-gray-200 shadow-sm space-y-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Scrivici</h3>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome *</label>
                      <input
                        required
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                        placeholder="Il tuo nome"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefono</label>
                      <input
                        type="tel"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                        placeholder="+39 ..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                      placeholder="la-tua@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Messaggio *</label>
                    <textarea
                      required
                      rows={5}
                      value={formData.messaggio}
                      onChange={(e) => setFormData({ ...formData, messaggio: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-none"
                      placeholder="Raccontaci la tua attività: quanti mezzi hai, cosa gestisci (soccorso, demolizioni, deposito), cosa ti serve..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-[#2563EB] text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Invio in corso...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Invia messaggio
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
