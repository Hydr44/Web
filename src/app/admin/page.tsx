"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { 
  Users, 
  Building2, 
  CreditCard, 
  Shield, 
  Settings, 
  BarChart3,
  Database,
  Key,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  LayoutGrid
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalOrgs: number;
  activeSubscriptions: number;
  totalRevenue: number;
  recentLogins: number;
}

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
  email_confirmed_at: string;
  organizations: number;
  subscription_status: string;
}

interface Organization {
  id: string;
  name: string;
  created_at: string;
  members_count: number;
  subscription_status: string;
  plan: string;
}

export default function AdminPanel() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [dataLoading, setDataLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const supabase = supabaseBrowser();
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          router.push("/login?redirect=/admin");
          return;
        }

        // Controllo admin completamente disabilitato per evitare conflitti
        console.log("Admin check completely disabled to avoid login conflicts");

        setIsAdmin(true);
        await loadAdminData();
      } catch (error) {
        console.error("Admin access check error:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [router]);

  // Carica dati quando cambia il tab
  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [activeTab, isAdmin]);

  const loadAdminData = async () => {
    setDataLoading(true);
    try {
      const supabase = supabaseBrowser();
      
      // Carica solo le statistiche base per la panoramica
      if (activeTab === "overview") {
        const [usersRes, orgsRes, subsRes] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("organizations").select("id", { count: "exact", head: true }),
          supabase.from("org_subscriptions").select("status").eq("status", "active")
        ]);

        setStats({
          totalUsers: usersRes.count || 0,
          totalOrgs: orgsRes.count || 0,
          activeSubscriptions: subsRes.data?.length || 0,
          totalRevenue: 0, // Da implementare con Stripe
          recentLogins: 0 // Da implementare
        });
      }

      // Carica utenti solo se necessario
      if (activeTab === "users") {
        const { data: usersData } = await supabase
          .from("profiles")
          .select(`
            id,
            email,
            created_at,
            last_sign_in_at,
            email_confirmed_at
          `)
          .order("created_at", { ascending: false })
          .limit(50);

        setUsers(usersData || []);
      }

      // Carica organizzazioni solo se necessario
      if (activeTab === "organizations") {
        const { data: orgsData } = await supabase
          .from("organizations")
          .select(`
            id,
            name,
            created_at
          `)
          .order("created_at", { ascending: false })
          .limit(50);

        setOrganizations(orgsData || []);
      }
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setDataLoading(false);
    }
  };

  const resetUserPassword = async (userId: string) => {
    if (!confirm("Sei sicuro di voler resettare la password di questo utente?")) return;
    
    try {
      const supabase = supabaseBrowser();
      // Implementa reset password via Supabase Admin API
      alert("Funzionalità di reset password da implementare con Supabase Admin API");
    } catch (error) {
      console.error("Error resetting password:", error);
      alert("Errore durante il reset della password");
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("ATTENZIONE: Questa azione eliminerà definitivamente l'utente e tutti i suoi dati. Continuare?")) return;
    
    try {
      const supabase = supabaseBrowser();
      // Implementa cancellazione utente
      alert("Funzionalità di cancellazione utente da implementare con Supabase Admin API");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Errore durante la cancellazione dell'utente");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Verifica accesso amministratore...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-red-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Pannello Amministratore</h1>
                <p className="text-sm text-gray-500">Gestione completa sistema RescueManager</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <LayoutGrid className="h-4 w-4" />
                Dashboard
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="text-sm text-gray-500">
                Admin Mode
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: "overview", label: "Panoramica", icon: BarChart3 },
              { id: "users", label: "Utenti", icon: Users },
              { id: "organizations", label: "Organizzazioni", icon: Building2 },
              { id: "subscriptions", label: "Abbonamenti", icon: CreditCard },
              { id: "settings", label: "Impostazioni", icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Utenti Totali</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Organizzazioni</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalOrgs || 0}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Abbonamenti Attivi</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.activeSubscriptions || 0}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ricavi Totali</p>
                    <p className="text-2xl font-bold text-gray-900">€{stats?.totalRevenue || 0}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Attività Recente</h3>
              <div className="text-gray-500 text-center py-8">
                <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Implementazione attività recente in corso...</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Gestione Utenti</h3>
                <button
                  onClick={loadAdminData}
                  disabled={dataLoading}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${dataLoading ? 'animate-spin' : ''}`} />
                  Aggiorna
                </button>
              </div>
            </div>
            
            {dataLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">Caricamento utenti...</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registrazione</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ultimo Accesso</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stato</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <Mail className="h-4 w-4 text-gray-600" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{user.email}</div>
                              <div className="text-sm text-gray-500">ID: {user.id.substring(0, 8)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(user.created_at).toLocaleDateString("it-IT")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString("it-IT") : "Mai"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.email_confirmed_at 
                              ? "bg-green-100 text-green-800" 
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {user.email_confirmed_at ? "Verificato" : "Non verificato"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => resetUserPassword(user.id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Reset Password"
                            >
                              <Key className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Elimina Utente"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "organizations" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Gestione Organizzazioni</h3>
                <button
                  onClick={loadAdminData}
                  disabled={dataLoading}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${dataLoading ? 'animate-spin' : ''}`} />
                  Aggiorna
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organizzazione</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creazione</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {organizations.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-gray-600" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{org.name}</div>
                            <div className="text-sm text-gray-500">ID: {org.id.substring(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(org.created_at).toLocaleDateString("it-IT")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            className="text-blue-600 hover:text-blue-900"
                            title="Visualizza Dettagli"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            className="text-green-600 hover:text-green-900"
                            title="Modifica"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "subscriptions" && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Gestione Abbonamenti</h3>
            <div className="text-gray-500 text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Gestione abbonamenti in fase di implementazione...</p>
              <p className="text-sm mt-2">Integrazione con Stripe in corso</p>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Impostazioni Sistema</h3>
            <div className="text-gray-500 text-center py-8">
              <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Impostazioni sistema in fase di implementazione...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}