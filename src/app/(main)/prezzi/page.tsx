"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Star, Zap, Shield, Users, Building2, ArrowRight, Crown } from "lucide-react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  period: string;
  features: string[];
  popular: boolean;
  icon: React.ComponentType<any>;
  color: string;
  buttonText: string;
  buttonLink: string;
}

const plans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfetto per piccole aziende che iniziano",
    price: 29,
    period: "mese",
    features: [
      "Fino a 5 veicoli",
      "Fino a 10 conducenti",
      "Dashboard base",
      "Supporto email",
      "Backup automatico",
      "App mobile inclusa"
    ],
    popular: false,
    icon: Users,
    color: "from-blue-500 to-blue-600",
    buttonText: "Inizia Gratis",
    buttonLink: "/register?plan=starter"
  },
  {
    id: "professional",
    name: "Professional",
    description: "La scelta più popolare per aziende in crescita",
    price: 79,
    period: "mese",
    features: [
      "Fino a 25 veicoli",
      "Fino a 50 conducenti",
      "Dashboard avanzata",
      "Analytics dettagliate",
      "Supporto prioritario",
      "Integrazioni API",
      "Report personalizzati",
      "Formazione inclusa"
    ],
    popular: true,
    icon: Star,
    color: "from-blue-600 to-emerald-500",
    buttonText: "Prova Gratis",
    buttonLink: "/register?plan=professional"
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Per grandi aziende con esigenze complesse",
    price: 199,
    period: "mese",
    features: [
      "Veicoli illimitati",
      "Conducenti illimitati",
      "Dashboard personalizzata",
      "Analytics avanzate",
      "Supporto dedicato",
      "API personalizzate",
      "SLA garantito",
      "Account manager",
      "Formazione personalizzata",
      "Integrazioni custom"
    ],
    popular: false,
    icon: Crown,
    color: "from-purple-500 to-purple-600",
    buttonText: "Contatta Vendite",
    buttonLink: "/contatti?plan=enterprise"
  }
];

export default function PrezziPage() {
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkCurrentPlan = async () => {
      try {
        const supabase = supabaseBrowser();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Carica il piano corrente dell'utente
          const { data: profile } = await supabase
            .from("profiles")
            .select("current_plan")
            .eq("id", user.id)
            .single();
          
          if (profile?.current_plan) {
            setCurrentPlan(profile.current_plan);
          }
        }
      } catch (error) {
        console.error("Error checking current plan:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkCurrentPlan();
  }, []);

  const getCurrentPlanInfo = () => {
    if (!currentPlan) return null;
    return plans.find(plan => plan.id === currentPlan);
  };

  const currentPlanInfo = getCurrentPlanInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
            >
              Scegli il piano giusto per la tua azienda
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            >
              Gestisci la tua flotta con strumenti professionali. 
              Inizia gratis e scala quando vuoi.
            </motion.p>
          </div>
        </div>
      </div>

      {/* Current Plan Status */}
      {currentPlanInfo && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Piano Attivo: {currentPlanInfo.name}
                    </h3>
                    <p className="text-gray-600">
                      €{currentPlanInfo.price}/{currentPlanInfo.period} - {currentPlanInfo.description}
                    </p>
                  </div>
                </div>
                <Link
                  href="/dashboard/billing"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors duration-200"
                >
                  Gestisci Abbonamento
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentPlan === plan.id;
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative rounded-3xl p-8 ${
                  plan.popular 
                    ? 'bg-gradient-to-br from-primary/5 to-blue-500/5 border-2 border-primary shadow-xl' 
                    : 'bg-white border border-gray-200 shadow-lg'
                } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-600 to-emerald-500 text-white px-6 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Più Popolare
                    </div>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-4 right-4">
                    <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Piano Attivo
                    </div>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-8">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${plan.color} flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-5xl font-bold text-gray-900">€{plan.price}</span>
                    <span className="text-gray-600 ml-2">/{plan.period}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Link
                  href={plan.buttonLink}
                  className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-medium transition-all duration-200 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-emerald-500 text-white hover:shadow-lg hover:shadow-primary/25'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  } ${
                    isCurrentPlan
                      ? 'bg-green-600 hover:bg-green-700'
                      : ''
                  }`}
                >
                  {isCurrentPlan ? (
                    <>
                      <Check className="h-5 w-5" />
                      Piano Attivo
                    </>
                  ) : (
                    <>
                      {plan.buttonText}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Domande Frequenti
            </h2>
            <p className="text-gray-600">
              Tutto quello che devi sapere sui nostri piani
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Posso cambiare piano in qualsiasi momento?
              </h3>
              <p className="text-gray-600">
                Sì, puoi aggiornare o downgrade il tuo piano in qualsiasi momento. 
                Le modifiche entrano in vigore nel prossimo ciclo di fatturazione.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                C'è un periodo di prova gratuito?
              </h3>
              <p className="text-gray-600">
                Sì, offriamo 14 giorni di prova gratuita per tutti i piani. 
                Non è richiesta carta di credito per iniziare.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Che tipo di supporto ricevo?
              </h3>
              <p className="text-gray-600">
                Supporto email per Starter, supporto prioritario per Professional, 
                e supporto dedicato per Enterprise con account manager.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                I dati sono sicuri?
              </h3>
              <p className="text-gray-600">
                Assolutamente. Utilizziamo crittografia end-to-end, backup automatici 
                e conformità GDPR per proteggere i tuoi dati.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-emerald-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Pronto a iniziare?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Inizia la tua prova gratuita oggi stesso
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary rounded-xl font-medium hover:bg-gray-50 transition-colors duration-200"
              >
                <Zap className="h-5 w-5" />
                Inizia Gratis
              </Link>
              <Link
                href="/contatti"
                className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white text-white rounded-xl font-medium hover:bg-white hover:text-primary transition-colors duration-200"
              >
                <Building2 className="h-5 w-5" />
                Contatta Vendite
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}