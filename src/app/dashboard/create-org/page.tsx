"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Building2, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  Globe,
  CheckCircle2,
  ArrowRight,
  Zap,
  FileText,
  Calculator,
  Search,
  AlertCircle
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOptimizedAnimations } from "@/hooks/useOptimizedAnimations";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function CreateOrgPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();
  const animations = useOptimizedAnimations();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    vat: "",
    taxCode: ""
  });

  // Stati per funzionalità avanzate
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [calculatingCF, setCalculatingCF] = useState(false);

  useEffect(() => {
    // Carica email utente
    const loadUser = async () => {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
        setFormData(prev => ({ ...prev, email: user.email || "" }));
      }
    };
    loadUser();
  }, []);

  // Funzione per suggerimenti indirizzo (mock - in produzione usare API geocoding)
  const handleAddressSearch = async (query: string) => {
    if (query.length < 3) return;
    
    // Mock suggerimenti - in produzione usare API come Google Places
    const mockSuggestions = [
      `${query}, Roma, RM`,
      `${query}, Milano, MI`,
      `${query}, Napoli, NA`,
      `${query}, Torino, TO`,
      `${query}, Firenze, FI`
    ];
    
    setAddressSuggestions(mockSuggestions);
    setShowAddressSuggestions(true);
  };

  // Funzione per calcolo Codice Fiscale (semplificata)
  const calculateCodiceFiscale = async () => {
    if (!formData.name) {
      setError("Inserisci il nome dell'organizzazione per calcolare il Codice Fiscale");
      return;
    }

    setCalculatingCF(true);
    
    try {
      // Mock calcolo CF - in produzione usare API specifica
      const name = formData.name.toUpperCase().replace(/[^A-Z]/g, '');
      const mockCF = name.substring(0, 6) + '80A01H501S'; // Esempio
      
      setFormData(prev => ({ ...prev, taxCode: mockCF }));
    } catch (error) {
      setError("Errore nel calcolo del Codice Fiscale");
    } finally {
      setCalculatingCF(false);
    }
  };

  // Seleziona suggerimento indirizzo
  const selectAddressSuggestion = (suggestion: string) => {
    setFormData(prev => ({ ...prev, address: suggestion }));
    setShowAddressSuggestions(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Gestione suggerimenti indirizzo
    if (name === 'address' && value.length > 2) {
      handleAddressSearch(value);
    } else if (name === 'address') {
      setShowAddressSuggestions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Usa l'API route per creare l'organizzazione
      const response = await fetch('/api/org/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Errore durante la creazione');
      }

      setSuccess(true);
      
      // Redirect dopo 2 secondi
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);

    } catch (error) {
      console.error("Errore creazione organizzazione:", error);
      setError(error instanceof Error ? error.message : "Errore imprevisto");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50/30 flex items-center justify-center px-4">
        <motion.div
          {...animations.scaleIn}
          className="w-full max-w-md bg-[#1a2536] rounded-2xl shadow-xl p-8 border border-[#243044] text-center"
        >
          <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-100 mb-4">
            Organizzazione Creata!
          </h2>
          
          <p className="text-slate-400 mb-6">
            La tua organizzazione è stata creata con successo. 
            Ora puoi iniziare a utilizzare RescueManager.
          </p>
          
          <LoadingSpinner size="sm" color="primary" text="Reindirizzamento alla dashboard..." />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-blue-50/30">
      <div className="rm-container py-12">
        <motion.div
          {...animations.slideUp}
          className="max-w-2xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              {...animations.scaleIn}
              className="inline-flex items-center gap-2 text-xs rounded-full ring-1 ring-primary/30 px-3 py-1.5 mb-6 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary font-medium"
            >
              <Building2 className="h-3 w-3" />
              Crea Organizzazione
            </motion.div>
            
            <h1 className="text-4xl font-bold text-slate-100 mb-4">
              Crea la tua{" "}
              <span className="text-primary">Organizzazione</span>
            </h1>
            
            <p className="text-lg text-slate-400">
              Configura la tua organizzazione per iniziare a utilizzare RescueManager
            </p>
          </div>

          {/* Form */}
          <motion.div
            {...animations.slideUp}
            className="bg-[#1a2536] rounded-2xl shadow-xl p-8 border border-[#243044]"
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Informazioni Principali */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-100">Informazioni Principali</h3>
                </div>

                {/* Nome Organizzazione */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                    Nome Organizzazione <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="es. Autofficina Rossi"
                      className="w-full pl-10 pr-3 py-3 border border-[#243044] rounded-xl  focus:ring-blue-500 focus:border-primary"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Descrizione */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
                    Descrizione
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Breve descrizione della tua attività..."
                    rows={3}
                    className="w-full px-3 py-3 border border-[#243044] rounded-xl  focus:ring-blue-500 focus:border-primary"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Contatti */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-100">Contatti</h3>
                </div>

                {/* Indirizzo con suggerimenti */}
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-slate-300 mb-2">
                    Indirizzo
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Via, Città, CAP"
                      className="w-full pl-10 pr-3 py-3 border border-[#243044] rounded-xl  focus:ring-blue-500 focus:border-primary"
                      disabled={loading}
                    />
                    {showAddressSuggestions && addressSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a2536] border border-[#243044] rounded-xl shadow-lg shadow-black/20 z-10 max-h-48 overflow-y-auto">
                        {addressSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => selectAddressSuggestion(suggestion)}
                            className="w-full px-4 py-2 text-left hover:bg-[#141c27] flex items-center gap-2"
                          >
                            <Search className="h-4 w-4 text-slate-500" />
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Telefono e Email */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-2">
                      Telefono
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+39 123 456 7890"
                        className="w-full pl-10 pr-3 py-3 border border-[#243044] rounded-xl  focus:ring-blue-500 focus:border-primary"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="info@azienda.com"
                        className="w-full pl-10 pr-3 py-3 border border-[#243044] rounded-xl  focus:ring-blue-500 focus:border-primary"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                {/* Website */}
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-slate-300 mb-2">
                    Sito Web
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <input
                      type="url"
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://www.azienda.com"
                      className="w-full pl-10 pr-3 py-3 border border-[#243044] rounded-xl  focus:ring-blue-500 focus:border-primary"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Dati Fiscali */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-100">Dati Fiscali</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Partita IVA */}
                  <div>
                    <label htmlFor="vat" className="block text-sm font-medium text-slate-300 mb-2">
                      Partita IVA
                    </label>
                    <input
                      type="text"
                      id="vat"
                      name="vat"
                      value={formData.vat}
                      onChange={handleChange}
                      placeholder="IT12345678901"
                      className="w-full px-3 py-3 border border-[#243044] rounded-xl  focus:ring-blue-500 focus:border-primary"
                      disabled={loading}
                    />
                  </div>

                  {/* Codice Fiscale con calcolo */}
                  <div>
                    <label htmlFor="taxCode" className="block text-sm font-medium text-slate-300 mb-2">
                      Codice Fiscale
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="taxCode"
                        name="taxCode"
                        value={formData.taxCode}
                        onChange={handleChange}
                        placeholder="RSSMRA80A01H501S"
                        className="flex-1 px-3 py-3 border border-[#243044] rounded-xl  focus:ring-blue-500 focus:border-primary"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={calculateCodiceFiscale}
                        disabled={calculatingCF || loading}
                        className="px-4 py-3 bg-gradient-to-r from-blue-600 to-emerald-500 text-white rounded-xl hover:shadow-lg shadow-black/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {calculatingCF ? (
                          <LoadingSpinner size="sm" color="white" />
                        ) : (
                          <Calculator className="h-4 w-4" />
                        )}
                        {calculatingCF ? "Calcolo..." : "Calcola"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  {...animations.fadeIn}
                  className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </motion.div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !formData.name.trim()}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-semibold hover:shadow-lg shadow-black/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <LoadingSpinner size="sm" color="white" text="Creazione in corso..." />
                ) : (
                  <>
                    <Building2 className="h-5 w-5" />
                    Crea Organizzazione
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Benefits */}
          <motion.div
            {...animations.staggerContainer}
            className="mt-8 grid md:grid-cols-3 gap-4"
          >
            {[
              { icon: Users, title: "Gestione Team", desc: "Invita membri e gestisci ruoli" },
              { icon: Zap, title: "Produttività", desc: "Strumenti avanzati per la tua officina" },
              { icon: Building2, title: "Personalizzazione", desc: "Configura tutto per la tua attività" }
            ].map((benefit, i) => (
              <motion.div 
                key={benefit.title} 
                {...animations.staggerItem}
                className="p-4 rounded-xl bg-[#1a2536]/80 backdrop-blur-sm border border-[#243044]"
              >
                <benefit.icon className="h-6 w-6 text-primary mb-2" />
                <h3 className="font-semibold text-slate-100 mb-1">{benefit.title}</h3>
                <p className="text-sm text-slate-400">{benefit.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
