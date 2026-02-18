import Link from "next/link";
import { 
  Briefcase, 
  Users, 
  MapPin, 
  Clock,
  ArrowRight,
  Heart,
  Zap,
  Shield,
  Globe
} from "lucide-react";

export default function CarrierePage() {
  const positions = [
    { title: "Frontend Developer", location: "Remoto, Italia", type: "Full-time", department: "Engineering", description: "Sviluppo interfacce utente con React e Next.js" },
    { title: "Backend Developer", location: "Remoto, Italia", type: "Full-time", department: "Engineering", description: "Sviluppo API e servizi backend con Node.js e PostgreSQL" },
    { title: "Product Manager", location: "Remoto, Italia", type: "Full-time", department: "Product", description: "Gestione del ciclo di vita del prodotto e roadmap" },
    { title: "UX/UI Designer", location: "Remoto, Italia", type: "Full-time", department: "Design", description: "Progettazione di esperienze utente intuitive" },
  ];

  return (
    <div className="bg-white">
      <section className="pt-28 pb-10 bg-gray-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Lavora con noi</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Cerchiamo persone che vogliono costruire software utile per il settore autodemolizioni e soccorso stradale.
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Posizioni aperte</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {positions.map((p) => (
              <div key={p.title} className="rounded-lg p-6 border border-gray-200 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{p.title}</h3>
                    <p className="text-sm text-[#2563EB] font-medium">{p.department}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded">{p.type}</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{p.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {p.location}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {p.type}</span>
                </div>
                <Link href="/contatti" className="w-full py-2 px-4 bg-[#2563EB] text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                  <ArrowRight className="h-4 w-4" /> Candidati
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 bg-gray-50 border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Perché lavorare con noi</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Heart, title: "Ambiente stimolante", desc: "Team piccolo, impatto grande" },
              { icon: Zap, title: "Tecnologie moderne", desc: "React, Electron, Supabase, Node.js" },
              { icon: Shield, title: "Flessibilità", desc: "Smart working e orari flessibili" },
              { icon: Globe, title: "Crescita", desc: "Prodotto in espansione nel mercato italiano" },
            ].map((b) => (
              <div key={b.title} className="bg-white rounded-lg p-5 border border-gray-200 text-center">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <b.icon className="h-5 w-5 text-gray-700" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">{b.title}</h3>
                <p className="text-xs text-gray-600">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 bg-[#2563EB]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Non trovi la posizione giusta?</h2>
          <p className="text-blue-100 mb-6">Inviaci una candidatura spontanea a info@rescuemanager.eu</p>
          <Link href="/contatti" className="inline-flex items-center gap-2 px-7 py-3 bg-white text-[#2563EB] font-semibold rounded-lg hover:bg-gray-50 transition-colors">
            <Users className="h-4 w-4" /> Candidatura spontanea
          </Link>
        </div>
      </section>
    </div>
  );
}
