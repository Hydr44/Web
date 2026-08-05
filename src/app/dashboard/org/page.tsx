"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Building2, MapPin, Phone, Mail, FileText, CreditCard, Pencil } from "lucide-react";

// Campo etichetta+valore (0px, slate).
function Field({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">{label}</label>
      <p className={`text-sm font-medium text-slate-900 truncate ${mono ? "font-mono" : ""}`}>{value || "—"}</p>
    </div>
  );
}

export default function OrgPage() {
  usePageTitle("Organizzazione");
  const [loading, setLoading] = useState(true);
  const [orgData, setOrgData] = useState<any>(null);
  const [orgSettings, setOrgSettings] = useState<any>(null);

  useEffect(() => {
    const loadOrgData = async () => {
      try {
        const supabase = supabaseBrowser();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setLoading(false);
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("current_org")
          .eq("id", user.id)
          .single();

        if (profile?.current_org) {
          const { data: org } = await supabase
            .from("orgs")
            .select("*")
            .eq("id", profile.current_org)
            .single();
          if (org) setOrgData(org);

          const { data: settingsArray } = await supabase
            .from("org_settings")
            .select("*")
            .eq("org_id", profile.current_org);
          if (settingsArray && settingsArray.length > 0) {
            const combinedSettings: Record<string, any> = {};
            settingsArray.forEach((item) => {
              if (item.value && typeof item.value === "object") Object.assign(combinedSettings, item.value);
            });
            setOrgSettings(combinedSettings);
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
      <div className="space-y-6">
        <div className="w-48 h-8 bg-slate-200 animate-pulse" />
        <div className="border border-slate-200 bg-white p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-100 animate-pulse" />
            <div className="space-y-2">
              <div className="w-40 h-5 bg-slate-200 animate-pulse" />
              <div className="w-32 h-3 bg-slate-100 animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => <div key={i} className="w-full h-10 bg-slate-50 animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  const formatAddress = (addr: any) => {
    if (!addr) return "—";
    const parts = [];
    if (addr.street) parts.push(addr.street);
    if (addr.zip) parts.push(addr.zip);
    if (addr.city) parts.push(`${addr.city}${addr.province ? ` (${addr.province})` : ""}`);
    if (addr.country) parts.push(addr.country);
    return parts.join(", ") || "—";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Organizzazione</h1>
            {orgData && (
              <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-xs font-mono text-slate-600">
                {orgData.number ? `ORG${String(orgData.number).padStart(4, "0")}` : `ORG${String(orgData.id).slice(0, 3).toUpperCase()}`}
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm mt-1">Dati aziendali, fiscali e bancari della tua organizzazione.</p>
        </div>
        {orgData && (
          <Link
            href="/dashboard/org/edit"
            className="inline-flex items-center gap-1.5 border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4" /> Modifica
          </Link>
        )}
      </div>

      {orgData ? (
        <div className="border border-slate-200 bg-white shadow-sm">
          {/* Intestazione org */}
          <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50 p-6">
            <div className="flex h-14 w-14 items-center justify-center border border-blue-100 bg-white text-2xl font-bold text-blue-600">
              {(orgData.name || "O").charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{orgData.name || "Azienda senza nome"}</h2>
              <p className="text-sm text-slate-500">
                Creata il {new Date(orgData.created_at).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 p-6">
            {/* Dati Aziendali */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Dati Aziendali</h3>
              </div>
              <div className="space-y-4">
                <Field label="Denominazione / Ragione Sociale" value={orgSettings?.company_name || orgData.name} />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Partita IVA" value={orgSettings?.vat} mono />
                  <Field label="Cod. Fiscale" value={orgSettings?.tax_code} mono />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Regime Fiscale" value={orgSettings?.regime_fiscale} />
                  <Field label="Prefisso Fattura" value={orgSettings?.invoice_prefix} />
                </div>
              </div>
            </div>

            {/* Sede e Contatti */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Sede e Contatti</h3>
              </div>
              <div className="space-y-4">
                <Field label="Indirizzo Sede Legale" value={formatAddress(orgSettings?.address)} />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Telefono</label>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />{orgSettings?.phone || "—"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Email</label>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900 truncate">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />{orgSettings?.email || "—"}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="PEC" value={orgSettings?.pec} />
                  <Field label="Sito Web" value={orgSettings?.website} />
                </div>
              </div>
            </div>

            {/* Dati Bancari */}
            <div className="md:col-span-2 border-t border-slate-100 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Dati Bancari</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
                <Field label="IBAN" value={orgSettings?.iban} mono />
                <Field label="Banca Appoggio" value={orgSettings?.bank_name} />
                <Field label="BIC / SWIFT" value={orgSettings?.bic} mono />
                <Field label="Intestatario conto" value={orgSettings?.bank_holder || orgSettings?.company_name} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border border-slate-200 bg-slate-50">
            <Building2 className="h-7 w-7 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Nessuna organizzazione</h3>
          <p className="text-sm text-slate-500">Non fai ancora parte di nessuna organizzazione.</p>
        </div>
      )}
    </div>
  );
}
