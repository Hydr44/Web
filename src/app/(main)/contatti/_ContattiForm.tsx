"use client";

import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";

export default function ContattiForm() {
    const [formData, setFormData] = useState({
        nome: "",
        email: "",
        telefono: "",
        azienda: "",
        ruolo: "",
        mezzi: "",
        tipo_richiesta: "info",
        messaggio: "",
    });
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
                    type: formData.tipo_richiesta === "preventivo" ? "quote" : formData.tipo_richiesta === "demo" ? "demo" : "contact",
                    source: "website",
                    name: formData.nome,
                    email: formData.email,
                    phone: formData.telefono,
                    company: formData.azienda,
                    role: formData.ruolo,
                    vehicles: formData.mezzi,
                    message: formData.messaggio,
                    additional_data: { request_type: formData.tipo_richiesta }
                }),
            });
            setIsSubmitted(true);
        } catch {
            setIsSubmitted(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="p-10 bg-white border border-gray-200 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-green-50 border border-green-100 flex items-center justify-center mb-5 shrink-0">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Richiesta inviata</h3>
                <p className="text-gray-500 text-sm">Ti risponderemo il prima possibile all'indirizzo {formData.email}.</p>
            </div>
        );
    }

    const inputClass = "w-full border border-gray-200 px-4 py-3 text-sm bg-gray-50 text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors";
    const labelClass = "block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2";

    return (
        <form onSubmit={handleSubmit} className="p-8 bg-white border border-gray-200 space-y-6">
            <h3 className="text-xl font-bold text-gray-900 pb-4 border-b border-gray-100 uppercase tracking-wide">Inviaci la tua richiesta</h3>

            <div className="grid sm:grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>Nome e Cognome *</label>
                    <input
                        required
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        className={inputClass}
                        placeholder="Nome Cognome"
                    />
                </div>
                <div>
                    <label className={labelClass}>Tipo di richiesta *</label>
                    <select
                        required
                        value={formData.tipo_richiesta}
                        onChange={(e) => setFormData({ ...formData, tipo_richiesta: e.target.value })}
                        className={inputClass}
                    >
                        <option value="info">Informazioni generali</option>
                        <option value="demo">Richiesta Demo gratuita</option>
                        <option value="preventivo">Richiesta Preventivo</option>
                    </select>
                </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>Email *</label>
                    <input
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={inputClass}
                        placeholder="la-tua@email.com"
                    />
                </div>
                <div>
                    <label className={labelClass}>Telefono *</label>
                    <input
                        required
                        type="tel"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        className={inputClass}
                        placeholder="+39 ..."
                    />
                </div>
            </div>

            <div>
                <label className={labelClass}>Azienda</label>
                <input
                    value={formData.azienda}
                    onChange={(e) => setFormData({ ...formData, azienda: e.target.value })}
                    className={inputClass}
                    placeholder="Nome dell'azienda (opzionale se sei privato)"
                />
            </div>

            {formData.tipo_richiesta !== "info" && (
                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Ruolo in azienda</label>
                        <select
                            value={formData.ruolo}
                            onChange={(e) => setFormData({ ...formData, ruolo: e.target.value })}
                            className={inputClass}
                        >
                            <option value="">Seleziona</option>
                            <option value="titolare">Titolare / Amministratore</option>
                            <option value="direttore">Direttore Operations</option>
                            <option value="responsabile">Responsabile Flotta</option>
                            <option value="tecnico">Admin IT / Tecnico</option>
                            <option value="altro">Altro</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Numero mezzi soccorso</label>
                        <select
                            value={formData.mezzi}
                            onChange={(e) => setFormData({ ...formData, mezzi: e.target.value })}
                            className={inputClass}
                        >
                            <option value="">Seleziona</option>
                            <option value="1-5">1 - 5 mezzi</option>
                            <option value="6-15">6 - 15 mezzi</option>
                            <option value="16-30">16 - 30 mezzi</option>
                            <option value="30+">Oltre 30 mezzi</option>
                        </select>
                    </div>
                </div>
            )}

            <div>
                <label className={labelClass}>Note o Esigenze *</label>
                <textarea
                    required
                    rows={4}
                    value={formData.messaggio}
                    onChange={(e) => setFormData({ ...formData, messaggio: e.target.value })}
                    className={`${inputClass} resize-none`}
                    placeholder={
                        formData.tipo_richiesta === "demo"
                            ? "Cosa vorresti vedere nella demo?"
                            : formData.tipo_richiesta === "preventivo"
                            ? "Descrivi le tue necessità e moduli di interesse (Es. SDI, RENTRI, Gestione Trasporti, RVFU)..."
                            : "Come possiamo aiutarti?"
                    }
                />
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 mt-4"
            >
                {isSubmitting ? (
                    <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Invio in corso...
                    </>
                ) : (
                    <>
                        <Send className="h-4 w-4" />
                        {formData.tipo_richiesta === "demo" ? "Richiedi Demo" : formData.tipo_richiesta === "preventivo" ? "Richiedi Preventivo" : "Invia Messaggio"}
                    </>
                )}
            </button>
        </form>
    );
}
