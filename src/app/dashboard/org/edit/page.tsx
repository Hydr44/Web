"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { isValidPIVA, isValidPIVAorCF } from "@/lib/it-fiscal";
import Link from "next/link";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Contenuto, PiedeModulo, Sezione, TestataAzione } from "../../_ui/cornice";

/** Riga del modulo: etichetta a sinistra, campo a destra. */
function Campo({
  campo,
  etichetta,
  obbligatorio,
  children,
}: Readonly<{ campo: string; etichetta: string; obbligatorio?: boolean; children: ReactNode }>) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(120px, 170px) minmax(0, 1fr)",
        alignItems: "center",
        gap: 12,
        padding: "8px 16px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <label className="rm-label" htmlFor={campo} style={{ textAlign: "right" }}>
        {etichetta}
        {obbligatorio && <span aria-hidden> *</span>}
      </label>
      <div style={{ minWidth: 0 }}>{children}</div>
    </div>
  );
}

export default function EditOrgPage() {
  usePageTitle("Modifica l'organizzazione");
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
              // In archivio la partita IVA sta senza prefisso: a schermo
              // l'IT lo mette la cornice del campo.
              vat: String(org.vat || "").replace(/\D/g, "").slice(0, 11),
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

    // Validazione P.IVA / Codice Fiscale lato client (algoritmo AdE/MEF)
    const vat = formData.vat.trim();
    if (vat && !isValidPIVA(vat)) {
      setError("Partita IVA non valida: servono undici cifre con controllo corretto.");
      setSaving(false);
      return;
    }
    const cf = formData.tax_code.trim();
    if (cf && !isValidPIVAorCF(cf)) {
      setError("Codice fiscale non valido: sedici caratteri per la persona fisica, undici cifre per l'azienda.");
      setSaving(false);
      return;
    }
    // Identificativo fiscale: partita IVA e codice fiscale sono un requisito
    // solo, ne basta uno dei due.
    if (!vat && !cf) {
      setError("Indicare la partita IVA oppure il codice fiscale.");
      setSaving(false);
      return;
    }

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
      <>
        <TestataAzione indietro="/dashboard/org" occhiello="Organizzazione" titolo="Modifica i dati" />
        <Contenuto>
          <p className="rm-muted">Caricamento dei dati dell&apos;organizzazione.</p>
        </Contenuto>
      </>
    );
  }

  if (success) {
    return (
      <>
        <TestataAzione indietro="/dashboard/org" occhiello="Organizzazione" titolo="Modifica i dati" />
        <Contenuto>
          <div className="rm-card">
            <h2 style={{ fontSize: 14 }}>Dati aggiornati</h2>
            <p className="rm-muted" style={{ marginTop: 8 }}>
              Le modifiche sono state registrate. Ritorno alla scheda
              dell&apos;organizzazione in corso.
            </p>
            <p style={{ marginTop: 14 }}>
              <Link href="/dashboard/org">Vai subito alla scheda</Link>
            </p>
          </div>
        </Contenuto>
      </>
    );
  }

  if (!orgData) {
    return (
      <>
        <TestataAzione indietro="/dashboard/org" occhiello="Organizzazione" titolo="Modifica i dati" />
        <Contenuto>
          <div className="rm-note rm-note--errore">
            Non è stato possibile caricare i dati dell&apos;organizzazione.
          </div>
        </Contenuto>
      </>
    );
  }

  const azioni = (
    <>
      <Link href="/dashboard/org" className="rm-btn rm-btn--secondary">
        <span>Annulla</span>
      </Link>
      <button type="submit" form="modulo-org" disabled={saving} className="rm-btn rm-btn--primary">
        <span>{saving ? "Salvataggio in corso" : "Salva"}</span>
      </button>
    </>
  );

  return (
    <>
      <TestataAzione
        indietro="/dashboard/org"
        occhiello="Organizzazione"
        titolo="Modifica i dati"
        sotto="Compaiono su documenti, fatture e trasmissioni"
        azioni={azioni}
      />

      <Contenuto>
        {error && <div className="rm-note rm-note--errore" style={{ marginBottom: 16 }}>{error}</div>}

        <form id="modulo-org" onSubmit={handleSubmit}>
          <Sezione titolo="Denominazione">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <Campo campo="name" etichetta="Ragione sociale" obbligatorio>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="rm-input"
                  required
                  disabled={saving}
                />
              </Campo>
              <Campo campo="description" etichetta="Attivita' svolta">
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="rm-input"
                  disabled={saving}
                />
              </Campo>
            </div>
          </Sezione>

          <Sezione titolo="Sede e contatti">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <Campo campo="address" etichetta="Indirizzo della sede">
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="rm-input"
                  disabled={saving}
                />
              </Campo>
              <Campo campo="phone" etichetta="Telefono">
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="rm-input"
                  disabled={saving}
                />
              </Campo>
              <Campo campo="email" etichetta="Email">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="rm-input"
                  disabled={saving}
                />
              </Campo>
              <Campo campo="website" etichetta="Sito internet">
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="rm-input"
                  disabled={saving}
                />
              </Campo>
            </div>
          </Sezione>

          <Sezione titolo="Identificativo fiscale">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <Campo campo="vat" etichetta="Partita IVA">
                <div className="rm-prefix">
                  <span>IT</span>
                  <input
                    type="text"
                    id="vat"
                    name="vat"
                    value={formData.vat}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        vat: e.target.value.replace(/\D/g, "").slice(0, 11),
                      }))
                    }
                    className="rm-input rm-mono"
                    disabled={saving}
                    inputMode="numeric"
                    pattern="\d{11}"
                    maxLength={11}
                    placeholder="12345678901"
                    title="Partita IVA italiana, undici cifre"
                  />
                </div>
              </Campo>
              <Campo campo="tax_code" etichetta="Codice fiscale">
                <input
                  type="text"
                  id="tax_code"
                  name="tax_code"
                  value={formData.tax_code}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      tax_code: e.target.value.toUpperCase().replace(/\s/g, ""),
                    }))
                  }
                  className="rm-input rm-mono uppercase"
                  disabled={saving}
                  maxLength={16}
                  placeholder="RSSMRA80A01H501U"
                  title="Codice fiscale della persona fisica (sedici caratteri) o dell'azienda (undici cifre)"
                />
              </Campo>
            </div>
            <p className="rm-muted" style={{ padding: "10px 16px", textAlign: "center" }}>
              Ne basta uno dei due: partita IVA oppure codice fiscale.
            </p>
          </Sezione>
        </form>

        <PiedeModulo note="* obbligatori" azioni={azioni} />
      </Contenuto>
    </>
  );
}
