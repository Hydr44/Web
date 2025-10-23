// src/app/dashboard/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
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
    const checkAuth = async () => {
      try {
        console.log("Starting dashboard auth check...");
        const supabase = supabaseBrowser();
        
        // Controllo auth normale per tutti gli utenti
        const { data: { user }, error } = await supabase.auth.getUser();
        console.log("Dashboard auth check:", { user: user?.email, error: error?.message });

        // Fallback: se non ritorna user ma esiste un cookie di sessione Supabase, lasciamo passare
        const hasSbCookie = document.cookie.split(";").some(c => c.trim().startsWith("sb-"));
        if ((error || !user) && !hasSbCookie) {
          console.log("No authenticated user and no sb-* cookie, redirecting to login");
          router.push("/login?redirect=/dashboard");
          return;
        }

        setUserEmail(user?.email || "");
        setCurrentOrgName("RescueManager"); // Semplificato per ora
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
      <DashboardShell userEmail={userEmail}>
        <Breadcrumbs currentOrgName={currentOrgName} />
        {children}
      </DashboardShell>
    </>
  );
}