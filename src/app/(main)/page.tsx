"use client";

import Link from "next/link";
import Image from "next/image";
import { 
  ArrowRight, 
  CheckCircle2, 
  Phone,
  Shield,
  Monitor,
  Headphones,
  Receipt,
  Recycle,
  Clock,
  AlertCircle,
  X
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

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
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verifica link in corso...</p>
        </div>
      </div>
    );
  }

  return (
    <main>
      {/* Error Banner */}
      {showError && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-2xl w-full mx-4">
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
        </div>
      )}

      {/* ============================================ */}
      {/* HERO — Diretto, pratico, con screenshot vero */}
      {/* ============================================ */}
      <section className="bg-white pt-28 pb-16 lg:pt-32 lg:pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-5 leading-tight">
                Il gestionale per chi lavora<br className="hidden lg:block" /> nel soccorso e nelle demolizioni
              </h1>
              
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Trasporti, piazzale, clienti, fatture, RVFU, RENTRI — tutto in un unico programma. 
                Funziona su PC, dal browser e dal telefono.
              </p>
              
              <div className="flex flex-wrap gap-3 mb-8">
                <Link
                  href="/contatti"
                  className="px-7 py-3.5 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Richiedi una dimostrazione
                </Link>
                <Link
                  href="tel:+393921723028"
                  className="px-7 py-3.5 bg-white border border-gray-300 hover:border-gray-400 text-gray-800 font-semibold rounded-lg transition-colors flex items-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  Chiamaci
                </Link>
              </div>
              
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                  Prova gratuita 30 giorni
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                  Installazione inclusa
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                  Assistenza telefonica
                </span>
              </div>
            </div>
            
            <div className="relative">
              <div className="rounded-xl overflow-hidden shadow-xl border border-gray-200">
                <Image
                  src="/appshots/dashboard.jpg"
                  alt="Schermata principale RescueManager"
                  width={1200}
                  height={800}
                  priority
                  className="w-full h-auto"
                  quality={90}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* CERTIFICAZIONI — Sobrio, istituzionale       */}
      {/* ============================================ */}
      <section className="bg-gray-50 py-10 border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-14">
            <span className="text-sm text-gray-400 uppercase tracking-wider font-medium">Integrazioni certificate:</span>
            <div className="flex items-center gap-2">
              <Image
                src="/icons/icons8/icons8-auto-50-10.png"
                alt="RVFU"
                width={20}
                height={20}
              />
              <span className="font-semibold text-gray-800">RVFU</span>
              <span className="text-xs text-gray-500">Ministero Trasporti</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#2563EB]" />
              <span className="font-semibold text-gray-800">SDI</span>
              <span className="text-xs text-gray-500">Agenzia delle Entrate</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#10B981]" />
              <span className="font-semibold text-gray-800">RENTRI</span>
              <span className="text-xs text-gray-500">Registro Rifiuti</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* COSA FA — Screenshot reali + testo pratico   */}
      {/* ============================================ */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Cosa fa RescueManager
            </h2>
            <p className="text-gray-600">
              Un programma unico per gestire tutta l&apos;attività: dal soccorso stradale alla demolizione, dalla fattura al registro rifiuti.
            </p>
          </div>
          
          {/* Blocco 1: Trasporti */}
          <div className="grid lg:grid-cols-2 gap-10 items-center mb-16 lg:mb-20">
            <div>
              <span className="inline-block text-sm font-semibold text-[#2563EB] mb-3">Gestione Trasporti</span>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Chiamate, autisti e mezzi sotto controllo
              </h3>
              <p className="text-gray-600 mb-5">
                Ricevi la chiamata, assegni il trasporto, l&apos;autista riceve tutto sul telefono. 
                Sai sempre dove sono i tuoi mezzi e a che punto è ogni lavoro.
              </p>
              <ul className="space-y-2.5">
                {[
                  "Assegnazione trasporti con un click",
                  "App per gli autisti (Android e iPhone)",
                  "Calendario e mappa in tempo reale",
                  "Rapportino digitale con firma del cliente"
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-[#2563EB] mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200">
              <Image
                src="/appshots/trasporti.jpg"
                alt="Gestione trasporti RescueManager"
                width={800}
                height={500}
                className="w-full h-auto"
                quality={85}
              />
            </div>
          </div>

          {/* Blocco 2: Piazzale e Veicoli */}
          <div className="grid lg:grid-cols-2 gap-10 items-center mb-16 lg:mb-20">
            <div className="order-2 lg:order-1 rounded-xl overflow-hidden shadow-lg border border-gray-200">
              <Image
                src="/appshots/piazzale.jpg"
                alt="Gestione piazzale RescueManager"
                width={800}
                height={500}
                className="w-full h-auto"
                quality={85}
              />
            </div>
            <div className="order-1 lg:order-2">
              <span className="inline-block text-sm font-semibold text-[#10B981] mb-3">Piazzale e Veicoli</span>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Ogni veicolo tracciato dal primo giorno
              </h3>
              <p className="text-gray-600 mb-5">
                Dal momento in cui un veicolo entra nel piazzale, hai tutto sotto controllo: 
                documenti, foto, stato della pratica, scadenze.
              </p>
              <ul className="space-y-2.5">
                {[
                  "Scheda veicolo completa con foto e documenti",
                  "Stato pratica sempre aggiornato",
                  "Scadenze e promemoria automatici",
                  "Ricerca rapida per targa o proprietario"
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-[#10B981] mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Blocco 3: Clienti */}
          <div className="grid lg:grid-cols-2 gap-10 items-center mb-16 lg:mb-20">
            <div>
              <span className="inline-block text-sm font-semibold text-[#2563EB] mb-3">Clienti e Anagrafica</span>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Tutti i tuoi clienti in un posto solo
              </h3>
              <p className="text-gray-600 mb-5">
                Anagrafica completa, storico trasporti, fatture emesse, veicoli associati. 
                Cerchi un cliente e trovi tutto quello che gli riguarda.
              </p>
              <ul className="space-y-2.5">
                {[
                  "Anagrafica clienti e fornitori",
                  "Storico completo per ogni cliente",
                  "Collegamento automatico a trasporti e fatture",
                  "Import da file Excel o CSV"
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-[#2563EB] mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200">
              <Image
                src="/appshots/clienti.jpg"
                alt="Gestione clienti RescueManager"
                width={800}
                height={500}
                className="w-full h-auto"
                quality={85}
              />
            </div>
          </div>

          {/* Blocco 4: Preventivi */}
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="order-2 lg:order-1 rounded-xl overflow-hidden shadow-lg border border-gray-200">
              <Image
                src="/appshots/preventivo.jpg"
                alt="Preventivi RescueManager"
                width={800}
                height={500}
                className="w-full h-auto"
                quality={85}
              />
            </div>
            <div className="order-1 lg:order-2">
              <span className="inline-block text-sm font-semibold text-[#10B981] mb-3">Preventivi</span>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Preventivi pronti in pochi minuti
              </h3>
              <p className="text-gray-600 mb-5">
                Crei il preventivo, lo mandi al cliente via email o WhatsApp, 
                e quando accetta lo trasformi in fattura con un click.
              </p>
              <ul className="space-y-2.5">
                {[
                  "Creazione rapida con listino prezzi",
                  "Invio diretto via email o WhatsApp",
                  "Conversione in fattura automatica",
                  "PDF professionale con il tuo logo"
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-[#10B981] mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* MODULI SPECIALIZZATI — Le cose serie          */}
      {/* ============================================ */}
      <section className="py-16 lg:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Moduli specializzati per il settore
            </h2>
            <p className="text-gray-600">
              Integrazioni dirette con gli enti governativi. Niente copia-incolla, niente doppio lavoro.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* RVFU */}
            <div className="bg-white rounded-xl border border-gray-200 p-7 hover:shadow-md transition-shadow">
              <div className="w-11 h-11 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <Image
                  src="/icons/icons8/icons8-auto-50-10.png"
                  alt="RVFU"
                  width={20}
                  height={20}
                />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Radiazioni RVFU</h3>
              <p className="text-sm text-gray-600 mb-4">
                Collegamento diretto al Ministero dei Trasporti. 
                Radi il veicolo dal gestionale senza passare da altri portali.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#2563EB] flex-shrink-0" />
                  Certificato di demolizione automatico
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#2563EB] flex-shrink-0" />
                  Ricerca dati veicolo da targa
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#2563EB] flex-shrink-0" />
                  Invio telematico a STA
                </li>
              </ul>
            </div>

            {/* SDI */}
            <div className="bg-white rounded-xl border border-gray-200 p-7 hover:shadow-md transition-shadow">
              <div className="w-11 h-11 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <Receipt className="h-5 w-5 text-[#2563EB]" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Fatturazione Elettronica</h3>
              <p className="text-sm text-gray-600 mb-4">
                Crei la fattura, il sistema genera l&apos;XML e lo invia all&apos;Agenzia delle Entrate. 
                Ricevi le notifiche di consegna in automatico.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#2563EB] flex-shrink-0" />
                  Invio automatico via SDI
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#2563EB] flex-shrink-0" />
                  Bollo, ritenuta, cassa previdenziale
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#2563EB] flex-shrink-0" />
                  Scadenzario e solleciti
                </li>
              </ul>
            </div>

            {/* RENTRI */}
            <div className="bg-white rounded-xl border border-gray-200 p-7 hover:shadow-md transition-shadow">
              <div className="w-11 h-11 bg-green-50 rounded-lg flex items-center justify-center mb-4">
                <Recycle className="h-5 w-5 text-[#10B981]" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Registro RENTRI</h3>
              <p className="text-sm text-gray-600 mb-4">
                Registro di carico e scarico rifiuti, formulari, 
                trasmissione dati al registro nazionale. Tutto integrato.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981] flex-shrink-0" />
                  Registro carico/scarico digitale
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981] flex-shrink-0" />
                  Formulari di trasporto rifiuti
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981] flex-shrink-0" />
                  Trasmissione automatica al ministero
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* PERCHÉ NOI — Concreto, da fornitore serio    */}
      {/* ============================================ */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Perché le autodemolizioni scelgono noi
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                icon: Monitor, 
                title: "Funziona ovunque", 
                desc: "PC Windows, browser web, app sul telefono. I tuoi dati sono sempre con te." 
              },
              { 
                icon: Headphones, 
                title: "Assistenza vera", 
                desc: "Ti rispondiamo al telefono. Ti aiutiamo con l'installazione e la formazione." 
              },
              { 
                icon: Shield, 
                title: "Dati al sicuro", 
                desc: "Backup automatici ogni giorno. I tuoi dati sono protetti e sempre disponibili." 
              },
              { 
                icon: Clock, 
                title: "Sempre aggiornato", 
                desc: "Aggiornamenti automatici. Quando cambiano le normative, il software si adegua." 
              }
            ].map((item) => (
              <div
                key={item.title}
                className="p-6 rounded-xl border border-gray-200 bg-white"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <item.icon className="h-5 w-5 text-gray-700" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1.5">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* NUMERI — Credibilità                         */}
      {/* ============================================ */}
      <section className="py-14 bg-gray-50 border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-1">4</div>
              <div className="text-sm text-gray-500">Integrazioni governative</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-1">3</div>
              <div className="text-sm text-gray-500">Piattaforme (PC, Web, Mobile)</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-1">100%</div>
              <div className="text-sm text-gray-500">Made in Italy</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-1">24/7</div>
              <div className="text-sm text-gray-500">Accesso ai tuoi dati</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* COME FUNZIONA — Semplice, 3 step             */}
      {/* ============================================ */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Come iniziare
            </h2>
            <p className="text-gray-600">
              Ti seguiamo noi in tutto. Non devi essere un esperto di computer.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#2563EB] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">1</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Ci chiami o ci scrivi</h3>
              <p className="text-sm text-gray-600">
                Ti facciamo vedere il programma con una dimostrazione gratuita. Nessun impegno.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[#2563EB] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">2</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Ti installiamo tutto noi</h3>
              <p className="text-sm text-gray-600">
                Configuriamo il programma sul tuo PC, importiamo i tuoi dati e ti facciamo la formazione.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[#10B981] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">3</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Inizi a lavorare</h3>
              <p className="text-sm text-gray-600">
                Provi gratis per 30 giorni. Se non ti convince, non paghi nulla. Nessun vincolo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* CTA FINALE — Diretto, con telefono           */}
      {/* ============================================ */}
      <section className="py-16 lg:py-20 bg-[#2563EB]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Vuoi vedere come funziona?
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            Ti facciamo una dimostrazione gratuita senza impegno. 
            Chiamaci o compila il modulo e ti ricontattiamo noi.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mb-6">
            <Link
              href="/contatti"
              className="px-8 py-3.5 bg-white text-[#2563EB] font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Richiedi dimostrazione gratuita
            </Link>
            <Link
              href="tel:+393921723028"
              className="px-8 py-3.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 border border-blue-500"
            >
              <Phone className="h-4 w-4" />
              392 172 3028
            </Link>
          </div>
          <p className="text-sm text-blue-200">
            Prova gratuita 30 giorni &middot; Installazione inclusa &middot; Nessun vincolo
          </p>
        </div>
      </section>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
