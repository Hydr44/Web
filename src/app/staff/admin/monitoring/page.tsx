"use client";

import { useState, useEffect, useCallback } from "react";
import {
  HeartPulse,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Server,
  FileText,
  Trash2,
  Car,
  Shield,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronRight,
  Zap,
  Inbox,
  Send,
  Hash,
  ArrowUpRight,
  Package,
} from "lucide-react";

// ─── Types ───

interface ServiceResult {
  name: string;
  module: string;
  description: string;
  status: "online" | "offline" | "degraded" | "timeout";
  httpStatus: number | null;
  latency: number;
  data: Record<string, unknown> | null;
  error: string | null;
  checkedAt: string;
}

interface MonitoringData {
  summary: {
    total: number;
    online: number;
    offline: number;
    degraded: number;
  };
  modules: {
    sdi: ServiceResult[];
    rentri: ServiceResult[];
    rvfu: ServiceResult[];
    infra: ServiceResult[];
  };
  checkedAt: string;
}

interface SftpStatus {
  test_mode: boolean;
  files_pending: number;
  files_eo: number;
  files_er: number;
  files_fo: number;
  latest_eo: { filename: string; generated_at: string } | null;
  latest_er: { filename: string; error_description: string; generated_at: string } | null;
}

interface FatturaRecord {
  id: string;
  number: string;
  date: string;
  total: number;
  customer_name: string;
  sdi_status: string;
  created_at: string;
}

interface FirRecord {
  id: string;
  numero_fir: string;
  rentri_numero: string | null;
  stato: string;
  rentri_stato: string | null;
  org_id: string;
  environment: string;
  created_at: string;
}

interface DetailsData {
  sdi: {
    sftp_status: SftpStatus | null;
    fatture: {
      ultime_fatture: FatturaRecord[];
      stats: {
        totale: number;
        inviate_24h: number;
        errori_sdi_24h: number;
      };
    } | null;
  };
  rentri: {
    fir: {
      ultimo_fir: FirRecord | null;
      ultimi_fir: FirRecord[];
      stats: {
        totale: number;
        trasmessi_24h: number;
        errori_24h: number;
      };
    } | null;
  };
}

// ─── Module config ───

const MODULE_CONFIG = {
  sdi: {
    label: "SDI — Fatturazione Elettronica",
    icon: FileText,
    color: "blue",
    description: "Server SFTP, invio/ricezione fatture, esiti SDI",
  },
  rentri: {
    label: "RENTRI — Registro Rifiuti",
    icon: Trash2,
    color: "emerald",
    description: "API registri, formulari FIR, polling, certificati",
  },
  rvfu: {
    label: "RVFU — Demolizioni Veicoli",
    icon: Car,
    color: "purple",
    description: "Proxy portale ACI demolizioni, sessioni VPN",
  },
  infra: {
    label: "Infrastruttura",
    icon: Shield,
    color: "slate",
    description: "OAuth proxy, servizi di supporto",
  },
} as const;

type ModuleKey = keyof typeof MODULE_CONFIG;

// ─── Status helpers ───

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "online":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "offline":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "timeout":
      return <Clock className="h-4 w-4 text-amber-500" />;
    case "degraded":
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-400" />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    online: { bg: "bg-green-50", text: "text-green-700", label: "Online" },
    offline: { bg: "bg-red-50", text: "text-red-700", label: "Offline" },
    timeout: { bg: "bg-amber-50", text: "text-amber-700", label: "Timeout" },
    degraded: { bg: "bg-amber-50", text: "text-amber-700", label: "Degradato" },
  };
  const c = styles[status] || styles.offline;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <StatusIcon status={status} />
      {c.label}
    </span>
  );
}

