"use client";

import { motion } from "framer-motion";
import { 
  Briefcase, 
  Users, 
  MapPin, 
  Clock,
  CheckCircle2,
  ArrowRight,
  Heart,
  Zap,
  Shield,
  Globe
} from "lucide-react";

export default function CarrierePage() {
  const positions = [
    {
      title: "Frontend Developer",
      location: "Milano, Italia",
      type: "Full-time",
      department: "Engineering",
      description: "Sviluppo interfacce utente moderne con React e Next.js"
    },
    {
      title: "Backend Developer",
      location: "Roma, Italia",
      type: "Full-time",
      department: "Engineering",
      description: "Sviluppo API e servizi backend con Node.js e PostgreSQL"
    },
    {
      title: "Product Manager",
      location: "Torino, Italia",
      type: "Full-time",
      department: "Product",
      description: "Gestione del ciclo di vita del prodotto e roadmap"
    },
    {
      title: "UX/UI Designer",
      location: "Firenze, Italia",
      type: "Full-time",
      department: "Design",
      description: "Progettazione di esperienze utente intuitive e accattivanti"
    }
  ];

  const benefits = [
    {
      icon: Heart,
      title: "Ambiente Stimolante",
      description: "Lavora con un team giovane e dinamico"
    },
    {
      icon: Zap,
      title: "Tecnologie Moderne",
      description: "Usa le tecnologie più avanzate del settore"
    },
    {
      icon: Shield,
      title: "Work-Life Balance",
      description: "Flessibilità oraria e smart working"
    },
    {
      icon: Globe,
      title: "Crescita Internazionale",
      description: "Opportunità di crescita in un mercato globale"
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
              <Briefcase className="h-3 w-3" />
              Carriere
            </motion.div>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Unisciti al nostro{" "}
              <span className="text-primary">Team</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
              Costruisci il futuro del settore automotive con noi. 
              Cerchiamo talenti appassionati di tecnologia e innovazione.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors">
                <Briefcase className="h-5 w-5" />
                Vedi Posizioni Aperte
                <ArrowRight className="h-4 w-4" />
              </button>
              <button className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                <Users className="h-5 w-5" />
                Invia Candidatura Spontanea
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-16">
        <div className="rm-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-6xl mx-auto"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Posizioni Aperte
              </h2>
              <p className="text-lg text-gray-600">
                Scopri le opportunità di carriera disponibili
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {positions.map((position, i) => (
                <motion.div
                  key={position.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {position.title}
                      </h3>
                      <p className="text-primary font-medium">{position.department}</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                      {position.type}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4">
                    {position.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {position.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {position.type}
                    </div>
                  </div>
                  
                  <button className="w-full py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Candidati Ora
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-gray-50">
        <div className="rm-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-6xl mx-auto"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Perché Lavorare con Noi
              </h2>
              <p className="text-lg text-gray-600">
                I vantaggi di far parte del team RescueManager
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, i) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {benefit.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="rm-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-8 text-white">
              <h2 className="text-3xl font-bold mb-4">
                Non Vedi la Tua Posizione Ideale?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Invia una candidatura spontanea e raccontaci come puoi contribuire al nostro team
              </p>
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                <Users className="h-5 w-5" />
                Candidatura Spontanea
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
