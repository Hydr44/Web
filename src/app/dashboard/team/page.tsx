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
      <header className="text-center lg:text-left">
        <div className="inline-flex items-center gap-2 text-sm rounded-full ring-1 ring-primary/30 px-4 py-2 mb-6 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary font-medium">
          <Users className="h-4 w-4" />
          Gestione Team
        </div>
        
        <h1 className="text-3xl lg:text-4xl font-bold text-slate-100 mb-4">
          Team & <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">ruoli</span>
        </h1>
        
        <p className="text-lg text-slate-400 max-w-2xl">
          Invita collaboratori, assegna ruoli e permessi per gestire il tuo team in modo efficiente.
        </p>
      </header>

      {/* Statistiche team */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-gray-50/50 border border-[#243044] shadow-lg shadow-black/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Membri Totali</h3>
              <p className="text-sm text-slate-400">Team attivo</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-100">{members.length}</div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-blue-50/30 border border-primary/20 shadow-lg shadow-black/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 flex items-center justify-center">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Amministratori</h3>
              <p className="text-sm text-slate-400">Ruolo admin</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-100">
            {members.filter(m => m.role === 'admin').length}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-purple-50/30 border border-purple-200/50 shadow-lg shadow-black/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Utenti</h3>
              <p className="text-sm text-slate-400">Ruolo user</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-100">
            {members.filter(m => m.role === 'user').length}
          </div>
        </div>
      </div>

      {/* Lista membri */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-gray-50/50 border border-[#243044] shadow-lg shadow-black/20">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Membri del Team</h3>
              <p className="text-sm text-slate-400">Gestisci i permessi e i ruoli</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 text-white text-sm font-medium hover:shadow-lg shadow-black/20 transition-all duration-200">
            <UserPlus className="h-4 w-4" />
            Invita utente
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
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 text-white text-sm font-medium hover:shadow-lg shadow-black/20 transition-all duration-200">
                  <UserPlus className="h-4 w-4" />
                  Invita il primo membro
                </button>
              </div>
            ) : (
              members.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-4 rounded-xl bg-[#1a2536] border border-[#243044] hover:border-primary/30 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 flex items-center justify-center">
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