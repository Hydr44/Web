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
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = supabaseBrowser();
    
    const checkAuth = async () => {
      try {
        // Prova direttamente getUser (Supabase gestisce automaticamente localStorage e cookie)
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          router.push("/login?redirect=/dashboard");
          return;
        }
        
        setUserEmail(user.email || "Utente");
        setLoading(false);
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/login?redirect=/dashboard");
      }
    };

    // Carica stato iniziale
    checkAuth();

    // Listener per cambiamenti di autenticazione
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUserEmail(session.user.email || "Utente");
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        router.push("/login?redirect=/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-blue-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Caricamento dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell userEmail={userEmail}>
      <Breadcrumbs />
      {children}
    </DashboardShell>
  );
}