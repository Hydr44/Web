// src/app/dashboard/settings/page.tsx
import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import SettingsClient from "@/components/dashboard/settings/SettingsClient";
import { Settings, User, Shield, Bell } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let userId: string | null = null;
  let userEmail: string | null = null;
  const supabase = await supabaseServer();
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return redirect("/login?redirect=/dashboard/settings");
    userId = user.id;
    userEmail = user.email ?? null;
  } catch {
    return redirect("/login?redirect=/dashboard/settings");
  }

  // fetch profilo (se manca la riga, ne creiamo una di comodo lato client con upsert)
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `
      user_id,
      full_name,
      company_name,
      vat_number,
      billing_address,
      phone,
      locale,
      timezone,
      notifications
    `
    )
    .eq("user_id", userId!)
    .maybeSingle();

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="text-center lg:text-left">
        <div className="inline-flex items-center gap-2 text-sm rounded-full ring-1 ring-primary/30 px-4 py-2 mb-6 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary font-medium">
          <Settings className="h-4 w-4" />
          Impostazioni Account
        </div>
        
        <h1 className="text-3xl lg:text-4xl font-bold text-slate-100 mb-4">
          Le tue <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">impostazioni</span>
        </h1>
        
        <p className="text-lg text-slate-400 max-w-2xl">
          Gestisci il tuo profilo, le informazioni aziendali, le preferenze e la sicurezza del tuo account.
        </p>
      </header>

      {/* Sezioni impostazioni */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Profilo */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-gray-50/50 border border-[#243044] shadow-lg shadow-black/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Profilo</h3>
              <p className="text-sm text-slate-400">Informazioni personali</p>
            </div>
          </div>
          <div className="text-sm text-slate-400">
            Nome, email, informazioni di contatto e preferenze personali.
          </div>
        </div>

        {/* Sicurezza */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-blue-50/30 border border-primary/20 shadow-lg shadow-black/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Sicurezza</h3>
              <p className="text-sm text-slate-400">Password e accessi</p>
            </div>
          </div>
          <div className="text-sm text-slate-400">
            Gestisci password, autenticazione a due fattori e sessioni attive.
          </div>
        </div>

        {/* Notifiche */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-purple-50/30 border border-purple-200/50 shadow-lg shadow-black/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Notifiche</h3>
              <p className="text-sm text-slate-400">Preferenze comunicazioni</p>
            </div>
          </div>
          <div className="text-sm text-slate-400">
            Configura email, SMS e notifiche push per rimanere aggiornato.
          </div>
        </div>
      </div>

      {/* Form impostazioni */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-gray-50/50 border border-[#243044] shadow-lg shadow-black/20">
        <SettingsClient
          userId={userId!}
          email={userEmail ?? ""}
          initialProfile={profile ?? null}
        />
      </div>
    </div>
  );
}