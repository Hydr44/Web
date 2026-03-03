import { supabaseServer } from "@/lib/supabase-server";
import { 
  Users, 
  UserPlus, 
  Shield, 
  Settings,
  Crown,
  User,
  MoreHorizontal
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const supabase = await supabaseServer();
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user;

  let currentOrg: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_org")
      .eq("id", user.id)
      .maybeSingle();
    currentOrg = (profile?.current_org as string | null) ?? null;
  }

  let members: Array<{ id: string; role: string; email?: string | null }> = [];
  if (currentOrg) {
    const { data } = await supabase
      .from("org_members")
      .select("user_id, role")
      .eq("org_id", currentOrg);
    const rows = (data as { user_id: string; role: string }[] | null) ?? [];
    // join con profiles per email
    if (rows.length > 0) {
      const ids = rows.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", ids);
      const emailById = new Map((profiles as { id: string; email?: string | null }[] | null)?.map((p) => [p.id, p.email]) || []);
      members = rows.map((r) => ({ id: r.user_id, role: r.role, email: emailById.get(r.user_id) }));
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-white mb-1">Team</h1>
        <p className="text-slate-400">Gestisci i membri e i ruoli della tua organizzazione.</p>
      </header>

      {/* Statistiche team */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="p-5 rounded-xl bg-[#1e293b] border border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Membri totali</p>
              <div className="text-2xl font-bold text-white">{members.length}</div>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#1e293b] border border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Crown className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Amministratori</p>
              <div className="text-2xl font-bold text-white">{members.filter(m => m.role === 'admin').length}</div>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#1e293b] border border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center">
              <User className="h-4 w-4 text-slate-300" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Utenti</p>
              <div className="text-2xl font-bold text-white">{members.filter(m => m.role === 'user').length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista membri */}
      <div className="p-6 rounded-xl bg-[#1e293b] border border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
              <Shield className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Membri del Team</h3>
              <p className="text-sm text-slate-400">Gestisci i permessi e i ruoli</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
            <UserPlus className="h-4 w-4" />
            Invita
          </button>
        </div>

        {currentOrg ? (
          <div className="space-y-3">
            {members.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-[#1a2536] flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-medium text-slate-100 mb-2">Nessun membro trovato</h3>
                <p className="text-sm text-slate-400 mb-4">Inizia invitando il primo membro del tuo team</p>
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
                  <UserPlus className="h-4 w-4" />
                  Invita il primo membro
                </button>
              </div>
            ) : (
              members.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-4 rounded-xl bg-[#1a2536] border border-[#243044] hover:border-primary/30 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-100">{m.email ?? m.id}</div>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        {m.role === 'admin' ? (
                          <>
                            <Crown className="h-3 w-3 text-yellow-500" />
                            <span>Amministratore</span>
                          </>
                        ) : (
                          <>
                            <User className="h-3 w-3 text-blue-500" />
                            <span>Utente</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg bg-[#1a2536] hover:bg-[#243044] text-slate-400 hover:text-slate-100 transition-colors">
                      <Settings className="h-4 w-4" />
                    </button>
                    <button className="p-2 rounded-lg bg-[#1a2536] hover:bg-[#243044] text-slate-400 hover:text-slate-100 transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-[#1a2536] flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-100 mb-2">Nessuna organizzazione selezionata</h3>
            <p className="text-sm text-slate-400">Seleziona un&apos;organizzazione per vedere i membri del team</p>
          </div>
        )}
      </div>
    </div>
  );
}