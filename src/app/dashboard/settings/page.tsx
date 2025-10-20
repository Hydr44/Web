// src/app/dashboard/settings/page.tsx
import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import SettingsClient from "@/components/dashboard/settings/SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/dashboard/settings");

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
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-semibold">Impostazioni</h1>
      <p className="mt-2 text-gray-600">
        Gestisci profilo, azienda, preferenze e sicurezza dell’account.
      </p>

      <div className="mt-8">
        <SettingsClient
          userId={user.id}
          email={user.email ?? ""}
          initialProfile={profile ?? null}
        />
      </div>
    </main>
  );
}