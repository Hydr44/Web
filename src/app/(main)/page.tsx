"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  Clock, 
  FileText, 
  BarChart3, 
  ArrowRight, 
  CheckCircle2, 
  Star, 
  Shield,
  Monitor,
  Cloud,
  MessageCircle,
  Car,
  Receipt,
  Recycle
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { AlertCircle, X } from "lucide-react";

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (typeof window !== "undefined") {
        const hash = window.location.hash;
        
        if (hash.includes("access_token") || hash.includes("type=recovery")) {
          setProcessing(true);
          
          try {
            const supabase = supabaseBrowser();
            const { data, error } = await supabase.auth.getSession();
            
            if (error) {
              setShowError(true);
              setErrorMessage("Link non valido o scaduto. Richiedi un nuovo link di reset.");
              setProcessing(false);
              window.history.replaceState({}, document.title, window.location.pathname);
              return;
            }

            if (data.session) {
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

      const code = searchParams.get("code");
      
      if (code) {
        setProcessing(true);
        try {
          const supabase = supabaseBrowser();
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            setShowError(true);
            setErrorMessage("Link non valido o scaduto. Richiedi un nuovo link di reset.");
            setProcessing(false);
            return;
          }

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
    <main className="bg-gray-50">
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

      {/* Hero con screenshot */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Testo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold mb-6 border border-blue-200">
                <Star className="h-4 w-4" />
                Integrazioni governative certificate
              </div>
              
              <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Software completo per autodemolizioni
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Gestionale cloud con <strong>RVFU, SDI e RENTRI</strong> integrati.<br/>
                Desktop, web e mobile. Tutto sincronizzato in tempo reale.
              </p>
              
              <div className="flex flex-wrap gap-4 mb-10">
                <Link
                  href="/contatti"
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-blue-600/30"
                >
                  Prova gratis 30 giorni
                </Link>
                <Link
                  href="/prodotto"
                  className="px-8 py-4 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-900 font-semibold rounded-lg transition-colors"
                >
                  Guarda la demo
                </Link>
              </div>
              
              {/* Trust indicators */}
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Nessuna carta richiesta
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Setup incluso
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Supporto dedicato
                </div>
              </div>
            </motion.div>
            
            {/* Screenshot principale */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5">
                <Image
                  src="/mockups/dashboard-mockup.jpg"
                  alt="RescueManager Dashboard"
                  width={1200}
                  height={800}
                  priority
                  className="w-full h-auto"
                  quality={90}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Badge certificazioni */}
      <section className="bg-gray-50 py-12 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Integrazioni certificate</h3>
            <p className="text-lg text-gray-700">Conformi alle normative italiane</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6">
            <div className="inline-flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center text-blue-600 font-bold text-sm">ACI</div>
              <div>
                <div className="text-xs text-gray-500">Registro</div>
                <div className="font-bold text-gray-900">RVFU</div>
              </div>
            </div>
            
            <div className="inline-flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center text-green-600 font-bold text-sm">SDI</div>
              <div>
                <div className="text-xs text-gray-500">Agenzia Entrate</div>
                <div className="font-bold text-gray-900">FatturaPA</div>
              </div>
            </div>
            
            <div className="inline-flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center text-blue-600 font-bold text-sm">REN</div>
              <div>
                <div className="text-xs text-gray-500">Ministero</div>
                <div className="font-bold text-gray-900">RENTRI</div>
              </div>
            </div>
            
            <div className="inline-flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center text-green-600 font-bold text-sm">MIT</div>
              <div>
                <div className="text-xs text-gray-500">Trasporti</div>
                <div className="font-bold text-gray-900">Certificato</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Funzioni con screenshot */}
      <section id="funzioni" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Tre moduli, un solo gestionale
            </h2>
            <p className="text-lg text-gray-600">
              Soccorso, demolizioni e amministrazione lavorano insieme. Zero doppioni, massima efficienza.
            </p>
          </div>
          
          {/* Modulo 1: Soccorso */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
                Modulo Soccorso
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Dispatch e GPS in tempo reale
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Gestione chiamate, assegnazione autisti, tracking live. App mobile dedicata per i conducenti con rapportini digitali.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-gray-900">Mappa dispatch live</strong>
                    <p className="text-sm text-gray-600">Visualizza tutti i mezzi sulla mappa in tempo reale</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-gray-900">App mobile autisti</strong>
                    <p className="text-sm text-gray-600">iOS e Android con navigazione integrata</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-gray-900">Rapportini digitali</strong>
                    <p className="text-sm text-gray-600">Firma cliente, foto, note vocali</p>
                  </div>
                </li>
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center" style={{minHeight: "400px"}}>
                <div className="text-center p-8">
                  <div className="text-6xl mb-4">📸</div>
                  <div className="text-lg font-semibold text-gray-700 mb-2">SCREENSHOT DISPATCH</div>
                  <div className="text-sm text-gray-500">Mappa con mezzi in tempo reale</div>
                  <div className="text-xs text-gray-400 mt-2">Carica: /public/screenshots/dispatch-map.png</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Modulo 2: Demolizioni */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-1"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center" style={{minHeight: "400px"}}>
                <div className="text-center p-8">
                  <div className="text-6xl mb-4">📸</div>
                  <div className="text-lg font-semibold text-gray-700 mb-2">SCREENSHOT RVFU</div>
                  <div className="text-sm text-gray-500">Schermata radiazione veicolo</div>
                  <div className="text-xs text-gray-400 mt-2">Carica: /public/screenshots/rvfu-radiazione.png</div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="order-1 lg:order-2"
            >
              <div className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold mb-4">
                Modulo Demolizioni
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Radiazioni RVFU certificate
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Certificati di demolizione automatici, fascicolo digitale completo, integrazione diretta con ACI e invio a STA.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-gray-900">Certificati automatici</strong>
                    <p className="text-sm text-gray-600">Generazione PDF conforme normativa</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-gray-900">Ricerca PRA integrata</strong>
                    <p className="text-sm text-gray-600">Dati veicolo automatici da targa</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-gray-900">Invio automatico STA</strong>
                    <p className="text-sm text-gray-600">Comunicazione telematica certificata</p>
                  </div>
                </li>
              </ul>
            </motion.div>
          </div>

          {/* Modulo 3: Fatturazione */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
                Modulo Fatturazione
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                FatturaPA e SDI automatico
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                XML validato, invio automatico all'Agenzia delle Entrate, gestione incassi e solleciti. Bollo virtuale e ritenute d'acconto.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-gray-900">XML validato e conforme</strong>
                    <p className="text-sm text-gray-600">Controllo automatico prima dell'invio</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-gray-900">Invio SDI automatico</strong>
                    <p className="text-sm text-gray-600">Trasmissione sicura via SFTP certificato</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-gray-900">Gestione incassi</strong>
                    <p className="text-sm text-gray-600">Scadenzario, solleciti automatici, prima nota</p>
                  </div>
                </li>
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center" style={{minHeight: "400px"}}>
                <div className="text-center p-8">
                  <div className="text-6xl mb-4">📸</div>
                  <div className="text-lg font-semibold text-gray-700 mb-2">SCREENSHOT FATTURE</div>
                  <div className="text-sm text-gray-500">Lista fatture con stato SDI</div>
                  <div className="text-xs text-gray-400 mt-2">Carica: /public/screenshots/fatture-sdi.png</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Vantaggi vs competitor */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Perché scegliere RescueManager
            </h2>
            <p className="text-lg text-gray-600">
              Non il solito gestionale desktop. Una piattaforma moderna e completa.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Monitor, title: "Multi-piattaforma", desc: "Desktop Windows, Web browser, App iOS/Android" },
              { icon: Cloud, title: "Cloud sicuro", desc: "Backup automatici, accesso ovunque, sempre aggiornato" },
              { icon: Shield, title: "Certificato", desc: "Integrazioni governative validate e conformi" },
              { icon: MessageCircle, title: "Supporto dedicato", desc: "Onboarding incluso, assistenza telefonica e remota" }
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-8 rounded-2xl border border-gray-200 bg-white hover:border-blue-600 hover:shadow-lg transition-all text-center"
              >
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Perché RescueManager
            </h2>
            <p className="text-lg text-gray-600">
              Costruito da chi conosce il settore, per chi ci lavora ogni giorno
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "RVFU", label: "Radiazioni integrate", Icon: Car, desc: "Radia i veicoli direttamente dal gestionale" },
              { value: "SDI", label: "Fatture elettroniche", Icon: Receipt, desc: "Invio automatico all'Agenzia delle Entrate" },
              { value: "RENTRI", label: "Registro rifiuti", Icon: Recycle, desc: "Tracciabilità rifiuti a norma di legge" },
              { value: "24/7", label: "Sempre disponibile", Icon: Cloud, desc: "Cloud, accessibile da qualsiasi dispositivo" }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-6 rounded-2xl border border-gray-200 bg-white hover:border-blue-600 hover:shadow-lg transition-all"
              >
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center bg-blue-100">
                    <stat.Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold mb-1 text-gray-900">{stat.value}</div>
                  <div className="text-sm font-semibold text-gray-900 mb-1">{stat.label}</div>
                  <div className="text-xs text-gray-600">{stat.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA finale */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">
            Pronto a modernizzare la tua autodemolizione?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Prova RescueManager gratis per 30 giorni. Setup incluso, supporto dedicato, nessuna carta richiesta.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            <Link
              href="/contatti"
              className="px-10 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-xl"
            >
              Inizia la prova gratuita
            </Link>
            <Link
              href="/prodotto"
              className="px-10 py-4 bg-blue-700 hover:bg-blue-800 border-2 border-white/20 text-white font-bold rounded-lg transition-colors"
            >
              Parla con un esperto
            </Link>
          </div>
          <div className="flex items-center justify-center gap-8 text-sm text-blue-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              30 giorni gratis
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Setup incluso
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Disdici quando vuoi
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

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
