// src/app/dashboard/settings/profile/page.tsx
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Profilo</h1>
        <p className="mt-1 text-gray-600">Gestisci informazioni account e preferenze personali.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-4 rounded-xl border">
          <div className="text-sm font-medium">Email</div>
          <div className="mt-1 text-sm text-gray-700">{data?.user?.email ?? "—"}</div>
        </div>

        <div className="p-4 rounded-xl border">
          <div className="text-sm font-medium">Nome</div>
          <div className="mt-1 text-sm text-gray-700">{data?.user?.user_metadata?.full_name ?? "—"}</div>
        </div>
      </div>
    </div>
  );
}