function LatencyBadge({ ms }: { ms: number }) {
  let color = "text-green-600";
  if (ms >= 2000) color = "text-red-600";
  else if (ms >= 500) color = "text-amber-600";
  return <span className={`text-xs font-mono ${color}`}>{ms}ms</span>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

// ─── Mini stat card (for detail sections) ───

function MiniStat({
  label,
  value,
  icon: Icon,
  color = "gray",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    gray: "bg-gray-50 text-gray-600",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="bg-white border border-gray-100 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <div className={`p-1 rounded ${colorMap[color]}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className="text-[11px] text-gray-500 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}

// ─── SDI Status Badge ───

function SdiStatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-xs text-gray-400">-</span>;
  const map: Record<string, { bg: string; text: string }> = {
    delivered: { bg: "bg-green-50", text: "text-green-700" },
    sent: { bg: "bg-blue-50", text: "text-blue-700" },
    error: { bg: "bg-red-50", text: "text-red-700" },
    pending: { bg: "bg-amber-50", text: "text-amber-700" },
  };
  const c = map[status] || { bg: "bg-gray-50", text: "text-gray-700" };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${c.bg} ${c.text}`}>
      {status}
    </span>
  );
}

// ─── FIR Status Badge ───

function FirStatoBadge({ stato }: { stato: string | null }) {
  if (!stato) return <span className="text-xs text-gray-400">-</span>;
  const map: Record<string, { bg: string; text: string }> = {
    trasmesso: { bg: "bg-blue-50", text: "text-blue-700" },
    accettato: { bg: "bg-green-50", text: "text-green-700" },
    rifiutato: { bg: "bg-red-50", text: "text-red-700" },
    bozza: { bg: "bg-gray-50", text: "text-gray-700" },
    pending: { bg: "bg-amber-50", text: "text-amber-700" },
  };
  const c = map[stato] || { bg: "bg-gray-50", text: "text-gray-700" };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${c.bg} ${c.text}`}>
      {stato}
    </span>
  );
}

// ─── Service Card ───

