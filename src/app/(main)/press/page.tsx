import Link from "next/link";
import { Calendar, Download, FileText, Users } from "lucide-react";

export default function PressPage() {
  const pressReleases = [
    { date: "2024-12-23", title: "RescueManager lancia la nuova versione 2.0", description: "Miglioramenti significativi per la gestione delle autodemolizioni e soccorso stradale", category: "Prodotto" },
    { date: "2024-11-15", title: "Partnership strategica con operatori del settore", description: "Nuove collaborazioni per espandere la rete di servizi", category: "Partnership" },
    { date: "2024-10-08", title: "Integrazione RENTRI completata", description: "RescueManager è tra i primi gestionali a integrare il registro nazionale rifiuti", category: "Integrazione" },
  ];

  const mediaKit = [
    { title: "Logo RescueManager", description: "Logo ufficiale in formato SVG e PNG", format: "SVG, PNG", size: "2.1 MB" },
    { title: "Immagini prodotto", description: "Screenshot e mockup dell'applicazione", format: "JPG, PNG", size: "15.3 MB" },
    { title: "Brand Guidelines", description: "Linee guida per l'uso del brand", format: "PDF", size: "3.2 MB" },
  ];

  return (
    <div className="bg-white">
      <section className="pt-28 pb-10 bg-gray-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Sala Stampa</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Comunicati stampa, materiali per i media e informazioni su RescueManager.
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Comunicati stampa</h2>
          <div className="space-y-5">
            {pressReleases.map((r) => (
              <div key={r.title} className="rounded-lg p-6 border border-gray-200 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-[#2563EB] bg-blue-50 px-2 py-1 rounded">{r.category}</span>
                  <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(r.date).toLocaleDateString('it-IT')}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{r.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{r.description}</p>
                <div className="flex items-center gap-4 text-sm">
                  <button className="flex items-center gap-1.5 text-[#2563EB] hover:underline"><FileText className="h-4 w-4" /> Leggi</button>
                  <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700"><Download className="h-4 w-4" /> PDF</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 bg-gray-50 border-y border-gray-200">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Media Kit</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {mediaKit.map((item) => (
              <div key={item.title} className="bg-white rounded-lg p-5 border border-gray-200">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                  <FileText className="h-5 w-5 text-gray-700" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1 text-sm">{item.title}</h3>
                <p className="text-xs text-gray-600 mb-3">{item.description}</p>
                <div className="text-xs text-gray-500 space-y-1 mb-3">
                  <div className="flex justify-between"><span>Formato:</span><span className="font-medium">{item.format}</span></div>
                  <div className="flex justify-between"><span>Dimensione:</span><span className="font-medium">{item.size}</span></div>
                </div>
                <button className="w-full py-2 px-3 bg-[#2563EB] text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 text-sm">
                  <Download className="h-3.5 w-3.5" /> Scarica
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Contatti stampa</h2>
          <div className="rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Users className="h-5 w-5 text-gray-400" />
              <span className="font-semibold text-gray-900">Ufficio Stampa</span>
            </div>
            <div className="space-y-1 text-sm text-gray-600 mb-4">
              <p>Email: info@rescuemanager.eu</p>
              <p>Telefono: 392 172 3028</p>
              <p>Orari: Lun-Ven 9:00-18:00</p>
            </div>
            <Link href="/contatti" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              Contattaci
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
