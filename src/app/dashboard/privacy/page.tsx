"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import { usePageTitle } from "@/hooks/usePageTitle";

type Profile = {
  full_name?: string | null;
  current_org?: string | null;
  created_at?: string | null;
};

export default function PrivacyPage() {
  usePageTitle("Privacy");
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<Profile | null>(null);
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
        if (profile) setUserData(profile as Profile);
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
    if (!confirm("Inviare la richiesta di cancellazione dell'utenza e dei dati collegati?")) return;
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
        <div className="rm-area__intesta">
          <h1>Privacy e dati</h1>
        </div>
        <div className="rm-card">
          <p className="rm-muted">Caricamento in corso.</p>
        </div>
      </>
    );
  }

  const legalDocs = [
    { href: "/privacy-policy", title: "Informativa sulla privacy", sub: "Come trattiamo i dati" },
    { href: "/cookie-policy", title: "Informativa sui cookie", sub: "Cookie e strumenti simili" },
    { href: "/terms-of-use", title: "Condizioni del servizio", sub: "Regole d'uso del servizio" },
    { href: "/dpa", title: "Accordo sul trattamento dei dati", sub: "Nomina a responsabile del trattamento" },
  ];

  return (
    <>
      <div className="rm-area__intesta">
        <div>
          <p className="rm-eyebrow">Privacy</p>
          <h1 style={{ marginTop: 8 }}>Privacy e dati</h1>
          <p className="rm-muted" style={{ marginTop: 6 }}>
            Documenti, dati collegati all&apos;utenza e richieste previste dalla
            normativa.
          </p>
        </div>
      </div>

      {actionError && <div className="rm-note rm-note--errore">{actionError}</div>}
      {actionSuccess && <div className="rm-note rm-note--info">{actionSuccess}</div>}

      <div className="rm-card">
        <div className="rm-cardhead">
          <h3>Dati collegati all&apos;utenza</h3>
        </div>
        <div className="rm-righe">
          <div className="rm-riga">
            <span>Intestatario</span>
            <span>{userData?.full_name || "Nome non indicato"}</span>
          </div>
          <div className="rm-riga">
            <span>Organizzazione</span>
            <span>{userData?.current_org ? "Collegata" : "Nessuna"}</span>
          </div>
          <div className="rm-riga">
            <span>Utenza attiva dal</span>
            <span>
              {userData?.created_at
                ? new Date(userData.created_at).toLocaleDateString("it-IT")
                : "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="rm-card">
        <div className="rm-cardhead">
          <h3>Copia dei dati</h3>
        </div>
        <p className="rm-muted">
          Scarica una copia dei dati personali legati a questa utenza. I dati di
          lavoro dell&apos;azienda si esportano dal programma sulla postazione.
        </p>
        <p style={{ marginTop: 16 }}>
          <button
            onClick={downloadExport}
            disabled={actionWorking !== null}
            className="rm-btn rm-btn--primary"
          >
            <span>
              {actionWorking === "export" ? "Preparazione in corso" : "Scarica la copia"}
            </span>
          </button>
        </p>
      </div>

      <div className="rm-card">
        <div className="rm-cardhead">
          <h3>Cancellazione dell&apos;utenza</h3>
        </div>
        <p className="rm-muted">
          La richiesta viene presa in carico dall&apos;assistenza, che verifica
          prima gli obblighi di conservazione, per esempio quelli fiscali sui
          documenti, e poi procede.
        </p>
        <p style={{ marginTop: 16 }}>
          <button
            onClick={requestDeletion}
            disabled={actionWorking !== null}
            className="rm-btn rm-btn--danger"
          >
            <span>
              {actionWorking === "delete" ? "Invio in corso" : "Richiedi la cancellazione"}
            </span>
          </button>
        </p>
      </div>

      <div className="rm-card">
        <div className="rm-cardhead">
          <h3>Documenti</h3>
        </div>
        <div className="rm-righe">
          {legalDocs.map((d) => (
            <div key={d.href} className="rm-riga">
              <span>{d.sub}</span>
              <span>
                <Link href={d.href}>{d.title}</Link>
              </span>
            </div>
          ))}
        </div>
        <p className="rm-muted" style={{ marginTop: 14 }}>
          Le preferenze sui cookie si cambiano dal riquadro mostrato
          all&apos;ingresso nel sito.
        </p>
      </div>
    </>
  );
}
