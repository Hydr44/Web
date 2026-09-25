"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import { Download } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Contenuto, DueColonne, Riga, Testata } from "../_ui/cornice";
import { useConferma } from "../_ui/conferma";

type Profile = {
  full_name?: string | null;
  current_org?: string | null;
  created_at?: string | null;
};

const DOCUMENTI = [
  { href: "/privacy-policy", title: "Informativa" },
  { href: "/cookie-policy", title: "Cookie" },
  { href: "/terms-of-use", title: "Termini" },
  { href: "/dpa", title: "DPA" },
];

export default function PrivacyPage() {
  usePageTitle("Privacy");
  const { chiedi, dialogo } = useConferma();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<Profile | null>(null);
  const [orgName, setOrgName] = useState<string>("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionWorking, setActionWorking] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = supabaseBrowser();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setLoading(false);
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, current_org, created_at")
          .eq("id", user.id)
          .single();
        if (profile) {
          setUserData(profile as Profile);
          if (profile.current_org) {
            const { data: org } = await supabase
              .from("orgs")
              .select("name")
              .eq("id", profile.current_org)
              .maybeSingle();
            if (org?.name) setOrgName(org.name as string);
          }
        }
      } catch {
        /* no-op */
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Export REALE: scarica un JSON con i dati personali dell'account (art. 15/20).
  const downloadExport = async () => {
    setActionError(null);
    setActionSuccess(null);
    setActionWorking("export");
    try {
      const res = await fetch("/api/user/export");
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || "Errore nella generazione dell'export");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "rescuemanager-dati-personali.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setActionSuccess("Scaricamento della copia dei dati avviato.");
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Errore nella generazione dell'export");
    } finally {
      setActionWorking(null);
    }
  };

  // Cancellazione: richiesta tracciata via supporto. Non immediata e automatica
  // perché il team verifica gli obblighi di conservazione (es. fiscali: le
  // fatture vanno conservate per legge) prima di procedere.
  const requestDeletion = async () => {
    const ok = await chiedi({
      titolo: "Chiedere la cancellazione",
      testo: "Chiediamo di cancellare la tua utenza e i dati collegati. La richiesta viene presa in carico e non si annulla da qui.",
      conferma: "Chiedi la cancellazione",
      annulla: "Lascia stare",
      pericolo: true,
    });
    if (!ok) return;
    setActionError(null);
    setActionSuccess(null);
    setActionWorking("delete");
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: "Richiesta cancellazione account (GDPR art. 17)",
          category: "domanda",
          message: "Richiedo la cancellazione del mio account e di tutti i dati associati (diritto all'oblio, art. 17 GDPR).",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore nell'invio della richiesta");
      if (data.ticket_id) {
        router.push(`/dashboard/support/${data.ticket_id}`);
        return;
      }
      router.push("/dashboard/support");
    } catch (error: unknown) {
      setActionError(error instanceof Error ? error.message : "Errore nell'invio della richiesta");
      setActionWorking(null);
    }
  };

  if (loading) {
    return (
      <>
        <Testata titolo="Privacy e dati" sotto="Cosa conserviamo e cosa puoi chiedere" />
        <Contenuto>
          <p className="rm-muted">Caricamento in corso.</p>
        </Contenuto>
      </>
    );
  }

  let organizzazione = "Nessuna";
  if (orgName) organizzazione = orgName;
  else if (userData?.current_org) organizzazione = "Collegata";

  return (
    <>
      <Testata titolo="Privacy e dati" sotto="Cosa conserviamo e cosa puoi chiedere" />

      <Contenuto>
        {actionError && <div className="rm-note rm-note--errore" style={{ marginBottom: 16 }}>{actionError}</div>}
        {actionSuccess && <div className="rm-note rm-note--info" style={{ marginBottom: 16 }}>{actionSuccess}</div>}

        <DueColonne
          principale={
            <section className="rm-card">
              <div className="rm-cardhead">
                <h2 style={{ fontSize: 14 }}>Dati collegati all&apos;utenza</h2>
              </div>
              <div className="rm-righe">
                <Riga etichetta="Intestatario" valore={userData?.full_name || "Nome non indicato"} />
                <Riga etichetta="Organizzazione" valore={organizzazione} />
                <Riga
                  etichetta="Utenza attiva dal"
                  valore={
                    userData?.created_at
                      ? new Date(userData.created_at).toLocaleDateString("it-IT", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "—"
                  }
                />
                <Riga
                  etichetta="Documenti"
                  valore={DOCUMENTI.map((d, i) => (
                    <span key={d.href}>
                      {i > 0 && ", "}
                      <Link href={d.href}>{d.title}</Link>
                    </span>
                  ))}
                />
              </div>
            </section>
          }
          laterale={
            <>
              <section className="rm-card">
                <div className="rm-cardhead">
                  <h2 style={{ fontSize: 14 }}>Copia dei dati</h2>
                </div>
                <p className="rm-muted">
                  Ricevi un archivio con i dati personali legati a questa utenza. I dati di
                  lavoro dell&apos;azienda si esportano dal programma sulla postazione.
                </p>
                <div style={{ marginTop: 14 }}>
                  <button
                    type="button"
                    onClick={downloadExport}
                    disabled={actionWorking !== null}
                    className="rm-btn rm-btn--tertiary"
                    style={{ gap: 14 }}
                  >
                    <span>
                      {actionWorking === "export" ? "Preparazione in corso" : "Richiedi la copia"}
                    </span>
                    <Download size={15} />
                  </button>
                </div>
              </section>

              <section className="rm-card">
                <div className="rm-cardhead">
                  <h2 style={{ fontSize: 14 }}>Cancellazione dell&apos;utenza</h2>
                </div>
                <p className="rm-muted">
                  Cancella la tua utenza. L&apos;organizzazione resta agli altri titolari; i
                  documenti fiscali restano per dieci anni come prevede la legge.
                </p>
                <div style={{ marginTop: 14 }}>
                  <button
                    type="button"
                    onClick={requestDeletion}
                    disabled={actionWorking !== null}
                    className="rm-btn rm-btn--danger"
                  >
                    <span>
                      {actionWorking === "delete" ? "Invio in corso" : "Chiedi la cancellazione"}
                    </span>
                  </button>
                </div>
              </section>
            </>
          }
        />
      </Contenuto>
      {dialogo}
    </>
  );
}
