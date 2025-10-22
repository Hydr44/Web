// src/app/dashboard/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
// import DashboardShell from "@/components/dashboard/Shell"; // Temporaneamente disabilitato
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
    const checkAuth = async () => {
      try {
        console.log("Starting dashboard auth check...");
        const supabase = supabaseBrowser();
        
        // BYPASS: Controlla prima il localStorage per il fondatore
        const bypassAuth = localStorage.getItem("rescuemanager-auth");
        if (bypassAuth) {
          try {
            const authData = JSON.parse(bypassAuth);
            if (authData.user?.email === "haxiesz@gmail.com") {
              console.log("BYPASS: Founder auth detected in localStorage");
              setUserEmail(authData.user.email);
              setCurrentOrgName("RescueManager");
              setLoading(false);
              console.log("BYPASS: Dashboard auth check completed successfully");
              return;
            }
          } catch (error) {
            console.warn("BYPASS: Error parsing localStorage auth:", error);
          }
        }
        
        // Semplificato: solo controllo base con timeout
        const getUserPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Dashboard auth timeout after 10 seconds")), 10000)
        );
        
        const { data: { user }, error } = await Promise.race([getUserPromise, timeoutPromise]) as any;
        console.log("Dashboard auth check:", { user: user?.email, error: error?.message });
        
        if (error || !user) {
          if (/timeout/i.test(error?.message || "")) {
            console.log("Dashboard auth timeout, showing dashboard anyway");
            setUserEmail("");
            setCurrentOrgName("");
            setLoading(false);
            return;
          }
          console.log("No authenticated user, redirecting to login");
          router.push("/login?redirect=/dashboard");
          return;
        }

        setUserEmail(user.email || "");
        setCurrentOrgName(""); // Semplificato per ora
        setLoading(false);
        console.log("Dashboard auth check completed successfully");
      } catch (error) {
        console.error("Auth check error:", error);
        // Non redirectare immediatamente, prova a mostrare il dashboard comunque
        setUserEmail("");
        setCurrentOrgName("");
        setLoading(false);
      }
    };

    checkAuth();
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
    <>
      <SiteHeader />
        {/* Temporaneamente senza sidebar */}
        <div className="min-h-screen bg-gradient-to-br from-gray-50/50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Breadcrumbs currentOrgName={currentOrgName} />
            {children}
          </div>
        </div>
    </>
  );
}