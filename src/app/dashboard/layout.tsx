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
        console.log("Starting dashboard auth check...");
        
        // Prova a ottenere l'utente (controlla sia cookie che localStorage)
        const { data: { user }, error } = await supabase.auth.getUser();
        
        // Se non c'è utente, controlla anche localStorage come fallback
        if (error || !user) {
          // Controlla se c'è una sessione in localStorage (per compatibilità)
          const hasLocalStorageSession = typeof window !== 'undefined' && 
            localStorage.getItem('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token');
          
          if (!hasLocalStorageSession) {
            console.log("No auth data found (cookie or localStorage), redirecting to login");
            router.push("/login?redirect=/dashboard");
            return;
          }
          
          // Se c'è localStorage ma getUser() fallisce, potrebbe essere un problema di sincronizzazione
          // Riprova dopo un breve delay
          await new Promise(resolve => setTimeout(resolve, 500));
          const { data: { user: retryUser }, error: retryError } = await supabase.auth.getUser();
          
          if (retryError || !retryUser) {
            console.log("Auth check failed after retry, redirecting to login");
            router.push("/login?redirect=/dashboard");
            return;
          }
          
          // Usa l'utente dal retry
          const finalUser = retryUser;
          setUserEmail(finalUser.email || "Utente");
          setCurrentOrgName("RescueManager");
          setLoading(false);
          console.log("Dashboard auth check completed successfully (after retry)");
          return;
        }
        console.log("Dashboard auth check:", { user: user?.email, error: error?.message });
        
        if (error || !user) {
          console.log("Auth check failed, redirecting to login");
          router.push("/login?redirect=/dashboard");
          return;
        }
        
        setUserEmail(user.email || "Utente");
        setCurrentOrgName("RescueManager");
        setLoading(false);
        console.log("Dashboard auth check completed successfully");
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/login?redirect=/dashboard");
      }
    };

    // Carica stato iniziale
    checkAuth();

    // Listener per cambiamenti di autenticazione
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Dashboard auth state change:", event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user) {
        setUserEmail(session.user.email || "Utente");
        setCurrentOrgName("RescueManager");
        setLoading(false);
        console.log("User signed in, dashboard updated");
      } else if (event === 'SIGNED_OUT') {
        console.log("User signed out, redirecting to login");
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