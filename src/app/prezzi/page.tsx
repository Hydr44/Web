"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { 
  CheckCircle2, 
  Star, 
  ArrowRight, 
  Zap, 
  Shield, 
  Users, 
  Truck, 
  BarChart3,
  CreditCard,
  Clock,
  HelpCircle,
  TrendingUp
} from "lucide-react";

/** Price IDs dalle env (con fallback) */
const PRICES = {
  starter:
    process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER ??
    process.env.STRIPE_PRICE_STARTER ??
    "",
  fleet:
    process.env.NEXT_PUBLIC_STRIPE_PRICE_FLEET ??
    process.env.STRIPE_PRICE_FLEET ??
    "",
  consortium:
    process.env.NEXT_PUBLIC_STRIPE_PRICE_CONSORTIUM ??
    process.env.STRIPE_PRICE_CONSORTIUM ??
    "",
} as const;

/** URL per la checkout Stripe via route API.
 *  Se non loggato → /login e poi ritorno qui automatico.
 */
function checkoutUrl(priceId: string, returnTo = "/dashboard/billing/subscription") {
  if (!priceId) return "";
  return `/api/billing/checkout?price=${encodeURIComponent(
    priceId
  )}&return=${encodeURIComponent(returnTo)}`;
}

type Plan = {
  id: "starter" | "fleet" | "company";
  name: string;
  price?: string;
  priceReal?: string;
  priceAnnual?: string;
  priceAnnualReal?: string;
  badge?: string;
  note: string;
  features: string[];
  priceId?: string;
  highlight?: boolean;
  color: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description: string;
  popular?: boolean;
  modules: string[];
};

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: "€ 19,99/mese",
    priceReal: "€ 39,99/mese",
    priceAnnual: "€ 199,99/anno",
    priceAnnualReal: "€ 439,99/anno",
    note: "Prezzo benvenuto - Per iniziare: 1–5 mezzi",
    badge: "Più scelto",
    highlight: true,
    popular: true,
    color: "blue",
    icon: Truck,
    description: "Perfetto per iniziare",
    priceId: PRICES.starter,
    features: [
      "Dashboard Completa",
      "Gestione Clienti",
      "Gestione Mezzi",
      "Modulo Trasporti",
      "Calendario trasporti",
      "Preventivi e offerte",
      "1-5 mezzi inclusi",
      "Report base",
      "Richiesta posizione GPS cliente",
      "Gestione autisti",
      "Accesso App Autisti",
    ],
    modules: [
      "Trasporti",
      "Clienti",
      "Dashboard",
      "Report base",
      "Gestione autisti"
    ],
  },
  {
    id: "fleet",
    name: "Flotta",
    price: "€ 98,99/mese",
    priceReal: "€ 149,99/mese",
    priceAnnual: "€ 999,99/anno",
    priceAnnualReal: "€ 1449,99/anno",
    note: "Prezzo benvenuto - Per 6–15 mezzi e team",
    color: "purple",
    icon: Users,
    description: "Per team in crescita",
    priceId: PRICES.fleet,
    features: [
      "Tutto il piano starter",
      "Registro auto (confische, sequestri, ecc)",
      "Modulo Fatturazione elettronica",
      "Modulo Radiazioni RVFU",
      "Modulo Registro rifiuti",
      "Modulo Ricambi",
      "Supporto prioritario",
    ],
    modules: [
      "Trasporti",
      "Clienti", 
      "Dashboard",
      "Registro auto",
      "Fatturazione elettronica",
      "Radiazioni RVFU",
      "Registro rifiuti",
      "Ricambi"
    ],
  },
  {
    id: "company",
    name: "Enterprise",
    price: "€ 149,99/mese",
    priceReal: "€ 199,99/mese",
    priceAnnual: "€ 1449/anno",
    priceAnnualReal: "€ 1999,99/anno",
    note: "Prezzo benvenuto - Per flotte complesse (16+ mezzi)",
    color: "emerald",
    icon: BarChart3,
    description: "Per grandi operazioni",
    priceId: PRICES.consortium,
    features: [
      "Tutto da starter e flotta",
      "Supporto prioritario",
      "Manutenzione avanzata",
      "Installazione inclusa",
      "Analytics dettagliati",
      "Ruoli granulari",
    ],
    modules: [
      "Trasporti",
      "Clienti",
      "Dashboard", 
      "Registro auto",
      "Fatturazione elettronica",
      "Radiazioni RVFU",
      "Registro rifiuti",
      "Ricambi",
      "Manutenzione avanzata",
      "Analytics dettagliati",
      "Ruoli granulari"
    ],
  },
];

