"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe,
  Edit
} from "lucide-react";

export default function OrgPage() {
  const [loading, setLoading] = useState(true);
  const [orgData, setOrgData] = useState<any>(null);

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
          // Carica dati organizzazione
          const { data: org, error: orgError } = await supabase
            .from("orgs")
            .select("*")
            .eq("id", profile.current_org)
            .single();
          
          if (orgError) {
            console.warn("Errore caricamento organizzazione:", orgError);
          } else if (org) {
            setOrgData(org);
          }

          // Statistiche non necessarie - tutto è nell'app desktop
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading org data:", error);
        setLoading(false);
      }
    };

    loadOrgData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Organizzazione</h1>
          <p className="text-slate-400 mt-1">
            Informazioni aziendali e dati fiscali
          </p>
        </div>
        
        {orgData && (
          <Link
            href="/dashboard/org/edit"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors font-medium"
          >
            <Edit className="h-4 w-4" />
            Modifica
          </Link>
        )}
      </div>

      {orgData ? (
        <>
          {/* Informazioni principali */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Dettagli azienda */}
            <div className="p-6 rounded-xl bg-[#1a2536] border border-[#243044]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-200">Informazioni Principali</h3>
                  <p className="text-xs text-slate-500">Dati aziendali</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-500">Nome Azienda</label>
                  <div className="mt-1 p-2.5 rounded-lg bg-[#141c27] border border-[#243044] text-sm text-slate-200">
                    {orgData.name || "Non specificato"}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500">Partita IVA</label>
                  <div className="mt-1 p-2.5 rounded-lg bg-[#141c27] border border-[#243044] text-sm text-slate-200">
                    {orgData.vat_number || "Non specificato"}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500">Codice Fiscale</label>
                  <div className="mt-1 p-2.5 rounded-lg bg-[#141c27] border border-[#243044] text-sm text-slate-200">
                    {orgData.fiscal_code || "Non specificato"}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500">Settore</label>
                  <div className="mt-1 p-2.5 rounded-lg bg-[#141c27] border border-[#243044] text-sm text-slate-200">
                    {orgData.sector || "Non specificato"}
                  </div>
                </div>
              </div>
            </div>

            {/* Contatti */}
            <div className="p-6 rounded-xl bg-[#1a2536] border border-[#243044]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-200">Contatti</h3>
                  <p className="text-xs text-slate-500">Informazioni di contatto</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#141c27] border border-[#243044]">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-slate-400">Indirizzo</div>
                    <div className="text-sm text-slate-200 truncate">
                      {orgData.address || "Non specificato"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#141c27] border border-[#243044]">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Phone className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-slate-400">Telefono</div>
                    <div className="text-sm text-slate-200">
                      {orgData.phone || "Non specificato"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#141c27] border border-[#243044]">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-slate-400">Email</div>
                    <div className="text-sm text-slate-200 truncate">
                      {orgData.email || "Non specificato"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#141c27] border border-[#243044]">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                    <Globe className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-slate-400">Sito Web</div>
                    <div className="text-sm text-slate-200 truncate">
                      {orgData.website || "Non specificato"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-[#1a2536] flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-100 mb-2">Nessuna organizzazione trovata</h3>
          <p className="text-sm text-slate-400 mb-4">Crea o seleziona un&apos;organizzazione per gestire le informazioni aziendali</p>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 text-white text-sm font-medium hover:shadow-lg shadow-black/20 transition-all duration-200">
            <Building2 className="h-4 w-4" />
            Crea organizzazione
          </button>
        </div>
      )}
    </div>
  );
}