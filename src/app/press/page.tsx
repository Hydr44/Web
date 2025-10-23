"use client";

import { motion } from "framer-motion";
import { 
  Newspaper, 
  Calendar, 
  Download, 
  ExternalLink,
  FileText,
  Users,
  Award,
  TrendingUp
} from "lucide-react";

export default function PressPage() {
  const pressReleases = [
    {
      date: "2024-12-23",
      title: "RescueManager lancia la nuova versione 2.0",
      description: "Miglioramenti significativi per la gestione delle officine di soccorso stradale",
      category: "Product Launch"
    },
    {
      date: "2024-11-15",
      title: "Partnership strategica con i principali operatori del settore",
      description: "Nuove collaborazioni per espandere la rete di servizi",
      category: "Partnership"
    },
    {
      date: "2024-10-08",
      title: "RescueManager raggiunge 1000 officine attive",
      description: "Traguardo importante per la piattaforma di gestione",
      category: "Milestone"
    }
  ];

  const mediaKit = [
    {
      title: "Logo RescueManager",
      description: "Logo ufficiale in formato SVG e PNG",
      format: "SVG, PNG",
      size: "2.1 MB"
    },
    {
      title: "Immagini prodotto",
      description: "Screenshot e mockup dell'applicazione",
      format: "JPG, PNG",
      size: "15.3 MB"
    },
    {
      title: "Brand Guidelines",
      description: "Linee guida per l'uso del brand",
      format: "PDF",
      size: "3.2 MB"
    }
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
              <Newspaper className="h-3 w-3" />
              Sala Stampa
            </motion.div>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Sala <span className="text-primary">Stampa</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
              Tutte le informazioni, i comunicati stampa e i materiali per i media su RescueManager
            </p>
          </motion.div>
        </div>
      </section>

      {/* Press Releases */}
      <section className="py-16">
        <div className="rm-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Comunicati Stampa
            </h2>
            
            <div className="space-y-6">
              {pressReleases.map((release, i) => (
                <motion.div
                  key={release.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm font-medium text-primary">{release.category}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      {new Date(release.date).toLocaleDateString('it-IT')}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {release.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-4">
                    {release.description}
                  </p>
                  
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
                      <FileText className="h-4 w-4" />
                      Leggi comunicato
                    </button>
                    <button className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors">
                      <Download className="h-4 w-4" />
                      Scarica PDF
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Media Kit */}
      <section className="py-16 bg-gray-50">
        <div className="rm-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Media Kit
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {mediaKit.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4">
                    {item.description}
                  </p>
                  
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex justify-between">
                      <span>Formato:</span>
                      <span className="font-medium">{item.format}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dimensione:</span>
                      <span className="font-medium">{item.size}</span>
                    </div>
                  </div>
                  
                  <button className="w-full mt-4 py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                    <Download className="h-4 w-4" />
                    Scarica
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16">
        <div className="rm-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="max-w-2xl mx-auto text-center"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Contatti Stampa
            </h2>
            
            <p className="text-lg text-gray-600 mb-8">
              Per richieste di informazioni, interviste o materiali aggiuntivi
            </p>
            
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Users className="h-6 w-6 text-primary" />
                <span className="text-lg font-semibold text-gray-900">Ufficio Stampa</span>
              </div>
              
              <div className="space-y-3 text-gray-600">
                <p>Email: press@rescuemanager.eu</p>
                <p>Telefono: +39 02 1234 5678</p>
                <p>Orari: Lun-Ven 9:00-18:00</p>
              </div>
              
              <button className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors">
                <ExternalLink className="h-4 w-4" />
                Contatta ora
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
