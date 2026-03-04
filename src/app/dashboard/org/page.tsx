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
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold text-gray-900">Organizzazione</h1>
            {orgData && (
              <span className="px-2.5 py-1 bg-blue-50 border border-blue-500/30 text-xs font-mono text-blue-600">
                {orgData.org_code || `ORG${String(orgData.id).slice(0, 3).toUpperCase()}`}
              </span>
            )}
          </div>
          <p className="text-gray-500 mt-1">
            Informazioni aziendali e dati fiscali
          </p>
        </div>
        
        {orgData && (
          <Link
            href="/dashboard/org/edit"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white  hover:bg-blue-500 transition-colors font-medium"
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
            <div className="p-6  bg-white border border-[#243044]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-800">Informazioni Principali</h3>
                  <p className="text-xs text-gray-400">Dati aziendali</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-400">Nome Azienda</label>
                  <div className="mt-1 p-2.5 rounded-lg bg-white border border-[#243044] text-sm text-gray-800">
                    {orgData.name || "Non specificato"}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-400">Partita IVA</label>
                  <div className="mt-1 p-2.5 rounded-lg bg-white border border-[#243044] text-sm text-gray-800">
                    {orgData.vat_number || "Non specificato"}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-400">Codice Fiscale</label>
                  <div className="mt-1 p-2.5 rounded-lg bg-white border border-[#243044] text-sm text-gray-800">
                    {orgData.fiscal_code || "Non specificato"}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-400">Settore</label>
                  <div className="mt-1 p-2.5 rounded-lg bg-white border border-[#243044] text-sm text-gray-800">
                    {orgData.sector || "Non specificato"}
                  </div>
                </div>
              </div>
            </div>

            {/* Contatti */}
            <div className="p-6  bg-white border border-[#243044]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-50 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-800">Contatti</h3>
                  <p className="text-xs text-gray-400">Informazioni di contatto</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white border border-[#243044]">
                  <div className="w-8 h-8 bg-blue-50 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-gray-500">Indirizzo</div>
                    <div className="text-sm text-gray-800 truncate">
                      {orgData.address || "Non specificato"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white border border-[#243044]">
                  <div className="w-8 h-8 bg-green-50 flex items-center justify-center shrink-0">
                    <Phone className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-gray-500">Telefono</div>
                    <div className="text-sm text-gray-800">
                      {orgData.phone || "Non specificato"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white border border-[#243044]">
                  <div className="w-8 h-8 bg-purple-50 flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-gray-500">Email</div>
                    <div className="text-sm text-gray-800 truncate">
                      {orgData.email || "Non specificato"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white border border-[#243044]">
                  <div className="w-8 h-8 bg-amber-50 flex items-center justify-center shrink-0">
                    <Globe className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-gray-500">Sito Web</div>
                    <div className="text-sm text-gray-800 truncate">
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
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna organizzazione trovata</h3>
          <p className="text-sm text-gray-500 mb-4">Crea o seleziona un&apos;organizzazione per gestire le informazioni aziendali</p>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 text-gray-900 text-sm font-medium hover:shadow-lg shadow-black/20 transition-all duration-200">
            <Building2 className="h-4 w-4" />
            Crea organizzazione
          </button>
        </div>
      )}
    </div>
  );
}