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
  const [orgName, setOrgName] = useState("");
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

        // Prendi l'org DELL'UTENTE: prima da profiles.current_org, fallback a org_members.
        // Niente "select * limit 1" che pesca a caso la prima org del DB.
        let userOrgId: string | null = null;
        const { data: profile } = await supabase
          .from('profiles')
          .select('current_org')
          .eq('id', user.id)
          .maybeSingle();
        if (profile?.current_org) {
          userOrgId = profile.current_org as string;
        } else {
          const { data: mem } = await supabase
            .from('org_members')
            .select('org_id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle();
          userOrgId = mem?.org_id || null;
        }

        if (userOrgId) {
          // Preferisci company_name salvato in org_settings (Info Azienda),
          // altrimenti fallback al nome di orgs.
          const [{ data: org }, { data: settings }] = await Promise.all([
            supabase.from('orgs').select('name').eq('id', userOrgId).maybeSingle(),
            supabase.from('org_settings').select('value').eq('org_id', userOrgId).eq('key', 'company').maybeSingle(),
          ]);
          const companyName = (settings?.value as { company_name?: string } | null)?.company_name;
          setOrgName(companyName || org?.name || '');
        } else {
          setOrgName('');
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
      <div className="min-h-screen bg-gray-50 pt-28">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* Sidebar Skeleton (solo Desktop) */}
          <div className="lg:sticky lg:top-28 lg:h-[calc(100vh-112px)] p-4 bg-white border-r border-gray-200 hidden lg:flex flex-col">
            <div className="space-y-3">
               <div className="w-full h-16 bg-gray-100 rounded animate-pulse mb-6" />
               {[...Array(7)].map((_, i) => (
                  <div key={i} className="w-full h-10 bg-gray-100 rounded animate-pulse border border-transparent" />
               ))}
            </div>
            
            <div className="mt-auto pt-4">
              <div className="w-full h-10 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
          
          {/* Main Content Skeleton */}
          <section className="p-6 lg:p-8 overflow-auto">
            <div className="max-w-6xl mx-auto space-y-8 mt-2">
                 {/* Title Skeleton */}
                 <div className="space-y-2">
                   <div className="w-48 h-8 bg-gray-200 rounded animate-pulse" />
                   <div className="w-64 h-4 bg-gray-100 rounded animate-pulse" />
                 </div>
                 
                 {/* Card Skeletons */}
                 <div className="w-full h-40 bg-white border border-gray-100 p-6 space-y-4 rounded shadow-sm">
                    <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="w-64 h-8 bg-gray-200 rounded animate-pulse" />
                    <div className="w-full h-10 bg-gray-50 rounded mt-4 animate-pulse" />
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                   {[...Array(4)].map((_, i) => (
                     <div key={i} className="h-24 bg-white border border-gray-100 rounded shadow-sm flex items-center p-4">
                       <div className="w-10 h-10 bg-gray-100 rounded animate-pulse mr-4" />
                       <div className="space-y-2 flex-1">
                         <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse" />
                         <div className="w-3/4 h-3 bg-gray-100 rounded animate-pulse" />
                       </div>
                     </div>
                   ))}
                 </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell userEmail={userEmail} orgName={orgName}>
      <Breadcrumbs />
      {children}
    </DashboardShell>
  );
}