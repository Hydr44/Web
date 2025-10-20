// src/app/dashboard/layout.tsx
import SiteHeader from "@/components/SiteHeader";
import DashboardShell from "@/components/dashboard/Shell";
import { supabaseServer } from "@/lib/supabase-server";

// Evita caching del layout: l'email/refreshed session devono essere sempre fresh
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = supabaseServer();

  // Non far crashare il layout se manca la sessione
  let userEmail = "";
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data?.user?.email) {
      userEmail = data.user.email;
    }
  } catch {
    // ignora: userEmail rimane stringa vuota
  }

  return (
    <>
      <SiteHeader />
      <DashboardShell userEmail={userEmail}>{children}</DashboardShell>
    </>
  );
}