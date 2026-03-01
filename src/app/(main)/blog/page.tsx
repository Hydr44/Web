import { BookOpen, Calendar, User, Clock } from "lucide-react";

export default function BlogPage() {
  const posts = [
    { title: "Obbligo RENTRI 2025: cosa cambia per le autodemolizioni", excerpt: "Dal 2025 il registro RENTRI diventa obbligatorio. Ecco cosa devi sapere e come prepararti.", author: "RescueManager", date: "2025-01-15", readTime: "5 min", category: "Normative" },
    { title: "Come gestire le radiazioni RVFU senza errori", excerpt: "Guida pratica per compilare correttamente le radiazioni e evitare problemi con il Ministero.", author: "RescueManager", date: "2025-01-08", readTime: "8 min", category: "Guide" },
    { title: "Fatturazione elettronica: errori comuni e come evitarli", excerpt: "Gli errori più frequenti nell'invio delle fatture SDI e come il gestionale può prevenirli.", author: "RescueManager", date: "2024-12-20", readTime: "6 min", category: "Guide" },
    { title: "Gestione piazzale: organizzare i veicoli in deposito", excerpt: "Consigli pratici per tenere traccia di ogni veicolo dal momento dell'ingresso alla demolizione.", author: "RescueManager", date: "2024-12-10", readTime: "4 min", category: "Operatività" },
  ];

  return (
    <div className="bg-white">
      <section className="pt-16 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-3">Blog<span className="text-blue-500">.</span></h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            Guide, novità normative e consigli pratici per chi gestisce autodemolizioni e soccorso stradale.
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-4xl mx-auto px-6">
          <div className="space-y-6">
            {posts.map((post) => (
              <article key={post.title} className="rounded-lg border border-gray-200 p-6 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-medium text-[#2563EB] bg-blue-50 px-2 py-1 rounded">{post.category}</span>
                  <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readTime}</span>
                  <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(post.date).toLocaleDateString('it-IT')}</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">{post.title}</h2>
                <p className="text-sm text-gray-600 mb-3">{post.excerpt}</p>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <User className="h-3 w-3" /> {post.author}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-gray-500">Il blog è in fase di avvio. Nuovi articoli in arrivo.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
