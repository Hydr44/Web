"use client";

import { useEffect, useMemo, useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  Monitor,
  Apple,
  Smartphone,
  Download as DownloadIcon,
  Loader2,
  RefreshCw,
  CheckCircle,
  Info,
  ArrowDownToLine,
  Tablet,
} from "lucide-react";

/**
 * Pagina download privata (dashboard) — autenticati only.
 *
 * Riusa l'API pubblica `/api/app-release/latest` che l'admin-panel
 * "alimenta" pubblicando in R2 una nuova versione dell'installer desktop.
 * Una volta installata l'app desktop si auto-aggiorna in background; questa
 * pagina serve per il PRIMO scaricamento (es. da un nuovo PC) oppure per
 * forzare il download manuale dell'ultima versione.
 *
 * Mobile: link diretti agli store (App Store / Play Store).
 */

type Rel = {
  version?: string;
  filename?: string;
  size?: number;
  releaseDate?: string;
  url: string;
};
type Platform = "win" | "mac" | "linux";
type Arch = "arm64" | "x64";
type ReleasesByArch = Record<Platform, Partial<Record<Arch, Rel>>>;

// Configurare quando le app saranno pubblicate sugli store
const APP_STORE_URL = process.env.NEXT_PUBLIC_IOS_APP_URL || "";
const PLAY_STORE_URL = process.env.NEXT_PUBLIC_ANDROID_APP_URL || "";

function fmtSize(b?: number) {
  if (!b) return "";
  return b > 1e9 ? `${(b / 1e9).toFixed(1)} GB` : `${Math.round(b / 1e6)} MB`;
}

function fmtDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function detectOs(): Platform | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent.toLowerCase();
  if (/win/.test(ua)) return "win";
  if (/mac/.test(ua)) return "mac";
  if (/linux/.test(ua)) return "linux";
  return null;
}

function detectArch(): Arch | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent.toLowerCase();
  if (/arm64|aarch64/.test(ua)) return "arm64";
  if (/intel|x86_64|x64|wow64|win64/.test(ua)) return "x64";
  return null;
}