function ServiceCard({ service }: { service: ServiceResult }) {
  const [expanded, setExpanded] = useState(false);

  let borderClass = "border-amber-200 bg-amber-50/30";
  if (service.status === "online") borderClass = "border-green-200 bg-white";
  else if (service.status === "offline") borderClass = "border-red-200 bg-red-50/30";

  return (
    <div className={`border rounded-lg p-4 transition-all ${borderClass}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StatusIcon status={service.status} />
          <div>
            <p className="text-sm font-semibold text-gray-900">{service.name}</p>
            <p className="text-xs text-gray-500">{service.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LatencyBadge ms={service.latency} />
          <StatusBadge status={service.status} />
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-gray-600"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500">HTTP Status:</span>{" "}
              <span className="font-mono text-gray-900">{service.httpStatus ?? "N/A"}</span>
            </div>
            <div>
              <span className="text-gray-500">Ultimo check:</span>{" "}
              <span className="text-gray-900">
                {new Date(service.checkedAt).toLocaleTimeString("it-IT")}
              </span>
            </div>
            {service.error && (
              <div className="col-span-2">
                <span className="text-red-500">Errore:</span>{" "}
                <span className="font-mono text-red-700">{service.error}</span>
              </div>
            )}
            {service.data && (
              <div className="col-span-2">
                <span className="text-gray-500">Risposta:</span>
                <pre className="mt-1 p-2 bg-gray-50 rounded text-[10px] font-mono text-gray-700 overflow-x-auto max-h-32">
                  {JSON.stringify(service.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SDI Detail Panel ───

function SdiDetailPanel({ details }: { details: DetailsData["sdi"] }) {
  const sftp = details.sftp_status;
  const fatture = details.fatture;

  return (
    <div className="mt-4 pt-4 border-t border-blue-100 space-y-4">
      {/* SFTP File Status */}
      {sftp && (
        <div>
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5" /> Canale SFTP
            {sftp.test_mode && (
              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-medium ml-1">TEST</span>
            )}
          </h4>
          <div className="grid grid-cols-4 gap-2">
            <MiniStat label="In attesa (FI)" value={sftp.files_pending} icon={Send} color="blue" />
            <MiniStat label="Esiti (EO)" value={sftp.files_eo} icon={CheckCircle2} color="green" />
            <MiniStat label="Scarti (ER)" value={sftp.files_er} icon={XCircle} color="red" />
            <MiniStat label="Ricevute (FO)" value={sftp.files_fo} icon={Inbox} color="purple" />
          </div>
          {sftp.latest_er && (
            <div className="mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs">
              <span className="font-medium text-red-700">Ultimo scarto:</span>{" "}
              <span className="text-red-600">{sftp.latest_er.error_description}</span>
              <span className="text-red-400 ml-2">({sftp.latest_er.filename})</span>
              <span className="text-red-400 ml-2">{formatDate(sftp.latest_er.generated_at)}</span>
            </div>
          )}
        </div>
      )}

      {/* Fatture Stats */}
      {fatture && (
        <div>
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Fatture Elettroniche
          </h4>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <MiniStat label="Totale sistema" value={fatture.stats.totale} icon={Hash} color="gray" />
            <MiniStat label="Inviate 24h" value={fatture.stats.inviate_24h} icon={ArrowUpRight} color="blue" />
            <MiniStat label="Errori SDI 24h" value={fatture.stats.errori_sdi_24h} icon={XCircle} color="red" />
          </div>

          {/* Ultime fatture */}
          {fatture.ultime_fatture.length > 0 && (
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Numero</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Cliente</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500">Importo</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-500">SDI</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {fatture.ultime_fatture.map((f) => (
                    <tr key={f.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-1.5 px-3 font-mono text-gray-900">{f.number}</td>
                      <td className="py-1.5 px-3 text-gray-700 max-w-[140px] truncate">{f.customer_name}</td>
                      <td className="py-1.5 px-3 text-right font-mono text-gray-900">{formatCurrency(f.total)}</td>
                      <td className="py-1.5 px-3 text-center"><SdiStatusBadge status={f.sdi_status} /></td>
                      <td className="py-1.5 px-3 text-right text-gray-500">{formatDate(f.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── RENTRI Detail Panel ───

function RentriDetailPanel({ details }: { details: DetailsData["rentri"] }) {
  const fir = details.fir;
  if (!fir) return null;

  return (
    <div className="mt-4 pt-4 border-t border-emerald-100 space-y-4">
      <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <FileText className="h-3.5 w-3.5" /> Formulari FIR
      </h4>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <MiniStat label="Totale FIR" value={fir.stats.totale} icon={Hash} color="gray" />
        <MiniStat label="Trasmessi 24h" value={fir.stats.trasmessi_24h} icon={ArrowUpRight} color="emerald" />
        <MiniStat label="Rifiutati 24h" value={fir.stats.errori_24h} icon={XCircle} color="red" />
      </div>

      {/* Ultimi FIR */}
      {fir.ultimi_fir.length > 0 && (
        <div className="bg-gray-50 rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-medium text-gray-500">N. FIR</th>
                <th className="text-left py-2 px-3 font-medium text-gray-500">N. RENTRI</th>
                <th className="text-center py-2 px-3 font-medium text-gray-500">Stato</th>
                <th className="text-center py-2 px-3 font-medium text-gray-500">Ambiente</th>
                <th className="text-right py-2 px-3 font-medium text-gray-500">Data</th>
              </tr>
            </thead>
            <tbody>
              {fir.ultimi_fir.map((f) => (
                <tr key={f.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-1.5 px-3 font-mono text-gray-900">{f.numero_fir || "-"}</td>
                  <td className="py-1.5 px-3 font-mono text-gray-700">{f.rentri_numero || "-"}</td>
                  <td className="py-1.5 px-3 text-center"><FirStatoBadge stato={f.stato} /></td>
                  <td className="py-1.5 px-3 text-center">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      f.environment === "prod"
                        ? "bg-red-50 text-red-700"
                        : "bg-blue-50 text-blue-700"
                    }`}>
                      {f.environment}
                    </span>
                  </td>
                  <td className="py-1.5 px-3 text-right text-gray-500">{formatDate(f.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {fir.ultimi_fir.length === 0 && (
        <p className="text-xs text-gray-400 italic">Nessun FIR ancora nel sistema</p>
      )}
    </div>
  );
}

// ─── Module Section ───

function ModuleSection({
  moduleKey,
  services,
  details,
}: {
  moduleKey: ModuleKey;
  services: ServiceResult[];
  details: DetailsData | null;
}) {
  const config = MODULE_CONFIG[moduleKey];
  const Icon = config.icon;
  const allOnline = services.every((s) => s.status === "online");
  const anyOffline = services.some((s) => s.status === "offline");

  const colorMap: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600",
    emerald: "bg-emerald-100 text-emerald-600",
    purple: "bg-purple-100 text-purple-600",
    slate: "bg-slate-100 text-slate-600",
  };

  const borderMap: Record<string, string> = {
    blue: "border-blue-200",
    emerald: "border-emerald-200",
    purple: "border-purple-200",
    slate: "border-slate-200",
  };

  let statusLabel: React.ReactNode;
  if (allOnline) {
    statusLabel = (
      <span className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
        <Wifi className="h-3 w-3" /> Tutti operativi
      </span>
    );
  } else if (anyOffline) {
    statusLabel = (
      <span className="flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 px-2.5 py-1 rounded-full">
        <WifiOff className="h-3 w-3" /> Problemi rilevati
      </span>
    );
  } else {
    statusLabel = (
      <span className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
        <AlertTriangle className="h-3 w-3" /> Parzialmente operativo
      </span>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${borderMap[config.color]} overflow-hidden`}>
      {/* Module header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colorMap[config.color]}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">{config.label}</h3>
              <p className="text-xs text-gray-500">{config.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {statusLabel}
            <span className="text-xs text-gray-400">
              {services.filter((s) => s.status === "online").length}/{services.length}
            </span>
          </div>
        </div>
      </div>

      {/* Services list */}
      <div className="p-4 space-y-2">
        {services.map((service) => (
          <ServiceCard key={service.name} service={service} />
        ))}
      </div>

      {/* Detail panels */}
      {details && moduleKey === "sdi" && details.sdi && (
        <div className="px-4 pb-4">
          <SdiDetailPanel details={details.sdi} />
        </div>
      )}
      {details && moduleKey === "rentri" && details.rentri && (
        <div className="px-4 pb-4">
          <RentriDetailPanel details={details.rentri} />
        </div>
      )}
    </div>
  );
}

// ─── Overall status bar helper ───

function OverallStatusBar({ summary }: { summary: MonitoringData["summary"] }) {
  const allGood = summary.offline === 0 && summary.degraded === 0;
  const hasOffline = summary.offline > 0;

  let bgClass = "bg-amber-50 border border-amber-200";
  let iconClass = "text-amber-600";
  let textClass = "text-amber-800";
  let message = `${summary.degraded} servizi degradati su ${summary.total}`;

  if (allGood) {
    bgClass = "bg-green-50 border border-green-200";
    iconClass = "text-green-600";
    textClass = "text-green-800";
    message = `Tutti i ${summary.total} servizi sono operativi`;
  } else if (hasOffline) {
    bgClass = "bg-red-50 border border-red-200";
    iconClass = "text-red-600";
    textClass = "text-red-800";
    message = `${summary.offline} servizi offline su ${summary.total} — intervento richiesto`;
  }

  return (
    <div className={`mb-6 px-4 py-3 rounded-xl flex items-center gap-3 ${bgClass}`}>
      <Zap className={`h-5 w-5 ${iconClass}`} />
      <p className={`text-sm font-medium ${textClass}`}>{message}</p>
    </div>
  );
}

// ─── Main Page ───

export default function MonitoringPage() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [details, setDetails] = useState<DetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [healthRes, detailsRes] = await Promise.all([
        fetch("/api/staff/monitoring", { cache: "no-store" }),
        fetch("/api/staff/monitoring/details", { cache: "no-store" }),
      ]);

      if (healthRes.ok) {
        setData(await healthRes.json());
      }
      if (detailsRes.ok) {
        setDetails(await detailsRes.json());
      }
      setLastRefresh(new Date());
    } catch (error) {
      console.error("[MONITORING] Errore:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh ogni 30 secondi
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => loadData(), 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Controllo servizi in corso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <HeartPulse className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Monitoring Servizi</h1>
              <p className="text-sm text-gray-500">
                Stato in tempo reale dei servizi VPS (217.154.118.37)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastRefresh && (
              <span className="text-xs text-gray-400">
                Ultimo aggiornamento: {lastRefresh.toLocaleTimeString("it-IT")}
              </span>
            )}
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-blue-600"
              />
              Auto (30s)
            </label>
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Aggiorna
            </button>
          </div>
        </div>

        {/* Summary cards */}
        {data && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Totale Servizi</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{data.summary.total}</p>
                </div>
                <Server className="h-8 w-8 text-gray-300" />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-green-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-600 uppercase tracking-wide">Online</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">{data.summary.online}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-200" />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-red-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-red-600 uppercase tracking-wide">Offline</p>
                  <p className="text-2xl font-bold text-red-700 mt-1">{data.summary.offline}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-200" />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-amber-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-amber-600 uppercase tracking-wide">Degradati</p>
                  <p className="text-2xl font-bold text-amber-700 mt-1">{data.summary.degraded}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-amber-200" />
              </div>
            </div>
          </div>
        )}

        {/* Overall status bar */}
        {data && <OverallStatusBar summary={data.summary} />}

        {/* Module sections */}
        {data && (
          <div className="space-y-6">
            {(Object.keys(MODULE_CONFIG) as ModuleKey[]).map((key) => {
              const services = data.modules[key];
              if (!services || services.length === 0) return null;
              return (
                <ModuleSection
                  key={key}
                  moduleKey={key}
                  services={services}
                  details={details}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
