"use client";
import { useEffect, useState } from "react";
import { Apple, Monitor, Loader2, Download } from "lucide-react";

type Rel = { version?: string; filename?: string; size?: number; releaseDate?: string; url: string };
type Releases = { win: Rel | null; mac: Rel | null; linux: Rel | null };

function fmtSize(b?: number) {
  if (!b) return "";
  return b > 1e9 ? `${(b / 1e9).toFixed(1)} GB` : `${Math.round(b / 1e6)} MB`;
}

export default function DownloadPage() {
  const [rel, setRel] = useState<Releases | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/app-release/latest", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setRel(d?.releases || null))
      .catch(() => setRel(null))
      .finally(() => setLoading(false));
  }, []);

  const Card = ({
    icon, title, sub, r,
  }: { icon: React.ReactNode; title: string; sub: string; r: Rel | null }) => (
    <div className="rounded-xl border bg-white p-6 flex flex-col items-center text-center gap-3">
      <div className="text-blue-600">{icon}</div>
      <div>
        <h2 className="font-semibold text-lg">{title}</h2>
        <p className="text-sm text-gray-500">{sub}</p>
      </div>
      {r ? (
        <>
          <a
            href={r.url}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Download className="h-4 w-4" /> Scarica {r.version ? `v${r.version}` : ""}
          </a>
          <p className="text-xs text-gray-400">
            {r.filename} {r.size ? `· ${fmtSize(r.size)}` : ""}
          </p>
        </>
      ) : (
        <span className="text-sm text-gray-400">Non ancora disponibile</span>
      )}
    </div>
  );

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card icon={<Monitor className="h-10 w-10" />} title="Windows" sub="Windows 10/11 · installer .exe" r={rel?.win || null} />
            <Card icon={<Apple className="h-10 w-10" />} title="macOS" sub="Apple Silicon / Intel · .dmg" r={rel?.mac || null} />
            <Card icon={<Monitor className="h-10 w-10" />} title="Linux" sub="AppImage / .deb" r={rel?.linux || null} />
          </div>
        )}

        <div className="mt-10 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>macOS:</strong> se al primo avvio compare &quot;impossibile
          aprire / app non verificata&quot;, l&apos;app non è ancora
          notarizzata Apple. Workaround temporaneo: tasto destro sull&apos;app →
          Apri → Apri. La notarizzazione definitiva rimuove l&apos;avviso.
        </div>
      </div>
    </div>
  );
}
