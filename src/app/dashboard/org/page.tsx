"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Contenuto, DueColonne, Riga, Testata } from "../_ui/cornice";

/**
 * Scheda dell'azienda: i dati che finiscono su documenti, fatture e
 * trasmissioni. Si leggono qui e si cambiano in "Modifica i dati".
 */

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
        <Testata titolo="Organizzazione" />
        <Contenuto>
          <p className="rm-muted">Caricamento dei dati dell&apos;organizzazione.</p>
        </Contenuto>
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

  if (!orgData) {
    return (
      <>
        <Testata titolo="Organizzazione" />
        <Contenuto>
          <div className="rm-card">
            <h2 style={{ fontSize: 14 }}>Nessuna organizzazione</h2>
            <p className="rm-muted" style={{ marginTop: 8 }}>
              L&apos;utenza non risulta collegata a nessuna organizzazione.
            </p>
          </div>
        </Contenuto>
      </>
    );
  }

  const denominazione = orgSettings?.company_name || orgData.name || "Azienda senza nome";

  return (
    <>
      <Testata
        titolo="Organizzazione"
        sotto={denominazione}
        azioni={
          <Link href="/dashboard/org/edit" className="rm-btn rm-btn--primary" style={{ gap: 14 }}>
            <span>Modifica i dati</span>
            <Pencil size={15} />
          </Link>
        }
      />

      <Contenuto>
        <DueColonne
          principale={
            <section className="rm-card">
              <div className="rm-cardhead">
                <h2 style={{ fontSize: 14 }}>Dati aziendali</h2>
              </div>
              <div className="rm-righe">
                <Riga etichetta="Denominazione" valore={denominazione} />
                <Riga etichetta="Partita IVA" valore={partitaIva(orgSettings?.vat || orgData.vat) || "—"} mono />
                <Riga etichetta="Codice fiscale" valore={orgSettings?.tax_code || orgData.tax_code || "—"} mono />
                <Riga etichetta="Forma giuridica" valore={orgSettings?.forma_giuridica || "—"} />
                <Riga etichetta="Codice ATECO" valore={orgSettings?.codice_ateco || "—"} mono />
                <Riga
                  etichetta="Codice destinatario SDI"
                  valore={orgSettings?.codice_destinatario || "—"}
                  mono
                />
              </div>
            </section>
          }
          laterale={
            <>
              <section className="rm-card">
                <div className="rm-cardhead">
                  <h2 style={{ fontSize: 14 }}>Sede e contatti</h2>
                </div>
                <div className="rm-righe">
                  <Riga etichetta="Sede legale" valore={formatAddress(orgSettings?.address) } />
                  <Riga etichetta="Telefono" valore={orgSettings?.phone || orgData.phone || "—"} />
                  <Riga etichetta="Email" valore={orgSettings?.email || orgData.email || "—"} />
                  <Riga etichetta="PEC" valore={orgSettings?.pec || "—"} />
                </div>
              </section>

              <section className="rm-card">
                <div className="rm-cardhead">
                  <h2 style={{ fontSize: 14 }}>Dati bancari</h2>
                </div>
                <div className="rm-righe">
                  <Riga etichetta="IBAN" valore={orgSettings?.iban || "—"} mono />
                  <Riga etichetta="Banca" valore={orgSettings?.bank_name || "—"} />
                </div>
              </section>
            </>
          }
        />
      </Contenuto>
    </>
  );
}
