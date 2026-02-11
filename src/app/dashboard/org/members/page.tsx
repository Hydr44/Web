"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  Shield,
  Crown,
  User,
  Eye,
  Edit,
  Trash2,
  ArrowLeft
} from "lucide-react";

export default function MembersPage() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [orgData, setOrgData] = useState<any>(null);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const supabase = supabaseBrowser();
        
        // Ottieni l'utente corrente
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("Error getting user:", userError);
          setLoading(false);
          return;
        }
        
        // Carica dati organizzazione
        const { data: profile } = await supabase
          .from("profiles")
          .select("current_org")
          .eq("id", user.id)
          .single();
        
        if (profile?.current_org) {
          // Carica organizzazione
          const { data: org, error: orgError } = await supabase
            .from("orgs")
            .select("*")
            .eq("id", profile.current_org)
            .single();
          
          if (org) {
            setOrgData(org);
          }

          // Carica membri dell'organizzazione
          const { data: membersData, error: membersError } = await supabase
            .from("org_members")
            .select(`
              user_id,
              role,
              created_at
            `)
            .eq("org_id", profile.current_org);
          
          if (membersError) {
            console.error("Error loading members:", membersError);
          } else if (membersData) {
            // Per ora mostriamo solo i dati base senza join
            const formattedMembers = membersData.map(member => ({
              user_id: member.user_id,
              role: member.role,
              joined_at: member.created_at,
              email: "N/A", // Da implementare con query separata se necessario
              full_name: "N/A",
              avatar_url: null,
              status: "active"
            }));
            setMembers(formattedMembers);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading members:", error);
        setLoading(false);
      }
    };

    loadMembers();
  }, []);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4 text-amber-600" />;
      case "admin":
        return <Shield className="h-4 w-4 text-blue-400" />;
      case "member":
        return <User className="h-4 w-4 text-emerald-400" />;
      default:
        return <User className="h-4 w-4 text-slate-400" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "admin":
        return "bg-blue-500/15 text-blue-400 border-blue-500/20";
      case "member":
        return "bg-emerald-500/15 text-green-800 border-emerald-500/20";
      default:
        return "bg-[#1a2536] text-slate-200 border-[#243044]";
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || member.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <div className="flex items-center gap-4 mb-6">
          <Link 
            href="/dashboard/org"
            className="p-2 rounded-lg hover:bg-[#1a2536] transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-slate-400" />
          </Link>
          <div>
            <div className="inline-flex items-center gap-2 text-sm rounded-full ring-1 ring-primary/30 px-4 py-2 mb-4 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary font-medium">
              <Users className="h-4 w-4" />
              Gestione Membri
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-100 mb-2">
              Team <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">{orgData?.name}</span>
            </h1>
            <p className="text-lg text-slate-400">
              Gestisci i membri del tuo team e i loro permessi
            </p>
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Cerca membri..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-[#243044] rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-primary transition-colors duration-200 w-full sm:w-64"
            />
          </div>

          {/* Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-[#243044] rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-primary transition-colors duration-200"
          >
            <option value="all">Tutti i ruoli</option>
            <option value="owner">Proprietario</option>
            <option value="admin">Amministratore</option>
            <option value="member">Membro</option>
          </select>
        </div>

        {/* Add Member Button */}
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors duration-200 font-medium">
          <UserPlus className="h-4 w-4" />
          Invita Membro
        </button>
      </div>

      {/* Members List */}
      <div className="grid gap-4">
        {filteredMembers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-[#1a2536] flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-100 mb-2">
              {searchTerm || filterRole !== "all" ? "Nessun membro trovato" : "Nessun membro nel team"}
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              {searchTerm || filterRole !== "all" 
                ? "Prova a modificare i filtri di ricerca" 
                : "Invita i primi membri del tuo team"}
            </p>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors duration-200 font-medium">
              <UserPlus className="h-4 w-4" />
              Invita Primo Membro
            </button>
          </div>
        ) : (
          filteredMembers.map((member) => (
            <div key={member.user_id} className="p-6 rounded-2xl bg-[#1a2536] border border-[#243044]  hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 flex items-center justify-center text-white font-semibold">
                    {member.profiles?.full_name?.charAt(0)?.toUpperCase() || 
                     member.profiles?.email?.charAt(0)?.toUpperCase() || "?"}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-slate-100">
                        {member.profiles?.full_name || "Nome non disponibile"}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(member.role)}`}>
                        {getRoleIcon(member.role)}
                        {member.role === "owner" ? "Proprietario" : 
                         member.role === "admin" ? "Amministratore" : "Membro"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">
                      {member.profiles?.email}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Aggiunto il {new Date(member.created_at).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-[#1a2536] transition-colors duration-200">
                    <Eye className="h-4 w-4 text-slate-400" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-[#1a2536] transition-colors duration-200">
                    <Edit className="h-4 w-4 text-slate-400" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-[#1a2536] transition-colors duration-200">
                    <MoreVertical className="h-4 w-4 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-blue-50/30 border border-primary/20 ">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-400" />
            </div>
            <h3 className="text-sm font-medium text-slate-100">Totale Membri</h3>
          </div>
          <div className="text-2xl font-bold text-slate-100">{members.length}</div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-green-50/30 border border-emerald-500/20/50 ">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Shield className="h-4 w-4 text-emerald-400" />
            </div>
            <h3 className="text-sm font-medium text-slate-100">Amministratori</h3>
          </div>
          <div className="text-2xl font-bold text-slate-100">
            {members.filter(m => m.role === "admin" || m.role === "owner").length}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-purple-50/30 border border-purple-200/50 ">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <User className="h-4 w-4 text-purple-400" />
            </div>
            <h3 className="text-sm font-medium text-slate-100">Membri Attivi</h3>
          </div>
          <div className="text-2xl font-bold text-slate-100">
            {members.filter(m => m.role === "member").length}
          </div>
        </div>
      </div>
    </div>
  );
}
