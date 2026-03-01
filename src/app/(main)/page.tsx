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
      {/* HERO — Bold Split: Navy left, Blue right     */}
      {/* ============================================ */}
      <section className="pt-16">
        <div className="grid lg:grid-cols-2 min-h-[90vh]">
          {/* Left: Dark */}
          <div className="flex items-center px-6 lg:px-12 xl:px-20 py-20 bg-[#0f172a]">
            <div className="max-w-lg">
              <div className="inline-block bg-blue-500/10 border border-blue-500/20 rounded px-3 py-1 text-xs text-blue-400 font-semibold uppercase tracking-wider mb-8">
                Certificato RVFU / SDI / RENTRI
              </div>
              <h1 className="text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-[1.05]">
                Gestisci.<br />
                Demolisci.<br />
                <span className="text-blue-500">Fattura.</span>
              </h1>
              <p className="text-lg text-slate-400 mb-10 leading-relaxed">
                Trasporti, piazzale, clienti, fatture, RVFU, RENTRI. 
                Un programma. Zero complicazioni.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/contatti"
                  className="px-7 py-4 bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors"
                >
                  RICHIEDI DEMO
                </Link>
                <Link
                  href="tel:+393921723028"
                  className="px-7 py-4 border-2 border-slate-700 text-white font-bold text-sm hover:border-blue-500 transition-colors flex items-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  CHIAMACI
                </Link>
              </div>
            </div>
          </div>
          {/* Right: Blue with screenshot */}
          <div className="flex items-center justify-center px-6 lg:px-12 py-20 bg-blue-600">
            <div className="w-full max-w-md rounded-lg overflow-hidden border border-white/20 shadow-2xl">
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
      </section>

      {/* ============================================ */}
      {/* CERTIFICAZIONI — Navy bar, bold                */}
      {/* ============================================ */}
      <section className="py-6 bg-[#0f172a] border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-center gap-8 text-sm">
          <span className="font-bold text-white">RVFU</span>
          <span className="text-slate-700">/</span>
          <span className="font-bold text-white">SDI</span>
          <span className="text-slate-700">/</span>
          <span className="font-bold text-white">RENTRI</span>
          <span className="text-slate-700">/</span>
          <span className="text-slate-500">Tutte le certificazioni governative</span>
        </div>
      </section>

      {/* ============================================ */}
      {/* COSA FA — Bold Split style                    */}
      {/* ============================================ */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl lg:text-5xl font-extrabold text-[#0f172a] mb-16">
            Cosa fa<span className="text-blue-500">.</span>
          </h2>
          
          {/* Blocco 1: Trasporti */}
          <div className="grid lg:grid-cols-2 gap-10 items-center mb-16 lg:mb-20">
            <div>
              <span className="text-6xl font-extrabold text-blue-500/20">01</span>
              <h3 className="text-2xl font-extrabold text-[#0f172a] mb-3 -mt-4">
                Chiamate, autisti e mezzi sotto controllo
              </h3>
              <p className="text-gray-500 mb-5">
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
                  <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg overflow-hidden shadow-lg border-2 border-[#0f172a]">
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
            <div className="order-2 lg:order-1 rounded-lg overflow-hidden shadow-lg border-2 border-[#0f172a]">
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
              <span className="text-6xl font-extrabold text-blue-500/20">02</span>
              <h3 className="text-2xl font-extrabold text-[#0f172a] mb-3 -mt-4">
                Ogni veicolo tracciato dal primo giorno
              </h3>
              <p className="text-gray-500 mb-5">
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
                  <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Blocco 3: Clienti */}
          <div className="grid lg:grid-cols-2 gap-10 items-center mb-16 lg:mb-20">
            <div>
              <span className="text-6xl font-extrabold text-blue-500/20">03</span>
              <h3 className="text-2xl font-extrabold text-[#0f172a] mb-3 -mt-4">
                Tutti i tuoi clienti in un posto solo
              </h3>
              <p className="text-gray-500 mb-5">
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
                  <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg overflow-hidden shadow-lg border-2 border-[#0f172a]">
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
            <div className="order-2 lg:order-1 rounded-lg overflow-hidden shadow-lg border-2 border-[#0f172a]">
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
              <span className="text-6xl font-extrabold text-blue-500/20">04</span>
              <h3 className="text-2xl font-extrabold text-[#0f172a] mb-3 -mt-4">
                Preventivi pronti in pochi minuti
              </h3>
              <p className="text-gray-500 mb-5">
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
                  <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* MODULI SPECIALIZZATI — Navy dark               */}
      {/* ============================================ */}
      <section className="py-20 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-4">
            Integrazioni certificate<span className="text-blue-500">.</span>
          </h2>
          <p className="text-slate-400 mb-14 max-w-2xl">
            Collegamento diretto con gli enti governativi. Niente copia-incolla, niente doppio lavoro.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* RVFU */}
            <div className="bg-[#1e293b] rounded-lg border border-slate-700 p-7">
              <div className="w-11 h-11 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                <Image
                  src="/icons/icons8/icons8-auto-50-10.png"
                  alt="RVFU"
                  width={20}
                  height={20}
                />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Radiazioni RVFU</h3>
              <p className="text-sm text-slate-400 mb-4">
                Collegamento diretto al Ministero dei Trasporti. 
                Radi il veicolo dal gestionale senza passare da altri portali.
              </p>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                  Certificato di demolizione automatico
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                  Ricerca dati veicolo da targa
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                  Invio telematico a STA
                </li>
              </ul>
            </div>

            {/* SDI */}
            <div className="bg-[#1e293b] rounded-lg border border-slate-700 p-7">
              <div className="w-11 h-11 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                <Receipt className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Fatturazione Elettronica</h3>
              <p className="text-sm text-slate-400 mb-4">
                Crei la fattura, il sistema genera l&apos;XML e lo invia all&apos;Agenzia delle Entrate. 
                Ricevi le notifiche di consegna in automatico.
              </p>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                  Invio automatico via SDI
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                  Bollo, ritenuta, cassa previdenziale
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                  Scadenzario e solleciti
                </li>
              </ul>
            </div>

            {/* RENTRI */}
            <div className="bg-[#1e293b] rounded-lg border border-slate-700 p-7">
              <div className="w-11 h-11 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                <Recycle className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Registro RENTRI</h3>
              <p className="text-sm text-slate-400 mb-4">
                Registro di carico e scarico rifiuti, formulari, 
                trasmissione dati al registro nazionale. Tutto integrato.
              </p>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                  Registro carico/scarico digitale
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                  Formulari di trasporto rifiuti
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                  Trasmissione automatica al ministero
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* PERCHÉ NOI — White with bold headings          */}
      {/* ============================================ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl lg:text-5xl font-extrabold text-[#0f172a] mb-14">
            Perché noi<span className="text-blue-500">.</span>
          </h2>
          
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
                className="p-6 rounded-lg border-2 border-gray-100 bg-white hover:border-blue-500 transition-colors"
              >
                <div className="w-10 h-10 bg-[#0f172a] rounded-lg flex items-center justify-center mb-4">
                  <item.icon className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="text-base font-extrabold text-[#0f172a] mb-1.5">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* NUMERI — Navy dark, big bold numbers           */}
      {/* ============================================ */}
      <section className="py-20 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center lg:text-left">
              <div className="text-6xl font-extrabold text-blue-500 mb-2">4</div>
              <div className="text-sm text-slate-500 font-medium">Integrazioni governative</div>
            </div>
            <div className="text-center lg:text-left">
              <div className="text-6xl font-extrabold text-blue-500 mb-2">3</div>
              <div className="text-sm text-slate-500 font-medium">Piattaforme</div>
            </div>
            <div className="text-center lg:text-left">
              <div className="text-6xl font-extrabold text-white mb-2">100<span className="text-blue-500">%</span></div>
              <div className="text-sm text-slate-500 font-medium">Made in Italy</div>
            </div>
            <div className="text-center lg:text-left">
              <div className="text-6xl font-extrabold text-white mb-2">24<span className="text-blue-500">/7</span></div>
              <div className="text-sm text-slate-500 font-medium">Accesso dati</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* COME FUNZIONA — Bold Split 3-step             */}
      {/* ============================================ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl lg:text-5xl font-extrabold text-[#0f172a] mb-14">
            Come iniziare<span className="text-blue-500">.</span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <span className="text-6xl font-extrabold text-blue-500">1</span>
              <h3 className="text-lg font-extrabold text-[#0f172a] mb-2 mt-2">Ci chiami o ci scrivi</h3>
              <p className="text-sm text-gray-500">
                Ti facciamo vedere il programma con una dimostrazione gratuita. Nessun impegno.
              </p>
            </div>
            <div>
              <span className="text-6xl font-extrabold text-blue-500">2</span>
              <h3 className="text-lg font-extrabold text-[#0f172a] mb-2 mt-2">Ti installiamo tutto noi</h3>
              <p className="text-sm text-gray-500">
                Configuriamo il programma sul tuo PC, importiamo i tuoi dati e ti facciamo la formazione.
              </p>
            </div>
            <div>
              <span className="text-6xl font-extrabold text-blue-500">3</span>
              <h3 className="text-lg font-extrabold text-[#0f172a] mb-2 mt-2">Inizi a lavorare</h3>
              <p className="text-sm text-gray-500">
                Provi gratis per 30 giorni. Se non ti convince, non paghi nulla. Nessun vincolo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* CTA FINALE — Bold Split Blue                  */}
      {/* ============================================ */}
      <section className="py-24 bg-blue-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-extrabold text-white mb-4">Non aspettare.</h2>
          <p className="text-blue-100 mb-10 text-lg">Demo gratuita. Installazione inclusa. Assistenza diretta.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/contatti"
              className="px-8 py-4 bg-[#0f172a] text-white font-bold hover:bg-slate-800 transition-colors"
            >
              RICHIEDI DEMO
            </Link>
            <Link
              href="tel:+393921723028"
              className="px-8 py-4 bg-white/20 text-white font-bold border-2 border-white/30 hover:bg-white/30 transition-colors flex items-center gap-2"
            >
              <Phone className="h-4 w-4" />
              392 172 3028
            </Link>
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
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
