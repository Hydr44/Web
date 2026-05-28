"use client";
import { useEffect, useMemo, useState } from "react";
import { Apple, Monitor, Loader2, Download, Info } from "lucide-react";

type Rel = { version?: string; filename?: string; size?: number; releaseDate?: string; sha512?: string; url: string };
type Platform = "win" | "mac" | "linux";
type Arch = "arm64" | "x64";

type ReleasesByArch = Record<Platform, Partial<Record<Arch, Rel>>>;
type LegacyReleases = { win: Rel | null; mac: Rel | null; linux: Rel | null };

function fmtSize(b?: number) {
  if (!b) return "";
  return b > 1e9 ? `${(b / 1e9).toFixed(1)} GB` : `${Math.round(b / 1e6)} MB`;
}

/**
 * Rileva piattaforma + arch del client browser.
 * userAgentData è solo Chromium; fallback su userAgent string sniffing.
 */
type ClientHint = { platform: Platform | null; arch: Arch | null };
function detectClient(): ClientHint {
  if (typeof navigator === "undefined") return { platform: null, arch: null };
  const ua = navigator.userAgent;
  const uad = (navigator as unknown as { userAgentData?: { platform?: string; getHighEntropyValues?: (k: string[]) => Promise<unknown> } }).userAgentData;
  // Platform
  let platform: Platform | null = null;
  const platStr = (uad?.platform || ua).toLowerCase();
  if (platStr.includes("win")) platform = "win";
  else if (platStr.includes("mac") || /iphone|ipad|ipod/.test(platStr)) platform = "mac";
  else if (platStr.includes("linux") && !platStr.includes("android")) platform = "linux";
  // Arch
  let arch: Arch | null = null;
  if (/arm64|aarch64/.test(ua.toLowerCase())) arch = "arm64";
  else if (/intel|x86_64|x64|wow64|win64/.test(ua.toLowerCase())) arch = "x64";
  // Su Safari mac User-Agent non rivela arch: niente arch detect, l'utente sceglie.
  // Sui Mac Apple Silicon Safari ritorna "Intel Mac OS X" per compat → unreliable.
  return { platform, arch };
}

export default function DownloadPage() {
  const [byArch, setByArch] = useState<ReleasesByArch | null>(null);
  const [flat, setFlat] = useState<LegacyReleases | null>(null);
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<ClientHint>({ platform: null, arch: null });

  useEffect(() => {
    setClient(detectClient());
    fetch("/api/app-release/latest", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setByArch(d?.releasesByArch || null);
        setFlat(d?.releases || null);
      })
      .catch(() => { setByArch(null); setFlat(null); })
      .finally(() => setLoading(false));
  }, []);

  const recommended = useMemo<{ platform: Platform; arch: Arch; rel: Rel } | null>(() => {
    if (!byArch || !client.platform) return null;
    const p = client.platform;
    // Se conosciamo l'arch del client e abbiamo l'asset corrispondente
    if (client.arch && byArch[p]?.[client.arch]) {
      return { platform: p, arch: client.arch, rel: byArch[p][client.arch]! };
    }
    // Default: arm64 per mac, x64 per win/linux
    const def: Arch = p === "mac" ? "arm64" : "x64";
    if (byArch[p]?.[def]) return { platform: p, arch: def, rel: byArch[p][def]! };
    // Fallback all'altra arch
    const other: Arch = def === "arm64" ? "x64" : "arm64";
    if (byArch[p]?.[other]) return { platform: p, arch: other, rel: byArch[p][other]! };
    return null;
  }, [byArch, client]);

  const platformLabel = (p: Platform) => p === "win" ? "Windows" : p === "mac" ? "macOS" : "Linux";
  const archLabel = (a: Arch) => a === "arm64" ? "Apple Silicon" : "Intel";

  const DownloadBtn = ({ rel, label, primary }: { rel: Rel; label: string; primary?: boolean }) => (
    <a
      href={rel.url}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
        primary
          ? "bg-blue-600 text-white hover:bg-blue-700"
          : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      <Download className="h-4 w-4" />
      {label}
      {rel.size ? <span className={`text-xs ${primary ? "text-blue-100" : "text-gray-400"}`}>· {fmtSize(rel.size)}</span> : null}
    </a>
  );

  const PlatformCard = ({ platform, title, sub, icon }: { platform: Platform; title: string; sub: string; icon: React.ReactNode }) => {
    const archs = (byArch?.[platform] || {}) as Partial<Record<Arch, Rel>>;
    const hasAny = !!(archs.arm64 || archs.x64);
    const isRecommended = recommended?.platform === platform;

    return (
      <div className={`rounded-xl border bg-white p-6 flex flex-col items-center text-center gap-3 ${isRecommended ? "ring-2 ring-blue-500" : ""}`}>
        {isRecommended && (
          <div className="text-xs font-medium uppercase tracking-wide text-blue-600 -mb-1">
            Consigliato per il tuo computer
          </div>
        )}
        <div className="text-blue-600">{icon}</div>
        <div>
          <h2 className="font-semibold text-lg">{title}</h2>
          <p className="text-sm text-gray-500">{sub}</p>
        </div>
        {!hasAny ? (
          <span className="text-sm text-gray-400">Non ancora disponibile</span>
        ) : platform === "mac" ? (
          <div className="flex flex-col w-full gap-2 mt-1">
            {archs.arm64 && (
              <DownloadBtn
                rel={archs.arm64}
                label={`Apple Silicon (M1/M2/M3)${archs.arm64.version ? ` · v${archs.arm64.version}` : ""}`}
                primary={recommended?.platform === "mac" && recommended.arch === "arm64"}
              />
            )}
            {archs.x64 && (
              <DownloadBtn
                rel={archs.x64}
                label={`Intel${archs.x64.version ? ` · v${archs.x64.version}` : ""}`}
                primary={recommended?.platform === "mac" && recommended.arch === "x64"}
              />
            )}
          </div>
        ) : (
          // win + linux: solo x64 per ora
          archs.x64 && (
            <DownloadBtn
              rel={archs.x64}
              label={`Scarica${archs.x64.version ? ` v${archs.x64.version}` : ""}`}
              primary={isRecommended}
            />
          )
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-3xl font-bold">Scarica RescueManager Desktop</h1>
          <p className="mt-2 text-gray-500">
            Installa l&apos;app desktop. Dopo l&apos;installazione gli
            aggiornamenti successivi arrivano automaticamente in-app.
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {recommended && (
              <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  Abbiamo rilevato <strong>{platformLabel(recommended.platform)}{recommended.platform === "mac" ? ` · ${archLabel(recommended.arch)}` : ""}</strong>.
                  Il bottone evidenziato è la versione consigliata.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PlatformCard platform="win" title="Windows" sub="Windows 10/11 · installer .exe" icon={<Monitor className="h-10 w-10" />} />
              <PlatformCard platform="mac" title="macOS" sub="Apple Silicon o Intel · .dmg" icon={<Apple className="h-10 w-10" />} />
              <PlatformCard platform="linux" title="Linux" sub="AppImage / .deb" icon={<Monitor className="h-10 w-10" />} />
            </div>
          </>
        )}

        <div className="mt-10 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>macOS Apple Silicon vs Intel:</strong> se hai un Mac con chip M1/M2/M3 scarica
          la versione &quot;Apple Silicon&quot;. I Mac più vecchi (2019 e precedenti)
          usano la versione &quot;Intel&quot;. In dubbio: apri &gt; Informazioni su questo Mac
          &gt; cerca &quot;Chip&quot; o &quot;Processore&quot;.
        </div>
      </div>
    </div>
  );
}
