"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Apple, Monitor, Loader2, Download, Info, Smartphone } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

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
  // Platform desktop. I dispositivi mobile (android/iphone/ipad) NON vengono
  // classificati qui: hanno una sezione dedicata più in basso (detectMobile).
  let platform: Platform | null = null;
  const platStr = (uad?.platform || ua).toLowerCase();
  if (!/android|iphone|ipad|ipod/.test(platStr)) {
    if (platStr.includes("win")) platform = "win";
    else if (platStr.includes("mac")) platform = "mac";
    else if (platStr.includes("linux")) platform = "linux";
  }
  // Arch
  let arch: Arch | null = null;
  if (/arm64|aarch64/.test(ua.toLowerCase())) arch = "arm64";
  else if (/intel|x86_64|x64|wow64|win64/.test(ua.toLowerCase())) arch = "x64";
  // Su Safari mac User-Agent non rivela arch: niente arch detect, l'utente sceglie.
  // Sui Mac Apple Silicon Safari ritorna "Intel Mac OS X" per compat → unreliable.
  return { platform, arch };
}

/** Rileva se il client è un telefono/tablet mobile, per evidenziare la card giusta. */
function detectMobile(): "android" | "ios" | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return "android";
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  return null;
}

export default function DownloadPage({ embedded = false }: { embedded?: boolean }) {
  const [byArch, setByArch] = useState<ReleasesByArch | null>(null);
  const [flat, setFlat] = useState<LegacyReleases | null>(null);
  const [android, setAndroid] = useState<Rel | null>(null);
  const [iosUrl, setIosUrl] = useState<string | null>(null);
  const [mobileHint, setMobileHint] = useState<"android" | "ios" | null>(null);
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<ClientHint>({ platform: null, arch: null });
  const router = useRouter();

  useEffect(() => {
    const supabase = supabaseBrowser();
    let cancelled = false;
    (async () => {
      // Gate: il download è riservato agli utenti autenticati. Senza una sessione
      // valida → redirect al login (stesso pattern di /dashboard). NB: il feed
      // auto-update /api/app-update/* resta pubblico (electron-updater non può
      // autenticarsi come utente web).
      const { data: { user }, error } = await supabase.auth.getUser();
      if (cancelled) return;
      // Standalone: gate proprio. Embedded (/dashboard/download): gate del layout dashboard.
      if ((error || !user) && !embedded) {
        router.replace("/login?redirect=/dashboard/download");
        return;
      }
      setClient(detectClient());
      setMobileHint(detectMobile());
      try {
        const r = await fetch("/api/app-release/latest", { cache: "no-store" });
        const d = await r.json();
        if (cancelled) return;
        setByArch(d?.releasesByArch || null);
        setFlat(d?.releases || null);
        setAndroid(d?.android || null);
        setIosUrl(d?.iosAppStoreUrl || null);
      } catch {
        if (!cancelled) { setByArch(null); setFlat(null); setAndroid(null); setIosUrl(null); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

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

  // Bottone download — squadrato, stile sito (blu #2563EB primario / contorno grigio).
  const DownloadBtn = ({ rel, label, primary }: { rel: Rel; label: string; primary?: boolean }) => (
    <a
      href={rel.url}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
        primary
          ? "bg-[#2563EB] text-white hover:bg-blue-700"
          : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      <Download className="h-4 w-4" />
      {label}
      {rel.size ? <span className={`text-xs ${primary ? "text-blue-100" : "text-gray-400"}`}>· {fmtSize(rel.size)}</span> : null}
    </a>
  );

  // Card piattaforma — squadrata, bordo grigio sito; quella consigliata bordo blu.
  const PlatformCard = ({ platform, title, sub, icon }: { platform: Platform; title: string; sub: string; icon: React.ReactNode }) => {
    const archs = (byArch?.[platform] || {}) as Partial<Record<Arch, Rel>>;
    const hasAny = !!(archs.arm64 || archs.x64);
    const isRecommended = recommended?.platform === platform;

    return (
      <div className={`border bg-white p-6 flex flex-col items-center text-center gap-3 ${isRecommended ? "border-[#2563EB] ring-1 ring-[#2563EB]" : "border-gray-200"}`}>
        {isRecommended && (
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#2563EB] -mb-1">
            Consigliato per il tuo computer
          </div>
        )}
        <div className="text-[#2563EB]">{icon}</div>
        <div>
          <h2 className="font-bold text-lg text-gray-900">{title}</h2>
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

  // Card mobile — stessa estetica squadrata delle card desktop. Quella rilevata
  // dallo UA del telefono prende il bordo blu (consigliata).
  const MobileCard = ({ title, sub, icon, recommended, children }: {
    title: string; sub: string; icon: React.ReactNode; recommended?: boolean; children: React.ReactNode;
  }) => (
    <div className={`border bg-white p-6 flex flex-col items-center text-center gap-3 ${recommended ? "border-[#2563EB] ring-1 ring-[#2563EB]" : "border-gray-200"}`}>
      {recommended && (
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#2563EB] -mb-1">
          Consigliato per il tuo telefono
        </div>
      )}
      <div className="text-[#2563EB]">{icon}</div>
      <div>
        <h3 className="font-bold text-lg text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{sub}</p>
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Download</h1>
        <p className="mt-1 text-sm text-slate-500">
          Scarica l&apos;app desktop e l&apos;app autisti — poi gli aggiornamenti arrivano da soli in-app.
        </p>
      </div>
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-[#2563EB]" />
            </div>
          ) : (
            <>
              {recommended && (
                <div className="mb-6 border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    Abbiamo rilevato <strong>{platformLabel(recommended.platform)}{recommended.platform === "mac" ? ` · ${archLabel(recommended.arch)}` : ""}</strong>.
                    Il bottone evidenziato è la versione consigliata.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <PlatformCard platform="win" title="Windows" sub="Windows 10/11 · installer .exe" icon={<Monitor className="h-10 w-10" />} />
                <PlatformCard platform="mac" title="macOS" sub="Apple Silicon o Intel · .dmg" icon={<Apple className="h-10 w-10" />} />
                <PlatformCard platform="linux" title="Linux" sub="AppImage / .deb" icon={<Monitor className="h-10 w-10" />} />
              </div>

              <div className="mt-8 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <strong>macOS Apple Silicon vs Intel:</strong> se hai un Mac con chip M1/M2/M3 scarica
                la versione &quot;Apple Silicon&quot;. I Mac più vecchi (2019 e precedenti)
                usano la versione &quot;Intel&quot;. In dubbio: apri &gt; Informazioni su questo Mac
                &gt; cerca &quot;Chip&quot; o &quot;Processore&quot;.
              </div>

              {/* === App per gli autisti (mobile) === */}
              <div className="mt-14">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">App per gli autisti</h2>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  L&apos;app da campo per chi guida: trasporti assegnati, navigazione, foto e firma sul posto.
                </p>
                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Android — APK scaricato direttamente da noi */}
                  <MobileCard
                    title="Android"
                    sub="Telefoni e tablet Android · file .apk"
                    icon={<Smartphone className="h-10 w-10" />}
                    recommended={mobileHint === "android"}
                  >
                    {android?.url ? (
                      <div className="flex flex-col w-full gap-2 mt-1">
                        <a
                          href={android.url}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors bg-[#2563EB] text-white hover:bg-blue-700"
                        >
                          <Download className="h-4 w-4" />
                          Scarica APK
                          {android.version ? <span className="text-xs text-blue-100">· v{android.version}</span> : null}
                          {android.size ? <span className="text-xs text-blue-100">· {fmtSize(android.size)}</span> : null}
                        </a>
                        <p className="text-xs text-gray-400">
                          Al primo avvio Android chiede di autorizzare l&apos;installazione da questa fonte: conferma per procedere.
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Non ancora disponibile</span>
                    )}
                  </MobileCard>

                  {/* iOS — link alla scheda App Store (configurato da admin) */}
                  <MobileCard
                    title="iPhone e iPad"
                    sub="iOS · App Store"
                    icon={<Apple className="h-10 w-10" />}
                    recommended={mobileHint === "ios"}
                  >
                    {iosUrl ? (
                      <a
                        href={iosUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors bg-[#2563EB] text-white hover:bg-blue-700 mt-1"
                      >
                        <Apple className="h-4 w-4" />
                        Scarica su App Store
                      </a>
                    ) : (
                      <span className="text-sm text-gray-400">Non ancora disponibile</span>
                    )}
                  </MobileCard>
                </div>
              </div>
            </>
          )}
    </div>
  );
}
