"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  FileText,
  Users,
  Calendar,
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
      <header className="text-center lg:text-left">
        <div className="inline-flex items-center gap-2 text-sm rounded-full ring-1 ring-primary/30 px-4 py-2 mb-6 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary font-medium">
          <Building2 className="h-4 w-4" />
          Informazioni Azienda
        </div>
        
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
          La tua <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">azienda</span>
        </h1>
        
        <p className="text-lg text-gray-600 max-w-2xl">
          Gestisci le informazioni della tua azienda, i contatti e i dettagli fiscali per una gestione completa.
        </p>
      </header>

      {orgData ? (
        <>
          {/* Informazioni principali */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Dettagli azienda */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-gray-50/50 border border-gray-200 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Informazioni Principali</h3>
                  <p className="text-sm text-gray-600">Dati aziendali</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nome Azienda</label>
                  <div className="mt-1 p-3 rounded-lg bg-gray-50 border border-gray-200">
                    {orgData.name || "Non specificato"}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Partita IVA</label>
                  <div className="mt-1 p-3 rounded-lg bg-gray-50 border border-gray-200">
                    {orgData.vat_number || "Non specificato"}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Codice Fiscale</label>
                  <div className="mt-1 p-3 rounded-lg bg-gray-50 border border-gray-200">
                    {orgData.fiscal_code || "Non specificato"}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Settore</label>
                  <div className="mt-1 p-3 rounded-lg bg-gray-50 border border-gray-200">
                    {orgData.sector || "Non specificato"}
                  </div>
                </div>
              </div>
            </div>

            {/* Contatti */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-blue-50/30 border border-primary/20 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Contatti</h3>
                  <p className="text-sm text-gray-600">Informazioni di contatto</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-200">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Indirizzo</div>
                    <div className="text-xs text-gray-600">
                      {orgData.address || "Non specificato"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-200">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Phone className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Telefono</div>
                    <div className="text-xs text-gray-600">
                      {orgData.phone || "Non specificato"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-200">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Email</div>
                    <div className="text-xs text-gray-600">
                      {orgData.email || "Non specificato"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-200">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Globe className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Sito Web</div>
                    <div className="text-xs text-gray-600">
                      {orgData.website || "Non specificato"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistiche e informazioni aggiuntive */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-gray-50/50 border border-gray-200 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Membri</h3>
                  <p className="text-sm text-gray-600">Team attivo</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {orgData.member_count || 0}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-blue-50/30 border border-primary/20 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Creata il</h3>
                  <p className="text-sm text-gray-600">Data di registrazione</p>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-900">
                {orgData.created_at ? new Date(orgData.created_at).toLocaleDateString('it-IT') : "Non disponibile"}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-purple-50/30 border border-purple-200/50 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Stato</h3>
                  <p className="text-sm text-gray-600">Organizzazione</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium text-gray-900">Attiva</span>
              </div>
            </div>
          </div>

          {/* Azioni */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/5 via-white to-blue-50/30 border border-primary/20 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center">
                <Edit className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Gestione Azienda</h3>
                <p className="text-sm text-gray-600">Modifica le informazioni aziendali</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-blue-600 text-white font-medium hover:shadow-lg transition-all duration-200">
                <Edit className="h-4 w-4" />
                Modifica informazioni
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 font-medium hover:border-primary/30 hover:shadow-md transition-all duration-200">
                <FileText className="h-4 w-4" />
                Esporta dati
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna organizzazione trovata</h3>
          <p className="text-sm text-gray-600 mb-4">Crea o seleziona un&apos;organizzazione per gestire le informazioni aziendali</p>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-blue-600 text-white text-sm font-medium hover:shadow-lg transition-all duration-200">
            <Building2 className="h-4 w-4" />
            Crea organizzazione
          </button>
        </div>
      )}
    </div>
  );
}