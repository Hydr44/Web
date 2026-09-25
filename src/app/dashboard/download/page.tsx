"use client";

import { useEffect, useMemo, useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";

/**
 * Scaricamento delle applicazioni dentro l'area cliente.
 *
 * Stessa sorgente della pagina pubblica /download (`/api/app-release/latest`),
 * ma disegnata come l'applicazione desktop: righe, niente riquadri colorati.
 * L'accesso e' gia' controllato dal layout di /dashboard, quindi qui non si
 * rifa' il controllo della sessione.
 */

type Rel = { version?: string; filename?: string; size?: number; releaseDate?: string; sha512?: string; url: string };
type Piattaforma = "win" | "mac" | "linux";
type Arch = "arm64" | "x64";
type ReleasesByArch = Record<Piattaforma, Partial<Record<Arch, Rel>>>;

function fmtSize(b?: number) {
  if (!b) return "";
  return b > 1e9 ? `${(b / 1e9).toFixed(1)} GB` : `${Math.round(b / 1e6)} MB`;
}

/**
 * Riconosce sistema e processore del computer che sta guardando la pagina.
 * userAgentData esiste solo su Chromium; altrove si legge lo user agent.
 */
type Indizio = { piattaforma: Piattaforma | null; arch: Arch | null };
function riconosciComputer(): Indizio {
  if (typeof navigator === "undefined") return { piattaforma: null, arch: null };
  const ua = navigator.userAgent;
  const uad = (navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData;
  // I telefoni non vengono classificati qui: hanno una sezione dedicata.
  let piattaforma: Piattaforma | null = null;
  const platStr = (uad?.platform || ua).toLowerCase();
  if (!/android|iphone|ipad|ipod/.test(platStr)) {
    if (platStr.includes("win")) piattaforma = "win";
    else if (platStr.includes("mac")) piattaforma = "mac";
    else if (platStr.includes("linux")) piattaforma = "linux";
  }
  let arch: Arch | null = null;
  if (/arm64|aarch64/.test(ua.toLowerCase())) arch = "arm64";
  else if (/intel|x86_64|x64|wow64|win64/.test(ua.toLowerCase())) arch = "x64";
  // Su Safari il Mac dichiara sempre "Intel": in quel caso niente consiglio
  // sul processore, sceglie l'utente.
  return { piattaforma, arch };
}

/** Riconosce il telefono, per indicare la riga giusta fra Android e iPhone. */
function riconosciTelefono(): "android" | "ios" | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return "android";
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  return null;
}

const NOME_PIATTAFORMA: Record<Piattaforma, string> = {
  win: "Windows",
  mac: "macOS",
  linux: "Linux",
};
const NOME_ARCH: Record<Arch, string> = {
  arm64: "Apple Silicon",
  x64: "Intel",
};

export default function DashboardDownloadPage() {
  usePageTitle("Scarica le app");

  const [byArch, setByArch] = useState<ReleasesByArch | null>(null);
  const [android, setAndroid] = useState<Rel | null>(null);
  const [iosUrl, setIosUrl] = useState<string | null>(null);
  const [telefono, setTelefono] = useState<"android" | "ios" | null>(null);
  const [computer, setComputer] = useState<Indizio>({ piattaforma: null, arch: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let annullato = false;
    (async () => {
      setComputer(riconosciComputer());
      setTelefono(riconosciTelefono());
      try {
        const r = await fetch("/api/app-release/latest", { cache: "no-store" });
        const d = await r.json();
        if (annullato) return;
        setByArch(d?.releasesByArch || null);
        setAndroid(d?.android || null);
        setIosUrl(d?.iosAppStoreUrl || null);
      } catch {
        if (!annullato) { setByArch(null); setAndroid(null); setIosUrl(null); }
      } finally {
        if (!annullato) setLoading(false);
      }
    })();
    return () => { annullato = true; };
  }, []);

  // Versione consigliata: quella che corrisponde al computer in uso.
  // Se il processore non e' noto: arm64 su Mac, x64 su Windows e Linux.
  const consigliata = useMemo<{ piattaforma: Piattaforma; arch: Arch } | null>(() => {
    if (!byArch || !computer.piattaforma) return null;
    const p = computer.piattaforma;
    if (computer.arch && byArch[p]?.[computer.arch]) return { piattaforma: p, arch: computer.arch };
    const preferita: Arch = p === "mac" ? "arm64" : "x64";
    if (byArch[p]?.[preferita]) return { piattaforma: p, arch: preferita };
    const altra: Arch = preferita === "arm64" ? "x64" : "arm64";
    if (byArch[p]?.[altra]) return { piattaforma: p, arch: altra };
    return null;
  }, [byArch, computer]);

  // Una riga per ogni file disponibile, nell'ordine in cui la gente li cerca.
  const righe = useMemo(() => {
    if (!byArch) return [];
    const ordine: Array<[Piattaforma, Arch]> = [
      ["win", "x64"],
      ["win", "arm64"],
      ["mac", "arm64"],
      ["mac", "x64"],
      ["linux", "x64"],
      ["linux", "arm64"],
    ];
    const nomeProcessore = (p: Piattaforma, a: Arch) => {
      if (p === "mac") return NOME_ARCH[a];
      return a === "arm64" ? "ARM 64 bit" : "64 bit";
    };
    return ordine
      .filter(([p, a]) => !!byArch[p]?.[a])
      .map(([p, a]) => ({
        chiave: `${p}-${a}`,
        sistema: NOME_PIATTAFORMA[p],
        processore: nomeProcessore(p, a),
        rel: byArch[p]![a]!,
        consigliata: consigliata?.piattaforma === p && consigliata.arch === a,
      }));
  }, [byArch, consigliata]);

  return (
    <div>
      <div className="rm-area__intesta">
        <div>
          <h1>Scarica le app</h1>
          <p className="rm-muted" style={{ marginTop: 4 }}>
            L&apos;applicazione per il computer e l&apos;app per gli autisti. Una volta installate,
            gli aggiornamenti arrivano da soli.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="rm-muted">Lettura delle versioni disponibili in corso</p>
      ) : (
        <>
          {consigliata && (
            <div className="rm-note rm-note--info" style={{ marginBottom: 16 }}>
              Questo computer risulta {NOME_PIATTAFORMA[consigliata.piattaforma]}
              {consigliata.piattaforma === "mac" ? ` con processore ${NOME_ARCH[consigliata.arch]}` : ""}:
              la riga indicata come consigliata e&apos; quella da scaricare.
            </div>
          )}

          <section className="rm-card">
            <div className="rm-cardhead">
              <h2>Applicazione per il computer</h2>
            </div>
            {righe.length === 0 ? (
              <p className="rm-muted">Nessuna versione disponibile al momento.</p>
            ) : (
              <div className="rm-scroll">
                <table className="rm-tab">
                  <thead>
                    <tr>
                      <th>Sistema</th>
                      <th>Processore</th>
                      <th>Versione</th>
                      <th>Dimensione</th>
                      <th>File</th>
                    </tr>
                  </thead>
                  <tbody>
                    {righe.map((r) => (
                      <tr key={r.chiave}>
                        <td>
                          {r.sistema}
                          {r.consigliata && (
                            <span className="rm-stato rm-stato--corso" style={{ marginLeft: 8 }}>
                              consigliata
                            </span>
                          )}
                        </td>
                        <td>{r.processore}</td>
                        <td className="rm-mono">{r.rel.version || "—"}</td>
                        <td>{fmtSize(r.rel.size) || "—"}</td>
                        <td><a href={r.rel.url}>Scarica</a></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="rm-note" style={{ marginTop: 16 }}>
              Mac con processore Apple Silicon (M1, M2, M3) scaricano la versione Apple Silicon;
              i Mac del 2019 e precedenti scaricano la versione Intel. Nel dubbio: menu Apple,
              Informazioni su questo Mac, voce Chip o Processore.
            </div>
          </section>

          <section className="rm-card">
            <div className="rm-cardhead">
              <h2>App per gli autisti</h2>
              <span className="rm-muted">trasporti assegnati, navigazione, foto e firma</span>
            </div>
            <div className="rm-righe">
              <div className="rm-riga">
                <span>
                  Android
                  {telefono === "android" && (
                    <span className="rm-stato rm-stato--corso" style={{ marginLeft: 8 }}>consigliata</span>
                  )}
                </span>
                <span>
                  {android?.url ? (
                    <>
                      <a href={android.url}>Scarica il file di installazione</a>
                      {android.version ? <span className="rm-muted">{` · versione ${android.version}`}</span> : null}
                      {android.size ? <span className="rm-muted">{` · ${fmtSize(android.size)}`}</span> : null}
                      <span className="rm-muted" style={{ display: "block", marginTop: 4 }}>
                        Al primo avvio Android chiede di autorizzare l&apos;installazione da questa
                        origine: confermare per procedere.
                      </span>
                    </>
                  ) : (
                    <span className="rm-stato rm-stato--fermo">Non ancora disponibile</span>
                  )}
                </span>
              </div>
              <div className="rm-riga">
                <span>
                  iPhone e iPad
                  {telefono === "ios" && (
                    <span className="rm-stato rm-stato--corso" style={{ marginLeft: 8 }}>consigliata</span>
                  )}
                </span>
                <span>
                  {iosUrl ? (
                    <a href={iosUrl} target="_blank" rel="noopener noreferrer">Apri la scheda su App Store</a>
                  ) : (
                    <span className="rm-stato rm-stato--fermo">Non ancora disponibile</span>
                  )}
                </span>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
