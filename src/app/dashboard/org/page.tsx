"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  FileText,
  CreditCard,
  Hash
} from "lucide-react";

export default function OrgPage() {
  const [loading, setLoading] = useState(true);
  const [orgData, setOrgData] = useState<any>(null);
  const [orgSettings, setOrgSettings] = useState<any>(null);

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
          // Carica dati base organizzazione
          const { data: org } = await supabase
            .from("orgs")
            .select("*")
            .eq("id", profile.current_org)
            .single();
          
          if (org) setOrgData(org);

          // Carica dati completi da org_settings
          const { data: settings } = await supabase
            .from("org_settings")
            .select("*")
            .eq("org_id", profile.current_org)
            .maybeSingle();

          if (settings) setOrgSettings(settings);
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

  // Costruisci indirizzo formattato
  const formatAddress = (addr: any) => {
    if (!addr) return "Non specificato";
    const parts = [];
    if (addr.street) parts.push(addr.street);
    if (addr.zip) parts.push(addr.zip);
    if (addr.city) parts.push(`${addr.city}${addr.province ? ` (${addr.province})` : ''}`);
    if (addr.country) parts.push(addr.country);
    return parts.join(", ") || "Non specificato";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold text-gray-900">Organizzazione</h1>
            {orgData && (
              <span className="px-2.5 py-1 bg-blue-50 border border-blue-500/30 text-xs font-mono text-blue-600">
                {orgData.number ? `ORG${String(orgData.number).padStart(4, "0")}` : `ORG${String(orgData.id).slice(0, 3).toUpperCase()}`}
              </span>
            )}
          </div>
          <p className="text-gray-500 mt-1">
            Informazioni operative e fiscali in sola lettura
          </p>
        </div>
      </div>

      {orgData ? (
        <div className="bg-white border border-gray-200 p-8 rounded-lg">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-16 w-16 bg-blue-50 flex items-center justify-center rounded-xl border border-blue-100">
              <span className="text-2xl font-bold text-blue-600">
                {(orgData.name || "O").charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{orgData.name || "Azienda senza nome"}</h2>
              <p className="text-sm text-gray-500">
                Creata il {new Date(orgData.created_at).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {/* Colonne Dati Fiscali */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-gray-400" />
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Dati Aziendali</h3>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Denominazione / Ragione Sociale</label>
                  <p className="text-sm font-medium text-gray-900">{orgSettings?.company_name || orgData.name || "—"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Partita IVA</label>
                    <p className="text-sm font-medium text-gray-900 font-mono">{orgSettings?.vat || "—"}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Cod. Fiscale</label>
                    <p className="text-sm font-medium text-gray-900 font-mono">{orgSettings?.tax_code || "—"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Regime Fiscale</label>
                    <p className="text-sm font-medium text-gray-900">{orgSettings?.regime_fiscale || "—"}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Prefisso Fattura</label>
                    <p className="text-sm font-medium text-gray-900">{orgSettings?.invoice_prefix || "—"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne Contatti & Sede */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-gray-400" />
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Sede e Contatti</h3>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Indirizzo Sede Legale</label>
                  <p className="text-sm font-medium text-gray-900">{formatAddress(orgSettings?.address)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Telefono</label>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      {orgSettings?.phone || "—"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Email</label>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900 truncate">
                      <Mail className="h-3.5 w-3.5 text-gray-400" />
                      {orgSettings?.email || "—"}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">PEC</label>
                    <p className="text-sm font-medium text-gray-900 truncate">{orgSettings?.pec || "—"}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Sito Web</label>
                    <p className="text-sm font-medium text-gray-900 truncate">{orgSettings?.website || "—"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dati Bancari */}
            <div className="md:col-span-2 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-5 w-5 text-gray-400" />
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Dati Bancari</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">IBAN</label>
                  <p className="text-sm font-medium text-gray-900 font-mono">{orgSettings?.iban || "—"}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Banca Appoggio</label>
                  <p className="text-sm font-medium text-gray-900">{orgSettings?.bank_name || "—"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Nessuna organizzazione</h3>
          <p className="text-sm text-gray-500 mb-4">Non fai ancora parte di nessuna organizzazione.</p>
        </div>
      )}
    </div>
  );
}