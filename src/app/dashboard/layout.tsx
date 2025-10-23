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
        
        // Controlla cookie Supabase
        const hasSbCookie = document.cookie.split(";").some(c => c.trim().startsWith("sb-"));
        
        if (!hasSbCookie) {
          console.log("No auth data found, redirecting to login");
          router.push("/login?redirect=/dashboard");
          return;
        }

        // Prova a ottenere l'utente
        const { data: { user }, error } = await supabase.auth.getUser();
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