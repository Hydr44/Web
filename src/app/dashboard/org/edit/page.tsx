"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { motion } from "framer-motion";
import { 
  Building2, 
  ArrowLeft, 
  Save, 
  CheckCircle,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText
} from "lucide-react";
import Link from "next/link";

export default function EditOrgPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgData, setOrgData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    vat: "",
    tax_code: ""
  });

  useEffect(() => {
    const loadOrgData = async () => {
      try {
        const supabase = supabaseBrowser();
        
        // Ottieni l'utente corrente
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("Error getting user:", userError);
          setLoading(false);
          return;
        }
        
        // Carica dati organizzazione dell'utente corrente
        const { data: profile } = await supabase
          .from("profiles")
          .select("current_org")
          .eq("id", user.id)
          .single();
        
        if (profile?.current_org) {
          const { data: org, error: orgError } = await supabase
            .from("orgs")
            .select("*")
            .eq("id", profile.current_org)
            .single();
          
          if (orgError) {
            console.warn("Errore caricamento organizzazione:", orgError);
            setError("Errore nel caricamento dei dati dell'organizzazione");
          } else if (org) {
            setOrgData(org);
            setFormData({
              name: org.name || "",
              description: org.description || "",
              address: org.address || "",
              phone: org.phone || "",
              email: org.email || "",
              website: org.website || "",
              vat: org.vat || "",
              tax_code: org.tax_code || ""
            });
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading org data:", error);
        setError("Errore nel caricamento dei dati");
        setLoading(false);
      }
    };

    loadOrgData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const supabase = supabaseBrowser();
      
      // Verifica autenticazione
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Utente non autenticato");
      }

      // Verifica che l'utente sia owner dell'organizzazione
      const { data: membership } = await supabase
        .from("org_members")
        .select("role")
        .eq("org_id", orgData.id)
        .eq("user_id", user.id)
        .single();

      if (!membership || membership.role !== 'owner') {
        throw new Error("Non hai i permessi per modificare questa organizzazione");
      }

      // Aggiorna l'organizzazione
      const { error: updateError } = await supabase
        .from("orgs")
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          address: formData.address.trim() || null,
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          website: formData.website.trim() || null,
          vat: formData.vat.trim() || null,
          tax_code: formData.tax_code.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", orgData.id);

      if (updateError) {
        throw new Error(`Errore durante l'aggiornamento: ${updateError.message}`);
      }

      setSuccess(true);
      
      // Redirect dopo 2 secondi
      setTimeout(() => {
        router.push("/dashboard/org");
      }, 2000);

    } catch (error) {
      console.error("Errore aggiornamento organizzazione:", error);
      setError(error instanceof Error ? error.message : "Errore imprevisto");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50/30 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-[#1a2536] rounded-2xl shadow-xl p-8 border border-[#243044] text-center"
        >
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-slate-200 mb-4">Organizzazione Aggiornata!</h2>
          <p className="text-slate-400 mb-8">
            Le informazioni dell'organizzazione sono state aggiornate con successo. Sarai reindirizzato alla pagina organizzazione a breve.
          </p>
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </motion.div>
      </div>
    );
  }

  if (!orgData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50/30 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-[#1a2536] rounded-2xl shadow-xl p-8 border border-[#243044] text-center"
        >
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-slate-200 mb-4">Errore</h2>
          <p className="text-slate-400 mb-8">
            Non è stato possibile caricare i dati dell'organizzazione.
          </p>
          <Link
            href="/dashboard/org"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-semibold rounded-xl hover:shadow-lg shadow-black/20 transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna all'Organizzazione
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-blue-50/30 py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/org"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna all'Organizzazione
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-100">Modifica Organizzazione</h1>
              <p className="text-slate-400">Aggiorna le informazioni della tua azienda</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informazioni Principali */}
          <div className="bg-[#1a2536] rounded-2xl shadow-lg shadow-black/20 p-8 border border-[#243044]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-100">Informazioni Principali</h2>
                <p className="text-sm text-slate-400">Dati aziendali essenziali</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                  Nome Organizzazione <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-[#243044] rounded-xl  focus:ring-blue-500 focus:border-primary"
                  required
                  disabled={saving}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
                  Descrizione
                </label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-[#243044] rounded-xl  focus:ring-blue-500 focus:border-primary"
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          {/* Contatti */}
          <div className="bg-[#1a2536] rounded-2xl shadow-lg shadow-black/20 p-8 border border-[#243044]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-100">Contatti</h2>
                <p className="text-sm text-slate-400">Informazioni di contatto</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-slate-300 mb-2">
                  Indirizzo
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-[#243044] rounded-xl  focus:ring-blue-500 focus:border-primary"
                  disabled={saving}
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
                  className="w-full px-4 py-3 border border-[#243044] rounded-xl  focus:ring-blue-500 focus:border-primary"
                  disabled={saving}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-[#243044] rounded-xl  focus:ring-blue-500 focus:border-primary"
                  disabled={saving}
                />
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-medium text-slate-300 mb-2">
                  Sito Web
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-[#243044] rounded-xl  focus:ring-blue-500 focus:border-primary"
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          {/* Dati Fiscali */}
          <div className="bg-[#1a2536] rounded-2xl shadow-lg shadow-black/20 p-8 border border-[#243044]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-100">Dati Fiscali</h2>
                <p className="text-sm text-slate-400">Informazioni fiscali e legali</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
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
                  className="w-full px-4 py-3 border border-[#243044] rounded-xl  focus:ring-blue-500 focus:border-primary"
                  disabled={saving}
                />
              </div>

              <div>
                <label htmlFor="tax_code" className="block text-sm font-medium text-slate-300 mb-2">
                  Codice Fiscale
                </label>
                <input
                  type="text"
                  id="tax_code"
                  name="tax_code"
                  value={formData.tax_code}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-[#243044] rounded-xl  focus:ring-blue-500 focus:border-primary"
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4" />
              {error}
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Link
              href="/dashboard/org"
              className="px-6 py-3 rounded-xl border border-[#243044] text-slate-300 font-semibold hover:bg-[#141c27] transition-all duration-200 text-center"
            >
              Annulla
            </Link>
            
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-semibold hover:shadow-lg shadow-black/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Salvataggio...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salva Modifiche
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
