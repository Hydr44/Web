"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  Database,
  Shield,
  Download,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  User,
  Settings,
  ArrowRight,
} from "lucide-react";

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

  // Export e cancellazione passano dal canale supporto: la richiesta diventa un
  // ticket reale (il team viene avvisato via email) e viene gestita entro i
  // termini di legge. Niente finti "riceverai un'email" senza nulla dietro.
  const openGdprRequest = async (kind: "export" | "delete") => {
    if (kind === "delete" && !confirm("Vuoi inviare al nostro team la richiesta di cancellazione dell'account e dei dati associati?")) return;
    setActionError(null);
    setActionWorking(kind);
    try {
      const payload = kind === "export"
        ? {
            subject: "Richiesta export dati personali (GDPR art. 20)",
            category: "domanda",
            message: "Richiedo una copia dei miei dati personali in formato leggibile (portabilità dei dati, art. 20 GDPR).",
          }
        : {
            subject: "Richiesta cancellazione account (GDPR art. 17)",
            category: "domanda",
            message: "Richiedo la cancellazione del mio account e di tutti i dati associati (diritto all'oblio, art. 17 GDPR).",
          };
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      <div className="space-y-6 max-w-2xl">
        <div className="w-48 h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-white border border-gray-100 rounded-lg p-6 space-y-4">
          <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
          <div className="w-full h-10 bg-gray-50 rounded animate-pulse" />
          <div className="w-32 h-4 bg-gray-200 rounded animate-pulse mt-4" />
          <div className="w-full h-10 bg-gray-50 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const legalDocs = [
    { href: "/privacy-policy", icon: FileText, title: "Informativa Privacy", sub: "Come trattiamo i tuoi dati" },
    { href: "/cookie-policy", icon: Settings, title: "Cookie Policy", sub: "Cookie e tecnologie simili" },
    { href: "/terms-of-use", icon: Shield, title: "Termini di Servizio", sub: "Condizioni d'uso del servizio" },
    { href: "/dpa", icon: Database, title: "Accordo Trattamento Dati (DPA)", sub: "Art. 28 GDPR — Responsabile" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
          <Database className="h-3.5 w-3.5" />
          Centro privacy
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">Privacy &amp; dati</h1>
        <p className="text-sm text-gray-500 mt-1 max-w-2xl">
          Consulta i documenti, vedi i tuoi dati ed esercita i tuoi diritti GDPR.
        </p>
      </header>

      {actionError && (
        <div className="p-4 rounded bg-red-50 border border-red-200 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          <span className="text-red-800 text-sm">{actionError}</span>
        </div>
      )}

      {/* I tuoi dati (reale) */}
      <div className="p-5 bg-white border border-gray-200 rounded">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded bg-gray-100 flex items-center justify-center">
            <User className="h-4 w-4 text-gray-700" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">I tuoi dati</h2>
            <p className="text-xs text-gray-500">Informazioni associate al tuo account</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-700">
            <User className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="truncate">{userData?.full_name || "Nome non impostato"}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Database className="h-4 w-4 text-gray-400 shrink-0" />
            <span>Organizzazione: {userData?.current_org ? "presente" : "nessuna"}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Clock className="h-4 w-4 text-gray-400 shrink-0" />
            <span>
              Account dal{" "}
              {userData?.created_at
                ? new Date(userData.created_at).toLocaleDateString("it-IT")
                : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Esercita i tuoi diritti */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Esercita i tuoi diritti GDPR</h2>
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Export */}
          <div className="p-5 bg-white border border-gray-200 rounded flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded bg-blue-50 flex items-center justify-center">
                <Download className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Esporta i tuoi dati</h3>
                <p className="text-xs text-gray-500">Portabilità — art. 20 GDPR</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-4 flex-1">
              Invii al nostro team una richiesta per ricevere una copia dei tuoi dati personali. La
              richiesta viene tracciata come ticket e gestita entro 30 giorni.
            </p>
            <button
              onClick={() => openGdprRequest("export")}
              disabled={actionWorking !== null}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              {actionWorking === "export" ? "Invio…" : "Richiedi i miei dati"}
            </button>
          </div>

          {/* Delete */}
          <div className="p-5 bg-white border border-gray-200 rounded flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded bg-red-50 flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Elimina l'account</h3>
                <p className="text-xs text-gray-500">Diritto all'oblio — art. 17 GDPR</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-4 flex-1">
              Invii una richiesta di cancellazione dell'account e dei dati associati. Il team la
              verifica (es. obblighi fiscali sui documenti) e procede secondo legge.
            </p>
            <button
              onClick={() => openGdprRequest("delete")}
              disabled={actionWorking !== null}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-red-200 text-red-700 rounded hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              {actionWorking === "delete" ? "Invio…" : "Richiedi cancellazione"}
            </button>
          </div>
        </div>
      </div>

      {/* Documenti legali (reali, linkabili) */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Documenti legali</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {legalDocs.map((d) => (
            <Link
              key={d.href}
              href={d.href}
              className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded hover:border-gray-300 transition-colors group"
            >
              <div className="w-9 h-9 rounded bg-gray-100 flex items-center justify-center shrink-0">
                <d.icon className="h-4 w-4 text-gray-700" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-900">{d.title}</div>
                <div className="text-xs text-gray-500">{d.sub}</div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-700 transition-colors shrink-0" />
            </Link>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
          Le preferenze cookie si gestiscono dal banner mostrato all'accesso al sito.
        </p>
      </div>
    </div>
  );
}
