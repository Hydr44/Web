"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import { 
  UserPlus, 
  ArrowLeft, 
  Mail, 
  Users,
  Shield,
  Crown,
  User,
  Send,
  CheckCircle,
  AlertCircle,
  Copy,
  Eye,
  EyeOff
} from "lucide-react";

export default function InviteMemberPage() {
  const [loading, setLoading] = useState(false);
  const [orgData, setOrgData] = useState<any>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInviteLink, setShowInviteLink] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    role: "member",
    message: "",
    sendEmail: true
  });

  const [inviteLink, setInviteLink] = useState("");

  useEffect(() => {
    const loadOrgData = async () => {
      try {
        const supabase = supabaseBrowser();
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("Error getting user:", userError);
          return;
        }
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("current_org")
          .eq("id", user.id)
          .single();
        
        if (profile?.current_org) {
          const { data: org, error: orgError } = await supabase
            .from("orgs")
            .select("*")
            .eq("id", profile.current_org)
            .single();
          
          if (org) {
            setOrgData(org);
            // Genera link di invito
            setInviteLink(`${window.location.origin}/dashboard/org/join?token=${org.id}&org=${org.name}`);
          }
        }
      } catch (error) {
        console.error("Error loading org data:", error);
      }
    };

    loadOrgData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const supabase = supabaseBrowser();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("current_org")
        .eq("id", user.id)
        .single();

      if (profile?.current_org) {
        // Qui implementeresti la logica per inviare l'invito
        // Per ora simuliamo il successo
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setSuccess(true);
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (error) {
      setError("Errore durante l'invio dell'invito");
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    // Qui potresti aggiungere un toast di conferma
  };

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

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "owner":
        return "Accesso completo a tutte le funzionalità";
      case "admin":
        return "Gestione utenti e impostazioni organizzazione";
      case "member":
        return "Accesso standard alle funzionalità";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <div className="flex items-center gap-4 mb-6">
          <Link 
            href="/dashboard/org/members"
            className="p-2 rounded-lg hover:bg-[#1a2536] transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-slate-400" />
          </Link>
          <div>
            <div className="inline-flex items-center gap-2 text-sm rounded-full ring-1 ring-primary/30 px-4 py-2 mb-4 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary font-medium">
              <UserPlus className="h-4 w-4" />
              Invita Membro
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-100 mb-2">
              Invita nuovo <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">membro</span>
            </h1>
            <p className="text-lg text-slate-400">
              Aggiungi un nuovo membro al team di {orgData?.name}
            </p>
          </div>
        </div>
      </header>

      {/* Success/Error Messages */}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-400" />
          <span className="text-green-800 font-medium">Invito inviato con successo!</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <span className="text-red-800 font-medium">{error}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Invite Form */}
        <div className="bg-[#1a2536] rounded-2xl border border-[#243044] ">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-slate-100 mb-6">Invita via Email</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email del membro
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-[#243044] rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-primary transition-colors duration-200"
                    placeholder="membro@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Ruolo
                </label>
                <div className="space-y-3">
                  {[
                    { value: "member", label: "Membro", icon: User, color: "green" },
                    { value: "admin", label: "Amministratore", icon: Shield, color: "blue" }
                  ].map((role) => (
                    <label key={role.value} className="flex items-center gap-3 p-4 rounded-xl border border-[#243044] hover:border-primary/30 cursor-pointer transition-colors duration-200">
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={formData.role === role.value}
                        onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                        className="sr-only"
                      />
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        formData.role === role.value 
                          ? `bg-${role.color}-100` 
                          : 'bg-[#1a2536]'
                      }`}>
                        <role.icon className={`h-4 w-4 ${
                          formData.role === role.value 
                            ? `text-${role.color}-600` 
                            : 'text-slate-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-100">{role.label}</div>
                        <div className="text-sm text-slate-400">{getRoleDescription(role.value)}</div>
                      </div>
                      {formData.role === role.value && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <CheckCircle className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Messaggio personalizzato (opzionale)
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border border-[#243044] rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-primary transition-colors duration-200"
                  placeholder="Ciao! Ti invito a unirti al nostro team su RescueManager..."
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="sendEmail"
                  checked={formData.sendEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, sendEmail: e.target.checked }))}
                  className="w-4 h-4 text-primary bg-[#1a2536] border-[#243044] rounded focus:ring-blue-500/20"
                />
                <label htmlFor="sendEmail" className="text-sm text-slate-300">
                  Invia notifica email al membro
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Invio in corso...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Invia Invito
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Invite Link */}
        <div className="bg-[#1a2536] rounded-2xl border border-[#243044] ">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-slate-100 mb-6">Link di Invito</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Link di invito pubblico
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type={showInviteLink ? "text" : "password"}
                    value={inviteLink}
                    readOnly
                    className="flex-1 px-4 py-3 border border-[#243044] rounded-xl bg-[#141c27] text-sm"
                  />
                  <button
                    onClick={() => setShowInviteLink(!showInviteLink)}
                    className="p-2 rounded-lg hover:bg-[#1a2536] transition-colors duration-200"
                  >
                    {showInviteLink ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={copyInviteLink}
                    className="p-2 rounded-lg hover:bg-[#1a2536] transition-colors duration-200"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-slate-400 mt-2">
                  Condividi questo link per permettere a chiunque di richiedere l'accesso
                </p>
              </div>

              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <h3 className="font-medium text-blue-900 mb-2">Come funziona</h3>
                <ul className="text-sm text-blue-400 space-y-1">
                  <li>• Il link può essere condiviso con chiunque</li>
                  <li>• I nuovi membri dovranno registrarsi</li>
                  <li>• Dovrai approvare la loro richiesta</li>
                  <li>• Riceverai una notifica per ogni richiesta</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={copyInviteLink}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#1a2536] border border-[#243044] text-slate-300 rounded-xl hover:border-primary/30 hover:shadow-md transition-all duration-200 font-medium"
                >
                  <Copy className="h-4 w-4" />
                  Copia Link
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors duration-200 font-medium">
                  <Mail className="h-4 w-4" />
                  Invia via Email
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Organization Info */}
      <div className="bg-[#1a2536] rounded-2xl border border-[#243044] ">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-slate-100 mb-6">Informazioni Organizzazione</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-slate-100 mb-2">Nome Organizzazione</h3>
              <p className="text-slate-400">{orgData?.name || "Caricamento..."}</p>
            </div>
            <div>
              <h3 className="font-medium text-slate-100 mb-2">Membri Attuali</h3>
              <p className="text-slate-400">{orgData?.member_count || 0} membri</p>
            </div>
            <div>
              <h3 className="font-medium text-slate-100 mb-2">Creato il</h3>
              <p className="text-slate-400">
                {orgData?.created_at ? new Date(orgData.created_at).toLocaleDateString('it-IT') : "N/A"}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-slate-100 mb-2">Stato</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500/100"></div>
                <span className="text-emerald-400 font-medium">Attiva</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