export default function DashboardDownloadPage() {
  usePageTitle("Download");
  const [byArch, setByArch] = useState<ReleasesByArch | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userOs = useMemo(detectOs, []);
  const userArch = useMemo(detectArch, []);

  const fetchReleases = async () => {
    setError(null);
    try {
      const r = await fetch("/api/app-release/latest", { cache: "no-store" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(d?.error || "Errore caricamento release");
        return;
      }
      setByArch((d?.releasesByArch as ReleasesByArch) || null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Errore di rete");
    }
  };

  useEffect(() => {
    (async () => {
      await fetchReleases();
      setLoading(false);
    })();
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await fetchReleases();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="w-48 h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid md:grid-cols-3 gap-4">
          <div className="h-48 bg-white border border-gray-100 rounded animate-pulse" />
          <div className="h-48 bg-white border border-gray-100 rounded animate-pulse" />
          <div className="h-48 bg-white border border-gray-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const ArchButton = ({ rel, label, primary }: { rel: Rel; label: string; primary: boolean }) => (
    <a
      href={rel.url}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors ${
        primary
          ? "bg-blue-600 text-white hover:bg-blue-700"
          : "border border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
      }`}
    >
      <DownloadIcon className="h-4 w-4" />
      <span className="truncate">{label}{rel.version ? ` · v${rel.version}` : ""}</span>
    </a>
  );

  const OsCard = ({
    os,
    icon,
    title,
    sub,
  }: {
    os: Platform;
    icon: React.ReactNode;
    title: string;
    sub: string;
  }) => {
    const archs = (byArch?.[os] || {}) as Partial<Record<Arch, Rel>>;
    const isPrimary = userOs === os;
    const hasAny = !!(archs.arm64 || archs.x64);
    // Su Mac decidiamo l'arch consigliata: userArch se nota, altrimenti arm64 default
    const macRecommendedArch: Arch = userArch || "arm64";
    // Singolo Rel per il footer info (preferisce arch consigliata)
    const primaryRel = archs[userArch || (os === "mac" ? "arm64" : "x64") as Arch] || archs.x64 || archs.arm64;

    return (
      <div
        className={`p-6 bg-white border rounded flex flex-col gap-3 ${
          isPrimary ? "border-blue-300 ring-1 ring-blue-100" : "border-gray-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded flex items-center justify-center ${
              isPrimary ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-700"
            }`}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold text-gray-900">{title}</h2>
              {isPrimary && (
                <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                  Il tuo sistema
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">{sub}</p>
          </div>
        </div>

        {!hasAny ? (
          <div className="text-sm text-gray-400 py-2">Non ancora disponibile</div>
        ) : os === "mac" ? (
          <div className="flex flex-col gap-2">
            {archs.arm64 && (
              <ArchButton
                rel={archs.arm64}
                label="Apple Silicon (M1/M2/M3)"
                primary={isPrimary && macRecommendedArch === "arm64"}
              />
            )}
            {archs.x64 && (
              <ArchButton
                rel={archs.x64}
                label="Intel"
                primary={isPrimary && macRecommendedArch === "x64"}
              />
            )}
            {primaryRel && (
              <div className="text-[11px] text-gray-400 space-y-0.5 mt-1">
                {primaryRel.filename && <div className="font-mono truncate" title={primaryRel.filename}>{primaryRel.filename}</div>}
                <div className="flex items-center gap-2">
                  {primaryRel.size ? <span>{fmtSize(primaryRel.size)}</span> : null}
                  {primaryRel.releaseDate ? <span>· {fmtDate(primaryRel.releaseDate)}</span> : null}
                </div>
              </div>
            )}
          </div>
        ) : (
          // win + linux: solo x64
          primaryRel && (
            <>
              <ArchButton rel={primaryRel} label="Scarica" primary={isPrimary} />
              <div className="text-[11px] text-gray-400 space-y-0.5">
                {primaryRel.filename && <div className="font-mono truncate" title={primaryRel.filename}>{primaryRel.filename}</div>}
                <div className="flex items-center gap-2">
                  {primaryRel.size ? <span>{fmtSize(primaryRel.size)}</span> : null}
                  {primaryRel.releaseDate ? <span>· {fmtDate(primaryRel.releaseDate)}</span> : null}
                </div>
              </div>
            </>
          )
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
            <ArrowDownToLine className="h-3.5 w-3.5" />
            Download applicazioni
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Scarica RescueManager</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Installa l&apos;app desktop. Gli aggiornamenti successivi arrivano
            automaticamente in-app: scarica manualmente solo per il primo setup
            o su un nuovo dispositivo.
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Aggiorna
        </button>
      </header>

      {error && (
        <div className="p-4 rounded bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-3">
          <Info className="h-5 w-5 text-red-600" />
          {error}
        </div>
      )}

      {/* Desktop */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Monitor className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl font-semibold text-gray-900">Desktop</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <OsCard
            os="win"
            icon={<Monitor className="h-5 w-5" />}
            title="Windows"
            sub="Windows 10 / 11 · installer .exe"
          />
          <OsCard
            os="mac"
            icon={<Apple className="h-5 w-5" />}
            title="macOS"
            sub="Apple Silicon / Intel · .dmg"
          />
          <OsCard
            os="linux"
            icon={<Monitor className="h-5 w-5" />}
            title="Linux"
            sub="AppImage / .deb"
          />
        </div>

        <div className="mt-4 p-4 rounded bg-blue-50 border border-blue-200 flex items-start gap-3">
          <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-900">
            <p className="font-medium">Auto-update</p>
            <p className="mt-0.5 text-blue-800">
              Dopo l&apos;installazione l&apos;app desktop verifica e installa
              automaticamente le nuove versioni — non serve tornare qui.
            </p>
          </div>
        </div>

        <div className="mt-3 p-4 rounded bg-amber-50 border border-amber-200 text-sm text-amber-900">
          <strong>macOS Apple Silicon vs Intel:</strong> i Mac con chip M1/M2/M3
          usano la versione &quot;Apple Silicon&quot;. I Mac del 2019 e precedenti
          (e Mac Pro 2019) usano &quot;Intel&quot;. In dubbio: menu Apple →
          <em>Informazioni su questo Mac</em> → riga &quot;Chip&quot; o &quot;Processore&quot;.
        </div>
      </section>

      {/* Mobile */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl font-semibold text-gray-900">Mobile</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-white border border-gray-200 rounded flex items-start gap-4">
            <div className="w-10 h-10 rounded bg-gray-50 flex items-center justify-center shrink-0">
              <Apple className="h-5 w-5 text-gray-900" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900">iOS (iPhone / iPad)</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                App Store — versione in pubblicazione.
              </p>
              {APP_STORE_URL ? (
                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
                >
                  <DownloadIcon className="h-4 w-4" />
                  Apri App Store
                </a>
              ) : (
                <span className="mt-3 inline-block text-xs text-gray-400">
                  Prossimamente su App Store
                </span>
              )}
            </div>
          </div>

          <div className="p-6 bg-white border border-gray-200 rounded flex items-start gap-4">
            <div className="w-10 h-10 rounded bg-gray-50 flex items-center justify-center shrink-0">
              <Tablet className="h-5 w-5 text-gray-900" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900">Android</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Google Play — versione in pubblicazione.
              </p>
              {PLAY_STORE_URL ? (
                <a
                  href={PLAY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
                >
                  <DownloadIcon className="h-4 w-4" />
                  Apri Google Play
                </a>
              ) : (
                <span className="mt-3 inline-block text-xs text-gray-400">
                  Prossimamente su Google Play
                </span>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
