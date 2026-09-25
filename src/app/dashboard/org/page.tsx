"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { usePageTitle } from "@/hooks/usePageTitle";

/** Riga etichetta e valore. Il valore mancante si scrive con un trattino. */
function Riga({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="rm-riga">
      <span>{label}</span>
      <span className={mono ? "rm-mono" : undefined}>{value || "—"}</span>
    </div>
  );
}

/** Partita IVA: in archivio stanno le undici cifre, a schermo si legge con IT davanti. */
function partitaIva(value?: string | null) {
  const cifre = String(value || "").replace(/\D/g, "");
  if (!cifre) return null;
  return `IT ${cifre}`;
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
      <>
        <div className="rm-area__intesta">
          <h1>Organizzazione</h1>
        </div>
        <div className="rm-card">
          <p className="rm-muted">Caricamento dei dati dell&apos;organizzazione.</p>
        </div>
      </>
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

  const codice = orgData
    ? orgData.number
      ? `ORG${String(orgData.number).padStart(4, "0")}`
      : `ORG${String(orgData.id).slice(0, 3).toUpperCase()}`
    : null;

  return (
    <>
      <div className="rm-area__intesta">
        <div>
          <h1>Organizzazione</h1>
          <p className="rm-muted" style={{ marginTop: 6 }}>
            Dati aziendali, fiscali e bancari usati su documenti e trasmissioni.
          </p>
        </div>
        {orgData && (
          <Link href="/dashboard/org/edit" className="rm-btn rm-btn--secondary">
            <span>Modifica i dati</span>
          </Link>
        )}
      </div>

      {orgData ? (
        <>
          <div className="rm-card">
            <div className="rm-cardhead">
              <h2>{orgSettings?.company_name || orgData.name || "Azienda senza nome"}</h2>
              {codice && <span className="rm-mono rm-muted">{codice}</span>}
            </div>
            <p className="rm-muted">
              Attiva dal{" "}
              {new Date(orgData.created_at).toLocaleDateString("it-IT", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="rm-card">
            <div className="rm-cardhead">
              <h3>Dati aziendali</h3>
            </div>
            <div className="rm-righe">
              <Riga label="Denominazione" value={orgSettings?.company_name || orgData.name} />
              <Riga label="Partita IVA" value={partitaIva(orgSettings?.vat)} mono />
              <Riga label="Codice fiscale" value={orgSettings?.tax_code} mono />
              <Riga label="Regime fiscale" value={orgSettings?.regime_fiscale} />
              <Riga label="Prefisso fattura" value={orgSettings?.invoice_prefix} />
            </div>
          </div>

          <div className="rm-card">
            <div className="rm-cardhead">
              <h3>Sede e contatti</h3>
            </div>
            <div className="rm-righe">
              <Riga label="Sede legale" value={formatAddress(orgSettings?.address)} />
              <Riga label="Telefono" value={orgSettings?.phone} />
              <Riga label="Email" value={orgSettings?.email} />
              <Riga label="PEC" value={orgSettings?.pec} />
              <Riga label="Sito internet" value={orgSettings?.website} />
            </div>
          </div>

          <div className="rm-card">
            <div className="rm-cardhead">
              <h3>Dati bancari</h3>
            </div>
            <div className="rm-righe">
              <Riga label="IBAN" value={orgSettings?.iban} mono />
              <Riga label="Banca d'appoggio" value={orgSettings?.bank_name} />
              <Riga label="BIC / SWIFT" value={orgSettings?.bic} mono />
              <Riga
                label="Intestatario del conto"
                value={orgSettings?.bank_holder || orgSettings?.company_name}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="rm-card">
          <h3>Nessuna organizzazione</h3>
          <p className="rm-muted" style={{ marginTop: 8 }}>
            L&apos;utenza non risulta collegata a nessuna organizzazione.
          </p>
        </div>
      )}
    </>
  );
}
