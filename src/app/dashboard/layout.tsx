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
        
        // Prima prova con getUser
        const { data: { user }, error } = await supabase.auth.getUser();
        console.log("getUser result:", { user: user?.email, error: error?.message });
        
        if (error) {
          console.log("getUser failed, trying getSession...");
          // Fallback con getSession
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          console.log("getSession result:", { session: session?.user?.email, error: sessionError?.message });
          
          if (sessionError || !session?.user) {
            console.log("Both getUser and getSession failed, redirecting to login");
            router.push("/login?redirect=/dashboard");
            return;
          }
          
          setUserEmail(session.user.email || "");
        } else if (!user) {
          console.log("No user found, redirecting to login");
          router.push("/login?redirect=/dashboard");
          return;
        } else {
          setUserEmail(user.email || "");
        }

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

    // Timeout di sicurezza per evitare loading infinito
    const timeout = setTimeout(() => {
      console.log("Auth check timeout, showing dashboard anyway");
      setLoading(false);
    }, 5000);

    checkAuth();

    return () => clearTimeout(timeout);
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