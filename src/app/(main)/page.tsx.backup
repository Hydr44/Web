"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { SmoothScrollLink } from "@/components/SmoothScrollLink";
import { BackToTopButton } from "@/components/BackToTopButton";
import { 
  Clock, 
  FileText, 
  BarChart3, 
  ArrowRight, 
  CheckCircle2, 
  Star, 
  Zap, 
  Shield, 
  Users,
  TrendingUp,
  Award,
  AlertCircle,
  X,
  Car,
  Receipt,
  Recycle,
  Cloud
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

function HomeContent() {
  const shouldReduceMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Gestione hash fragment (#access_token=... o #code=...)
      if (typeof window !== "undefined") {
        const hash = window.location.hash;
        
        // Controlla se c'è access_token o type=recovery nell'hash
        if (hash.includes("access_token") || hash.includes("type=recovery")) {
          setProcessing(true);
          
          try {
            const supabase = supabaseBrowser();
            
            // Supabase gestisce automaticamente gli hash fragments
            const { data, error } = await supabase.auth.getSession();
            
            if (error) {
              setShowError(true);
              setErrorMessage("Link non valido o scaduto. Richiedi un nuovo link di reset.");
              setProcessing(false);
              // Pulisci hash dalla URL
              window.history.replaceState({}, document.title, window.location.pathname);
              return;
            }

            // Se c'è una sessione e il tipo è recovery, redirect a update-password
            if (data.session) {
              // Pulisci hash prima del redirect
              window.history.replaceState({}, document.title, window.location.pathname);
              router.push("/update-password");
              return;
            }
          } catch (err) {
            console.error("Errore processamento hash:", err);
            setShowError(true);
            setErrorMessage("Errore nel processamento del link. Riprova.");
            setProcessing(false);
            window.history.replaceState({}, document.title, window.location.pathname);
          }
          return;
        }
      }

      // Gestione code per reset password (query parameter)
      const code = searchParams.get("code");
      
      if (code) {
        setProcessing(true);
        try {
          const supabase = supabaseBrowser();
          
          // Scambia il code con una sessione
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            setShowError(true);
            setErrorMessage("Link non valido o scaduto. Richiedi un nuovo link di reset.");
            setProcessing(false);
            return;
          }

          // Code valido, redirect a update-password
          if (data.session) {
            router.push("/update-password");
            return;
          }
        } catch (err) {
          console.error("Errore processamento code:", err);
          setShowError(true);
          setErrorMessage("Errore nel processamento del link. Riprova.");
          setProcessing(false);
        }
        return;
      }

      // Gestione errori URL
      const error = searchParams.get("error");
      const errorCode = searchParams.get("error_code");
      const errorDescription = searchParams.get("error_description");

      if (error || errorCode) {
        setShowError(true);
        
        if (errorCode === "otp_expired") {
          setErrorMessage("Il link di reset password è scaduto o non valido. Richiedi un nuovo link.");
        } else if (errorDescription) {
          setErrorMessage(decodeURIComponent(errorDescription));
        } else {
          setErrorMessage("Si è verificato un errore. Riprova.");
        }
      }
    };

    handleAuthCallback();
  }, [searchParams, router]);
  
  // Mostra loading durante processamento code
  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verifica link in corso...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="hero-bg">
      {/* Error Banner */}
      {showError && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-2xl w-full mx-4"
        >
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-1">Errore Reset Password</h3>
              <p className="text-sm text-red-700">{errorMessage}</p>
              <Link 
                href="/reset"
                className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-800 mt-2"
              >
                Richiedi nuovo link <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <button
              onClick={() => setShowError(false)}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* HERO */}
      <section id="hero" className="relative overflow-hidden pt-18 md:pt-24 pb-20 md:pb-28 bg-white">
        {/* Background elements */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        {/* scrim per leggibilità del testo */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[460px] md:h-[560px]
                     bg-gradient-to-r from-background/96 via-background/82 to-background/0"
        />

        <div className="rm-container relative z-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 text-xs rounded-full px-3 py-1.5 mb-6 bg-slate-100 text-slate-700 font-medium border border-slate-200">
                <Zap className="h-3.5 w-3.5" />
              Il gestionale per chi demolisce e soccorre
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900">
                Dalla confisca alla radiazione,{" "}
                <span className="text-primary">
                  tutto in un click
                </span>
            </h1>

              <p className="mt-6 text-lg text-gray-600 max-w-2xl leading-relaxed">
              Soccorso stradale, demolizioni, radiazioni RVFU, fatturazione elettronica SDI e registro RENTRI —
                un unico software che ti segue dalla chiamata fino all&apos;ultimo documento.
            </p>

            {/* Value bullets */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: Clock, text: "Soccorso e dispatch" },
                  { icon: FileText, text: "Radiazioni RVFU" },
                  { icon: BarChart3, text: "Fatturazione SDI" },
                ].map((bullet) => (
                  <div
                    key={bullet.text}
                    className="flex items-center gap-3 text-sm text-gray-700"
                  >
                    <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
                      <bullet.icon className="h-4 w-4" />
                    </div>
                    <span>{bullet.text}</span>
                  </div>
                ))}
              </div>

            {/* CTA */}
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/contatti"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
                >
                  Richiedi demo gratuita
                  <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                  href="/prodotto"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-gray-300 bg-white text-gray-900 font-semibold hover:bg-gray-50 transition-colors"
              >
                  Scopri i moduli
              </Link>
              </div>

            {/* Trust line */}
              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><Shield className="h-3 w-3" /> Integrazioni governative</span>
                <span className="flex items-center gap-1.5"><Award className="h-3 w-3" /> Made in Italy</span>
                <span className="flex items-center gap-1.5"><TrendingUp className="h-3 w-3" /> In sviluppo attivo</span>
              </div>
            </motion.div>

            {/* Right visual */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative"
            >
        {/* mockup tappeto: arrotondato + fade top/right/bottom */}
              <div className="pointer-events-none relative mx-auto w-[1200px] max-w-none rounded-[28px] md:rounded-[32px] overflow-hidden ring-1 ring-black/5 shadow-2xl">
            <Image
              src="/mockups/dashboard-mockup.jpg"
              alt="RescueManager Dashboard"
              width={2400}
              height={1200}
              priority
              loading="eager"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              className="w-full h-auto object-cover"
              quality={85}
            />
            {/* Fades di fusione */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/0 to-transparent" />
            <div className="absolute inset-y-0 right-0 w-72 md:w-[28rem] bg-gradient-to-l from-background/80 via-background/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-28 md:h-32 bg-gradient-to-t from-background/65 via-background/30 to-transparent" />
              </div>
              
            </motion.div>
          </div>
        </div>
      </section>

      {/* PARTNERSHIP & INTEGRAZIONI */}
      <section id="integrations" className="py-16 bg-gray-50">
        <div className="rm-container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Integrato con chi conta</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Collegato direttamente ai sistemi governativi italiani per demolizioni, rifiuti e fatturazione
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-items-center">
            {/* ACI */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white shadow-sm border border-slate-200 hover:border-slate-300 transition-colors"
            >
              <div className="w-20 h-20 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200 p-3">
                <Image 
                  src="/21-9_1320x566_1977.jpg" 
                  alt="ACI Automobile Club Italia" 
                  width={56} 
                  height={56} 
                  className="object-contain"
                />
              </div>
              <div className="text-center">
                <span className="text-sm font-semibold text-gray-900">Automobile Club</span>
                <div className="text-xs text-gray-600">Italia</div>
              </div>
            </motion.div>

            {/* Registro Rentri */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white shadow-sm border border-slate-200 hover:border-slate-300 transition-colors"
            >
              <div className="w-20 h-20 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200 p-3">
                <Image 
                  src="/logo-rentri.png" 
                  alt="Registro Rentri" 
                  width={56} 
                  height={56} 
                  className="object-contain"
                />
              </div>
              <div className="text-center">
                <span className="text-sm font-semibold text-gray-900">RENTRI</span>
                <div className="text-xs text-gray-600">Tracciabilità Rifiuti</div>
              </div>
            </motion.div>

            {/* Agenzia Entrate */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white shadow-sm border border-slate-200 hover:border-slate-300 transition-colors"
            >
              <div className="w-20 h-20 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200 p-3">
                <Image 
                  src="/download.jpg" 
                  alt="Agenzia delle Entrate" 
                  width={56} 
                  height={56} 
                  className="object-contain"
                />
              </div>
              <div className="text-center">
                <span className="text-sm font-semibold text-gray-900">Fatturazione</span>
                <div className="text-xs text-gray-600">Elettronica</div>
              </div>
            </motion.div>

            {/* Plus icon for more */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white shadow-sm border border-slate-200 hover:border-slate-300 transition-colors"
            >
              <div className="w-20 h-20 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200">
                <svg width="40" height="40" viewBox="0 0 40 40" className="text-gray-400">
                  <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="2"/>
                  <path d="M20 12 L20 28 M12 20 L28 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="text-center">
                <span className="text-sm font-semibold text-gray-900">Altre</span>
                <div className="text-xs text-gray-600">integrazioni</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FEATURE GRID */}
      <section id="features" className="py-16 md:py-20 bg-white">
        <div className="rm-container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Tre anime, un solo software</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Soccorso stradale, autodemolizioni e amministrazione: tutto gira insieme, senza doppi inserimenti
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: Clock, 
                title: "Soccorso & Trasporti", 
                desc: "Dispatch su mappa, autisti, rapportini con foto e firma, GPS.",
                features: ["Dispatch in tempo reale", "App mobile autisti", "Rapportini digitali", "Calendario turni"]
              },
              { 
                icon: FileText, 
                title: "Demolizioni & RVFU", 
                desc: "Radiazioni, certificati di demolizione, fascicolo digitale del veicolo.",
                features: ["Radiazione veicoli", "Certificato demolizione", "Ricerca PRA", "Invio a STA"]
              },
              { 
                icon: BarChart3, 
                title: "Fatture & SDI", 
                desc: "Fatturazione elettronica XML, invio SDI, incassi e solleciti.",
                features: ["FatturaPA XML", "Invio automatico SDI", "Gestione incassi", "Bollo e ritenute"]
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-8 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-slate-900 text-white">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.desc}</p>
                  </div>
                </div>
                
                <ul className="space-y-3">
                  {feature.features.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-slate-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
            </motion.div>
          ))}
          </div>
        </div>
      </section>

      {/* SEZIONE PRODOTTO */}
      <section id="product" className="py-16 md:py-20 bg-white">
        <div className="rm-container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl bg-gray-50 p-8 md:p-12 shadow-xl border border-gray-200 overflow-hidden"
          >
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="inline-flex items-center gap-2 text-xs rounded-full px-3 py-1.5 mb-6 bg-slate-100 text-slate-700 font-medium border border-slate-200"
                >
                  <Shield className="h-3.5 w-3.5" />
                  Tutto il ciclo, zero carta
                </motion.div>
                
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Confische, sequestri e deposito{" "}
                  <span className="text-primary">
                    sotto controllo
                  </span>
                </h2>
                
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Registro auto in deposito giudiziario, confische e sequestri tracciati, 
                scadenze automatiche e documentazione sempre pronta per le autorità.
              </p>
                
                <ul className="space-y-4 mb-8">
                  {[
                    { icon: Clock, text: "Registro deposito giudiziario" },
                    { icon: Shield, text: "Confische e sequestri tracciati" },
                    { icon: BarChart3, text: "Scadenze e alert automatici" },
                  ].map((item, i) => (
                    <motion.li
                      key={item.text}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
                      className="flex items-center gap-3 text-gray-700"
                    >
                      <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span>{item.text}</span>
                    </motion.li>
                  ))}
              </ul>
                
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="flex flex-wrap gap-4"
                >
                  <SmoothScrollLink 
                    href="#product" 
                    className="group inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all duration-300"
                  >
                  Vedi i moduli
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </SmoothScrollLink>
                  <Link 
                    href="/contatti" 
                    className="inline-flex items-center gap-2 px-6 py-4 rounded-xl ring-2 ring-gray-200 bg-white text-gray-900 font-semibold hover:bg-gray-50 hover:ring-gray-300 transition-all duration-300"
                  >
                    <Star className="h-4 w-4" />
                  Parla con noi
                </Link>
                </motion.div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="relative"
              >
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <Image 
                    src="/670shots_so.png" 
                    alt="RescueManager Desktop App - Gestione flotta e turni" 
                    width={600} 
                    height={400} 
                    className="w-full h-auto object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
              </div>
                
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section id="stats" className="py-16 bg-gray-50">
        <div className="rm-container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Perché RescueManager</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Costruito da chi conosce il settore, per chi ci lavora ogni giorno
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { 
                value: "RVFU", 
                label: "Radiazioni integrate", 
                Icon: Car,
                description: "Radia i veicoli direttamente dal gestionale"
              },
              { 
                value: "SDI", 
                label: "Fatture elettroniche", 
                Icon: Receipt,
                description: "Invio automatico all'Agenzia delle Entrate"
              },
              { 
                value: "RENTRI", 
                label: "Registro rifiuti", 
                Icon: Recycle,
                description: "Tracciabilità rifiuti a norma di legge"
              },
              { 
                value: "24/7", 
                label: "Sempre disponibile", 
                Icon: Cloud,
                description: "Cloud, accessibile da qualsiasi dispositivo"
              },
            ].map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg transition-all"
              >
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center bg-slate-100">
                    <stat.Icon className="h-6 w-6 text-slate-700" />
                  </div>
                  <div className="text-2xl font-bold mb-1 text-gray-900">
                    {stat.value}
                  </div>
                  <div className="text-sm font-semibold text-gray-900 mb-1">{stat.label}</div>
                  <div className="text-xs text-gray-600">{stat.description}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 bg-white">
        <div className="rm-container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Domande frequenti</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Le risposte alle domande più comuni su RescueManager
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                q: "A chi è rivolto RescueManager?",
                a: "Ad autodemolizioni, centri di soccorso stradale e depositi giudiziari che vogliono digitalizzare tutto: dalla chiamata alla radiazione, dalla fattura al registro rifiuti.",
                icon: Users
              },
              {
                q: "Serve installazione?",
                a: "No. RescueManager funziona da browser e ha anche un'app desktop dedicata per Windows e Mac. Per gli autisti c'è l'app mobile.",
                icon: Zap
              },
              {
                q: "Posso usare solo il modulo RVFU o solo la fatturazione?",
                a: "Certo. Puoi attivare i moduli specializzati (RVFU, SDI, RENTRI) singolarmente oppure prendere il pacchetto completo.",
                icon: Shield
              },
              {
                q: "I dati sono al sicuro?",
                a: "Sì. Infrastruttura cloud europea, backup automatici, crittografia e conformità GDPR.",
                icon: Shield
              },
              {
                q: "Come funziona la fatturazione elettronica?",
                a: "Crei la fattura nel gestionale, la validiamo in automatico e la inviamo direttamente al Sistema di Interscambio (SDI) dell'Agenzia delle Entrate.",
                icon: BarChart3
              },
              {
                q: "L'app è già completa?",
                a: "RescueManager è in sviluppo attivo. I moduli principali sono funzionanti e ne aggiungiamo di nuovi ogni mese. Contattaci per sapere lo stato attuale.",
                icon: TrendingUp
              }
            ].map((faq, i) => (
              <motion.div
                key={faq.q}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="rounded-2xl border border-slate-200 p-6 bg-white hover:border-slate-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                    <faq.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                  </div>
            </div>
              </motion.div>
            ))}
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-center mt-12"
          >
            <Link 
              href="/contatti" 
              className="group inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors duration-200"
            >
              Altre domande? Contattaci
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* PRICING PREVIEW */}
      <section id="pricing" className="py-16 bg-white">
        <div className="rm-container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Un gestionale, tanti moduli</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Scegli il pacchetto completo o attiva solo i moduli che ti servono: RVFU, fatturazione SDI o RENTRI
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                title: "Modulo RVFU",
                desc: "Radiazioni veicoli, certificati di demolizione, fascicolo digitale, invio a STA.",
                icon: Shield
              },
              {
                title: "Modulo Fatturazione SDI",
                desc: "Fatture elettroniche XML, invio automatico SDI, incassi, bollo e ritenute.",
                icon: FileText
              },
              {
                title: "Modulo RENTRI",
                desc: "Registro nazionale tracciabilità rifiuti, formulari, registri di carico/scarico.",
                icon: BarChart3
              }
            ].map((mod, i) => (
              <motion.div
                key={mod.title}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-8 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg transition-all"
              >
                <div className="p-3 rounded-xl w-fit mb-4 bg-slate-900 text-white">
                  <mod.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{mod.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{mod.desc}</p>
              </motion.div>
            ))}
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center mt-10"
          >
            <p className="text-gray-600 mb-4">Tutti e tre i moduli sono inclusi nel pacchetto completo, oppure attivabili singolarmente.</p>
            <Link 
              href="/contatti" 
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
            >
              Richiedi info e prezzi
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* TESTIMONIAL + CTA */}
      <section id="cta" className="py-16 bg-gray-50">
        <div className="rm-container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl bg-primary p-8 md:p-12 text-white overflow-hidden"
          >
            
            <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  Fatto da chi ci lavora, per chi ci lavora
                </h3>
                <p className="text-lg text-white/80 leading-relaxed">
                  Un software pensato da chi sa cosa vuol dire gestire confische, radiazioni e soccorsi 
                  tutti i giorni. Niente fronzoli, solo quello che serve davvero.
                </p>
              </div>
              
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col gap-4"
              >
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  Pronto a iniziare?
                </h3>
                <p className="text-lg text-white/90 mb-6">
                  Scopri come RescueManager può semplificare la gestione della tua attività, dalla prima chiamata all'ultimo documento.
                </p>
                
                <div className="flex flex-col gap-4">
                  <Link
                    href="/contatti"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-primary font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Richiedi una demo gratuita
                    <ArrowRight className="h-4 w-4" />
            </Link>
                  <Link
                    href="/prodotto"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10 transition-colors"
                  >
                    Scopri i moduli
                  </Link>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-white/80 mt-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Demo gratuita</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Setup incluso</span>
                  </div>
                </div>
              </motion.div>
          </div>
          </motion.div>
        </div>
      </section>
      
      {/* Back to top button */}
      <BackToTopButton />
    </main>
  );
}

// Wrapper con Suspense per useSearchParams
export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}