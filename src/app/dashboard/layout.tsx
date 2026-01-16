// src/app/dashboard/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/dashboard/Shell";
import Breadcrumbs from "@/components/dashboard/Breadcrumbs";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [userEmail, setUserEmail] = useState("");
  const [currentOrgName, setCurrentOrgName] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = supabaseBrowser();
    
    const checkAuth = async () => {
      try {
        // Prova prima con getSession (più veloce, legge da localStorage)
        let { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // Se non c'è sessione, prova getUser (può fare una chiamata al server)
        if (!session || sessionError) {
          const { data: { user }, error } = await supabase.auth.getUser();
          
          if (error || !user) {
            router.push("/login?redirect=/dashboard");
            return;
          }
          
          setUserEmail(user.email || "Utente");
          setCurrentOrgName("RescueManager");
          setLoading(false);
          return;
        }
        
        // Se c'è la sessione, usa quella
        if (session?.user) {
          setUserEmail(session.user.email || "Utente");
          setCurrentOrgName("RescueManager");
          setLoading(false);
          return;
        }
        
        // Se non c'è utente nella sessione, redirect
        router.push("/login?redirect=/dashboard");
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/login?redirect=/dashboard");
      }
    };

    // Carica stato iniziale con un piccolo delay per dare tempo alla sessione di essere salvata
    setTimeout(() => {
      checkAuth();
    }, 100);

    // Listener per cambiamenti di autenticazione
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUserEmail(session.user.email || "Utente");
        setCurrentOrgName("RescueManager");
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        router.push("/login?redirect=/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell userEmail={userEmail}>
      <Breadcrumbs currentOrgName={currentOrgName} />
      {children}
    </DashboardShell>
  );
}