"use client";

import Link from "next/link";
import Image from "next/image";
import {
    ArrowRight,
    Phone,
    Recycle,
    AlertCircle,
    Truck,
    X
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import WhatsAppFab from "@/components/WhatsAppFab";

export default function HomeClient() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [processing, setProcessing] = useState(false);
    const [demoTab, setDemoTab] = useState<"soccorso" | "demolizione">("soccorso");

    const DEMOS = {
        soccorso: {
            label: "Soccorso stradale",
            icon: Truck,
            kicker: "Soccorso & trasporti",
            title: "Dalla chiamata alla fattura",
            desc: "Ricevi la richiesta, assegni l'autista e lo segui in tempo reale. L'autista naviga, scatta le foto e fa firmare il cliente dall'app; poi la fattura elettronica parte in un clic.",
            steps: [
                "Nuovo intervento e assegnazione dell'autista",
                "Tracking GPS e navigazione turn-by-turn",
                "Foto, firma digitale e fattura elettronica",
            ],
            src: "/video/soccorso.mp4",
            poster: "/video/soccorso-poster.jpg",
        },
        demolizione: {
            label: "Demolizione veicoli",
            icon: Recycle,
            kicker: "Demolizioni VFU",
            title: "Dall'accettazione alla fattura",
            desc: "Registri il veicolo nel Registro ACI/MIT, segui la lavorazione a norma fase per fase, trasmetti a RENTRI ed emetti il certificato di rottamazione e la fattura.",
            steps: [
                "Pratica VFU e Registro ACI/MIT",
                "Lavorazione, RENTRI e radiazione PRA",
                "Certificato di rottamazione e fattura",
            ],
            src: "/video/demolizione.mp4",
            poster: "/video/demolizione-poster.jpg",
        },
    } as const;

    const LOGHI = [
        { src: "/loghi/rentri.jpg", alt: "RENTRI", w: 900, h: 520 },
        { src: "/loghi/unrae.png", alt: "UNRAE", w: 300, h: 260 },
        { src: "/loghi/ricambipro.png", alt: "RicambiPro", w: 600, h: 170 },
    ];

    const INTEGRAZIONI = [
        { ente: "Ministero dei Trasporti · STA", title: "Radiazioni RVFU", short: "Radi il veicolo e generi il certificato di rottamazione, collegato al Registro nazionale." },
        { ente: "Agenzia delle Entrate", title: "Fatturazione elettronica", short: "Crei, trasmetti e monitori le fatture con notifiche automatiche." },
        { ente: "Registro RENTRI", title: "Rifiuti e formulari", short: "Carico/scarico, formulari e trasmissione al registro nazionale." },
        { ente: "UNRAE", title: "Statistiche e demolizioni", short: "Trasmetti le demolizioni e consulti i dati di settore." },
        { ente: "RicambiPro", title: "Catalogo ricambi", short: "Cerchi il pezzo, verifichi compatibilità e disponibilità." },
    ];

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
                <div className="fixed top-28 left-1/2 -translate-x-1/2 z-50 max-w-2xl w-full mx-4">
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
            {/* HERO — Bold Split with Video Background      */}
            {/* ============================================ */}
            <section className="pt-28 relative">
                <div className="grid lg:grid-cols-2 min-h-[90vh]">
                    {/* Left: Dark */}
                    <div className="flex items-center px-6 lg:px-12 xl:px-20 py-20 bg-[#0f172a] relative z-10">
                        <div className="max-w-lg">
                            <h1 className="text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-[1.05]">
                                Soccorri.<br />
                                Trasporta.<br />
                                <span className="text-blue-500">Fattura.</span>
                            </h1>
                            {/* Il sottotitolo dell'hero è anche segnale SEO forte.
                                Settori target in ordine di focus: soccorso stradale,
                                trasporti, autodemolitori. Sigle cercate: RENTRI, VFU,
                                SDI. Niente officine/carrozzerie (non è il pubblico). */}
                            <p className="text-lg text-slate-400 mb-10 leading-relaxed">
                                {"Il software gestionale per "}
                                <strong className="text-slate-200">soccorso stradale</strong>
                                {", "}
                                <strong className="text-slate-200">trasporti</strong>
                                {" e "}
                                <strong className="text-slate-200">autodemolitori</strong>
                                {". Dispatch interventi su mappa, Registro "}
                                <strong className="text-slate-200">RENTRI</strong>
                                {", Registro Veicoli Fuori Uso ("}
                                <strong className="text-slate-200">VFU</strong>
                                {"), fatturazione elettronica. Un programma. Zero complicazioni."}
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link
                                    href="/contatti"
                                    className="px-7 py-4 bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors rounded"
                                >
                                    RICHIEDI DEMO
                                </Link>
                                <Link
                                    href="tel:+393921723028"
                                    className="px-7 py-4 border-2 border-slate-700 text-white font-bold text-sm hover:border-blue-500 transition-colors flex items-center gap-2 rounded"
                                >
                                    <Phone className="h-4 w-4" />
                                    CHIAMACI
                                </Link>
                            </div>
                        </div>
                    </div>
                    {/* Right: Blue with auto-play video */}
                    <div className="relative bg-blue-600 overflow-hidden flex items-center justify-center">
                        <video
                            autoPlay
                            loop
                            muted
                            playsInline
                            poster="/video/soccorso-poster.jpg"
                            className="w-full h-full object-contain"
                        >
                            <source src="/video/soccorso.mp4" type="video/mp4" />
                        </video>
                    </div>
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
                                    "Assegnazione soccorso & trasporti con un click",
                                    "App per gli autisti (Android e iPhone)",
                                    "Calendario e mappa in tempo reale",
                                    "Rapportino digitale con firma del cliente"
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                                        <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-blue-500" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="rounded-lg overflow-hidden shadow-lg border-2 border-[#0f172a]">
                            <Image
                                src="/appshots/autisti.png"
                                alt="Gestione autisti e soccorso & trasporti RescueManager"
                                width={1024}
                                height={768}
                                className="w-full h-auto"
                                quality={90}
                            />
                        </div>
                    </div>

                    {/* Blocco 2: Piazzale e Veicoli */}
                    <div className="grid lg:grid-cols-2 gap-10 items-center mb-16 lg:mb-20">
                        <div className="order-2 lg:order-1 rounded-lg overflow-hidden shadow-lg border-2 border-[#0f172a]">
                            <Image
                                src="/appshots/piazzalenuovo.png"
                                alt="Gestione custodia veicoli RescueManager"
                                width={1024}
                                height={768}
                                className="w-full h-auto"
                                quality={90}
                            />
                        </div>
                        <div className="order-1 lg:order-2">
                            <span className="text-6xl font-extrabold text-blue-500/20">02</span>
                            <h3 className="text-2xl font-extrabold text-[#0f172a] mb-3 -mt-4">
                                Ogni veicolo tracciato dal primo giorno
                            </h3>
                            <p className="text-gray-500 mb-5">
                                Dal momento in cui un veicolo entra nella custodia veicoli, hai tutto sotto controllo:
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
                                        <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-blue-500" />
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
                                Anagrafica completa, storico soccorso & trasporti, fatture emesse, veicoli associati.
                                Cerchi un cliente e trovi tutto quello che gli riguarda.
                            </p>
                            <ul className="space-y-2.5">
                                {[
                                    "Anagrafica clienti e fornitori",
                                    "Storico completo per ogni cliente",
                                    "Collegamento automatico a soccorso & trasporti e fatture",
                                    "Import da file Excel o CSV"
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                                        <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-blue-500" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="rounded-lg overflow-hidden shadow-lg border-2 border-[#0f172a]">
                            <Image
                                src="/appshots/clientinuovo.png"
                                alt="Gestione clienti RescueManager"
                                width={1024}
                                height={768}
                                className="w-full h-auto"
                                quality={90}
                            />
                        </div>
                    </div>

                    {/* Blocco 4: Preventivi */}
                    <div className="grid lg:grid-cols-2 gap-10 items-center">
                        <div className="order-2 lg:order-1 rounded-lg overflow-hidden shadow-lg border-2 border-[#0f172a]">
                            <Image
                                src="/appshots/fatture elettroniche.png"
                                alt="Fatture elettroniche RescueManager"
                                width={1024}
                                height={768}
                                className="w-full h-auto"
                                quality={90}
                            />
                        </div>
                        <div className="order-1 lg:order-2">
                            <span className="text-6xl font-extrabold text-blue-500/20">04</span>
                            <h3 className="text-2xl font-extrabold text-[#0f172a] mb-3 -mt-4">
                                Fatture elettroniche in automatico
                            </h3>
                            <p className="text-gray-500 mb-5">
                                Crei la fattura, la trasmetti all&apos;Agenzia delle Entrate e il sistema ti avvisa quando è accettata.
                                Tutto conforme alla normativa italiana, senza pensieri.
                            </p>
                            <ul className="space-y-2.5">
                                {[
                                    "Trasmissione automatica all'Agenzia delle Entrate",
                                    "Notifiche di accettazione in tempo reale",
                                    "Conservazione sostitutiva inclusa",
                                    "Gestione note di credito e storni"
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                                        <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-blue-500" />
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
                    <p className="text-slate-400 mb-10 max-w-2xl">
                        Collegamento diretto con enti e servizi certificati. Niente copia-incolla, niente doppio lavoro.
                    </p>

                    {/* Striscia loghi integrazioni (scorrevole, fascia bianca continua) */}
                    <div className="rm-marquee rounded-xl bg-white py-7">
                        <div className="rm-marquee-track items-center">
                            {Array.from({ length: 6 }).flatMap(() => LOGHI).map((l, i) => (
                                <Image
                                    key={i}
                                    src={l.src}
                                    alt={l.alt}
                                    width={l.w}
                                    height={l.h}
                                    className="mx-10 lg:mx-12 h-9 lg:h-11 w-auto object-contain shrink-0"
                                />
                            ))}
                        </div>
                    </div>

                    {/* Integrazioni — griglia minimale */}
                    <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {INTEGRAZIONI.map((it) => (
                            <div key={it.title} className="border border-slate-800 p-7 transition-colors hover:border-blue-500/40">
                                <div className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">
                                    {it.ente}
                                </div>
                                <h3 className="text-lg font-extrabold text-white mb-2">{it.title}</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">{it.short}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============================================ */}
            {/* VIDEO DEMO — Tabbed showcase (soccorso/VFU)    */}
            {/* ============================================ */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-10">
                        <h2 className="text-4xl lg:text-5xl font-extrabold text-[#0f172a] mb-4">
                            Vedi in azione<span className="text-blue-500">.</span>
                        </h2>
                        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                            Due flussi reali, dall&apos;inizio alla fattura. Scegli quale guardare.
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="flex flex-wrap justify-center gap-3 mb-10">
                        {(["soccorso", "demolizione"] as const).map((k) => {
                            const D = DEMOS[k];
                            const Ic = D.icon;
                            const on = demoTab === k;
                            return (
                                <button
                                    key={k}
                                    onClick={() => setDemoTab(k)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded font-bold text-sm transition-colors ${on
                                        ? "bg-[#0f172a] text-white"
                                        : "border-2 border-slate-200 text-slate-600 hover:border-blue-500 hover:text-[#0f172a]"
                                        }`}
                                >
                                    <Ic className="h-4 w-4" />
                                    {D.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Player + info */}
                    <div className="grid lg:grid-cols-3 gap-8 items-start">
                        <div className="lg:col-span-2">
                            <div className="rounded-lg overflow-hidden shadow-2xl border-2 border-[#0f172a] bg-black">
                                <video
                                    key={demoTab}
                                    controls
                                    playsInline
                                    className="w-full aspect-video"
                                    poster={DEMOS[demoTab].poster}
                                >
                                    <source src={DEMOS[demoTab].src} type="video/mp4" />
                                    Il tuo browser non supporta il tag video.
                                </video>
                            </div>
                        </div>

                        <div>
                            <span className="inline-block text-xs font-bold tracking-wider text-blue-600 uppercase mb-3">
                                {DEMOS[demoTab].kicker}
                            </span>
                            <h3 className="text-2xl lg:text-3xl font-extrabold text-[#0f172a] mb-4">
                                {DEMOS[demoTab].title}
                            </h3>
                            <p className="text-gray-500 mb-6">
                                {DEMOS[demoTab].desc}
                            </p>
                            <ul className="space-y-3 mb-8">
                                {DEMOS[demoTab].steps.map((s) => (
                                    <li key={s} className="flex items-start gap-3 text-sm font-medium text-[#0f172a]">
                                        <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-blue-500" />
                                        <span>{s}</span>
                                    </li>
                                ))}
                            </ul>
                            <Link
                                href="/contatti"
                                className="inline-flex items-center gap-2 px-7 py-4 bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors rounded"
                            >
                                RICHIEDI DEMO
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
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
                                14 giorni soddisfatti o rimborsati: se non ti convince, ti restituiamo tutto. Nessun vincolo.
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

            {/* Contatto diretto WhatsApp — sticky, solo sulla home */}
            <WhatsAppFab />
        </main>
    );
}
