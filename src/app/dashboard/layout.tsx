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
        const supabase = supabaseBrowser();
        const { data: { user }, error } = await supabase.auth.getUser();
        
        console.log("Dashboard auth check:", { user: user?.email, error: error?.message });
        
        if (error || !user) {
          console.log("No authenticated user, redirecting to login");
          router.push("/login?redirect=/dashboard");
          return;
        }

        setUserEmail(user.email || "");
        
        // Get organization info
        const { data: profile } = await supabase.from("profiles").select("current_org").eq("id", user.id).maybeSingle();
        if (profile?.current_org) {
          const { data: org } = await supabase.from("organizations").select("name").eq("id", profile.current_org).maybeSingle();
          setCurrentOrgName(org?.name ?? "");
        }
        
        setLoading(false);
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
          <p className="text-gray-600">Caricamento...</p>
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