"use client";

import { motion } from "framer-motion";
import { 
  BookOpen, 
  Calendar, 
  User, 
  Tag,
  ArrowRight,
  Clock,
  Eye,
  Heart,
  Share2,
  Search
} from "lucide-react";

export default function BlogPage() {
  const posts = [
    {
      title: "Il Futuro della Gestione Officine: Digitalizzazione e Automazione",
      excerpt: "Come le nuove tecnologie stanno rivoluzionando il settore automotive e cosa significa per le officine di soccorso stradale.",
      author: "Marco Rossi",
      date: "2024-12-20",
      readTime: "5 min",
      category: "Innovazione",
      image: "/blog/digitalizzazione-officine.jpg",
      views: 1250,
      likes: 89
    },
    {
      title: "Guida Completa alla Gestione Inventario per Officine",
      excerpt: "Strategie e best practices per ottimizzare la gestione dei ricambi e ridurre i costi operativi.",
      author: "Sara Bianchi",
      date: "2024-12-15",
      readTime: "8 min",
      category: "Gestione",
      image: "/blog/gestione-inventario.jpg",
      views: 980,
      likes: 67
    },
    {
      title: "Sostenibilità nel Settore Automotive: Nuove Opportunità",
      excerpt: "Come le officine possono contribuire alla transizione ecologica attraverso pratiche sostenibili.",
      author: "Luca Verdi",
      date: "2024-12-10",
      readTime: "6 min",
      category: "Sostenibilità",
      image: "/blog/sostenibilita-automotive.jpg",
      views: 756,
      likes: 45
    },
    {
      title: "Intelligenza Artificiale per la Diagnostica Veicoli",
      excerpt: "L'AI sta trasformando il modo in cui diagnostichiamo e risolviamo i problemi dei veicoli.",
      author: "Anna Neri",
      date: "2024-12-05",
      readTime: "7 min",
      category: "Tecnologia",
      image: "/blog/ai-diagnostica.jpg",
      views: 1100,
      likes: 92
    }
  ];

  const categories = [
    { name: "Tutti", count: 24, active: true },
    { name: "Innovazione", count: 8 },
    { name: "Gestione", count: 6 },
    { name: "Tecnologia", count: 5 },
    { name: "Sostenibilità", count: 3 },
    { name: "Tutorial", count: 2 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-blue-50/30">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        
        <div className="rm-container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 text-xs rounded-full ring-1 ring-primary/30 px-3 py-1.5 mb-6 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary font-medium"
            >
              <BookOpen className="h-3 w-3" />
              Blog
            </motion.div>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Il nostro{" "}
              <span className="text-primary">Blog</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
              Scopri le ultime novità, tutorial e approfondimenti sul settore automotive 
              e sulla gestione delle officine di soccorso stradale.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cerca articoli..."
                  className="pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-primary focus:border-primary w-full sm:w-80"
                />
              </div>
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors">
                <Search className="h-5 w-5" />
                Cerca
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="rm-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-2 justify-center"
          >
            {categories.map((category, i) => (
              <motion.button
                key={category.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  category.active
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category.name} ({category.count})
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-16">
        <div className="rm-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-6xl mx-auto"
          >
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Featured Post */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="lg:col-span-2"
              >
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="h-48 bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-white opacity-50" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                        {posts[0].category}
                      </span>
                      <span className="text-gray-500 text-sm">•</span>
                      <span className="text-gray-500 text-sm">{posts[0].readTime}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                      {posts[0].title}
                    </h2>
                    <p className="text-gray-600 mb-4">
                      {posts[0].excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {posts[0].author}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(posts[0].date).toLocaleDateString('it-IT')}
                        </div>
                      </div>
                      <button className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
                        Leggi tutto
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Sidebar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Articoli Popolari
                  </h3>
                  <div className="space-y-4">
                    {posts.slice(1, 4).map((post, i) => (
                      <div key={post.title} className="flex gap-3">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                            {post.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{post.readTime}</span>
                            <span>•</span>
                            <span>{post.views} views</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Newsletter
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Ricevi gli ultimi articoli direttamente nella tua email
                  </p>
                  <div className="space-y-3">
                    <input
                      type="email"
                      placeholder="La tua email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
                    />
                    <button className="w-full py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm">
                      Iscriviti
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* All Posts */}
            <div className="mt-12 grid md:grid-cols-2 gap-6">
              {posts.slice(1).map((post, i) => (
                <motion.article
                  key={post.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200"
                >
                  <div className="h-48 bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-gray-400" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                        {post.category}
                      </span>
                      <span className="text-gray-500 text-sm">•</span>
                      <span className="text-gray-500 text-sm">{post.readTime}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {post.author}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.date).toLocaleDateString('it-IT')}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Eye className="h-3 w-3" />
                          {post.views}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Heart className="h-3 w-3" />
                          {post.likes}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
