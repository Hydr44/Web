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
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar Skeleton (solo Desktop) */}
        <div className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
          <div className="h-16 border-b border-gray-200 flex items-center px-6">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
            <div className="w-24 h-5 bg-gray-200 rounded ml-3 animate-pulse" />
          </div>
          <div className="p-4 space-y-3 mt-4">
             {[...Array(6)].map((_, i) => (
                <div key={i} className="w-full h-10 bg-gray-100 rounded animate-pulse border border-transparent" />
             ))}
          </div>
        </div>
        
        {/* Main Content Skeleton */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
           {/* Header */}
           <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10 sticky top-0">
              <div className="w-8 h-8 md:w-32 md:h-6 bg-gray-200 rounded animate-pulse" />
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
           </div>
           
           {/* Content Background Simulation */}
           <div className="flex-1 bg-gray-50/50 p-4 md:p-8">
              <div className="max-w-4xl mx-auto space-y-8 mt-2">
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
                 
                 <div className="w-full h-32 bg-white border border-gray-100 p-6 space-y-4 rounded shadow-sm">
                    <div className="w-40 h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="w-56 h-6 bg-gray-200 rounded animate-pulse" />
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
           </div>
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