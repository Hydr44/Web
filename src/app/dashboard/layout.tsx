// src/app/dashboard/layout.tsx
import SiteHeader from "@/components/SiteHeader";
import DashboardShell from "@/components/dashboard/Shell";
import Breadcrumbs from "@/components/dashboard/Breadcrumbs";
import { supabaseServer } from "@/lib/supabase-server";

// Evita caching del layout: l'email/refreshed session devono essere sempre fresh
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await supabaseServer();

  // Non far crashare il layout se manca la sessione
  let userEmail = "";
  let currentOrgName = "";
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data?.user?.email) {
      userEmail = data.user.email;
      const { data: profile } = await supabase.from("profiles").select("current_org").eq("id", data.user.id).maybeSingle();
      if (profile?.current_org) {
        const { data: org } = await supabase.from("organizations").select("name").eq("id", profile.current_org).maybeSingle();
        currentOrgName = org?.name ?? "";
      }
    }
  } catch {
    // ignora: userEmail rimane stringa vuota
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