const CORE_FEATURES = [
  "Accesso web + mobile",
  "Utenti illimitati (da Flotta)",
  "Backup giornalieri",
  "GDPR by design",
  "Permessi granulari (da Azienda)",
];

export default function PrezziPage() {
  const [isClient, setIsClient] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const [showWelcomePrice, setShowWelcomePrice] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <main className="hero-bg">
      {/* HERO */}
      <section className="relative overflow-hidden pt-18 md:pt-24 pb-16 bg-gradient-to-br from-primary/5 via-white to-purple-50/30">
        {/* Background elements */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        
        <div className="rm-container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="inline-flex items-center gap-2 text-xs rounded-full ring-1 ring-primary/30 px-3 py-1.5 mb-6 bg-gradient-to-r from-primary/10 to-purple-500/10 text-primary font-medium"
              >
                <CreditCard className="h-3 w-3" />
                Prezzi semplici e trasparenti
              </motion.div>
              
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                Piani che crescono con la{" "}
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  tua officina
                </span>
              </h1>
              
              <p className="mt-6 text-lg text-gray-600 max-w-2xl leading-relaxed">
                Attiva subito online oppure richiedi un preventivo personalizzato. I piani si adattano alle tue esigenze senza costi nascosti.
              </p>

              {/* Feature badges */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-8 flex flex-wrap gap-3"
              >
                {[
                  { icon: Shield, text: "GDPR by design", color: "green" },
                  { icon: Clock, text: "Setup in 1 giorno", color: "blue" },
                  { icon: TrendingUp, text: "Scalabile", color: "purple" },
                  { icon: Zap, text: "Attivazione immediata", color: "orange" },
                ].map((badge, i) => (
                  <motion.div
                    key={badge.text}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.5 + i * 0.1 }}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ring-1 ring-${badge.color}-200 bg-gradient-to-r from-${badge.color}-50 to-${badge.color}-100 text-${badge.color}-700 font-medium text-sm hover:shadow-md transition-all duration-200`}
                  >
                    <badge.icon className="h-4 w-4" />
                    {badge.text}
                  </motion.div>
                ))}
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="mt-8 flex flex-wrap gap-4"
              >
                <Link
                  href="#piani"
                  className="group inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
                >
                  Vedi i piani
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/contatti"
                  className="inline-flex items-center gap-2 px-6 py-4 rounded-xl ring-2 ring-gray-200 bg-white text-gray-900 font-semibold hover:bg-gray-50 hover:ring-gray-300 transition-all duration-300"
                >
                  <HelpCircle className="h-4 w-4" />
                  Richiedi preventivo
                </Link>
              </motion.div>
            </motion.div>

            {/* Right visual */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <Image 
                  src="/670shots_so.png" 
                  alt="RescueManager Dashboard" 
                  width={600} 
                  height={400} 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              
              {/* Floating pricing info */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4 border"
              >
                <div className="text-2xl font-bold text-primary">€29</div>
                <div className="text-xs text-gray-600">al mese</div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
                className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 border"
              >
                <div className="text-2xl font-bold text-emerald-600">0€</div>
                <div className="text-xs text-gray-600">setup gratuito</div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section id="piani" className="py-16 bg-gray-50/50">
        <div className="rm-container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Scegli il piano giusto</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Tutti i piani includono supporto, backup e aggiornamenti automatici
            </p>
            
            {/* Toggle Mensile/Annuale */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className={`text-sm font-medium ${isAnnual ? 'text-gray-500' : 'text-gray-900'}`}>
                Mensile
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  isAnnual ? 'bg-primary' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    isAnnual ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
                Annuale
              </span>
              {isAnnual && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                  Risparmia 2 mesi!
                </span>
              )}
            </div>

            {/* Toggle Prezzi Benvenuto/Reali */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className={`text-sm font-medium ${showWelcomePrice ? 'text-gray-900' : 'text-gray-500'}`}>
                Prezzo Benvenuto
              </span>
              <button
                onClick={() => setShowWelcomePrice(!showWelcomePrice)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  showWelcomePrice ? 'bg-primary' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    showWelcomePrice ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${showWelcomePrice ? 'text-gray-500' : 'text-gray-900'}`}>
                Prezzo Reale
              </span>
              {showWelcomePrice && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-medium">
                  Offerta di lancio!
                </span>
              )}
            </div>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {PLANS.map((plan, i) => {
              const checkout = plan.priceId ? checkoutUrl(plan.priceId) : "";
              const canCheckout = isClient && Boolean(checkout);
              
              return (
                <motion.article
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={`group relative p-8 rounded-3xl bg-gradient-to-br from-${plan.color}-50 to-${plan.color}-100 border border-${plan.color}-200 hover:shadow-xl hover:shadow-${plan.color}-200/50 transition-all duration-300 hover:-translate-y-1 ${
                    plan.popular ? 'ring-2 ring-primary scale-105' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      POPOLARE
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`p-3 rounded-xl bg-gradient-to-r from-${plan.color}-500 to-${plan.color}-600 text-white`}>
                      <plan.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-sm text-gray-600">{plan.description}</p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="text-4xl font-bold text-gray-900 mb-1">
                      {isAnnual 
                        ? (showWelcomePrice ? plan.priceAnnual : plan.priceAnnualReal)
                        : (showWelcomePrice ? plan.price : plan.priceReal)
                      }
                    </div>
                    <p className="text-sm text-gray-600">{plan.note}</p>
                    {showWelcomePrice && (
                      <div className="mt-2 text-sm text-orange-600 font-medium">
                        Offerta di lancio - Risparmio del 50%!
                      </div>
                    )}
                    {isAnnual && (
                      <div className="mt-2 text-sm text-green-600 font-medium">
                        Risparmio: €{Math.round((Number.parseInt((showWelcomePrice ? plan.price : plan.priceReal)?.replaceAll(/[^\d]/g, '') || '0') * 12 - Number.parseInt((showWelcomePrice ? plan.priceAnnual : plan.priceAnnualReal)?.replaceAll(/[^\d]/g, '') || '0')) / 100)}/anno
                      </div>
                    )}
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-gray-700">
                        <CheckCircle2 className={`h-4 w-4 text-${plan.color}-500 mt-0.5 shrink-0`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="space-y-3">
                    {isClient ? (
                      <a
                        href={canCheckout ? checkout : "/dashboard/billing?err=missing_price"}
                        aria-disabled={!canCheckout}
                        className={`group/btn block w-full text-center py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                          canCheckout 
                            ? `bg-gradient-to-r from-${plan.color}-500 to-${plan.color}-600 text-white hover:shadow-lg group-hover:scale-105` 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {canCheckout ? 'Attiva subito' : 'Contattaci'}
                      </a>
                    ) : (
                      <div className="block w-full text-center py-3 px-4 rounded-xl font-semibold bg-gray-200 text-gray-500">
                        Caricamento...
                      </div>
                    )}
                    
                    <Link
                      href="/contatti"
                      className="block w-full text-center py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                    >
                      Richiedi preventivo
                    </Link>
                  </div>
                  
                  {isClient && !canCheckout && (
                    <p className="mt-4 text-xs text-gray-500 text-center">
                      Setup personalizzato disponibile
                    </p>
                  )}
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="py-16 bg-gradient-to-r from-primary/10 via-purple-50/50 to-primary/10">
        <div className="rm-container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl bg-gradient-to-r from-primary to-purple-600 p-8 md:p-12 text-white overflow-hidden"
          >
            {/* Background pattern */}
            <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Vuoi un piano su misura?
                </h2>
                <p className="text-lg text-purple-100 mb-6">
                  Dicci quanti mezzi gestisci e quali moduli ti servono: ti rispondiamo entro 24 ore.
                </p>
                <div className="flex items-center gap-4 text-sm text-purple-100">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Risposta in 24h</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Preventivo gratuito</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-4">
                <Link
                  href="/contatti"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-primary font-bold hover:bg-gray-50 transition-all duration-300 hover:scale-105"
                >
                  Richiedi preventivo personalizzato
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/prodotto"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-all duration-300"
                >
                  <Star className="h-4 w-4" />
                  Scopri tutti i moduli
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ BREVE */}
      <section className="py-16 bg-white">
        <div className="rm-container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Domande frequenti</h3>
            <p className="text-lg text-gray-600">Le risposte alle domande più comuni sui prezzi</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                q: "Posso attivare subito online?",
                a: "Sì, per tutti i piani abilitati al checkout. In alternativa, puoi richiedere un preventivo personalizzato.",
                icon: CreditCard
              },
              {
                q: "Come conteggiate i mezzi?",
                a: "In base ai mezzi attivi nel mese. Puoi aumentare o ridurre senza penali.",
                icon: Truck
              },
              {
                q: "Migrazione dati?",
                a: "Offriamo import da CSV/Excel e supporto alla mappatura dei campi.",
                icon: TrendingUp
              },
              {
                q: "Pagamenti e fatturazione?",
                a: "Pagamenti con carta o bonifico. Fatturazione mensile; annuale su richiesta.",
                icon: Shield
              }
            ].map((faq, i) => (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="group rounded-2xl border border-gray-200 p-6 bg-white hover:shadow-lg hover:border-primary/20 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <faq.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">{faq.q}</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}