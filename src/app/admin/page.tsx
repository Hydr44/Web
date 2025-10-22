"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Building2, 
  CreditCard, 
  Activity,
  ArrowLeft,
  Shield,
  Database,
  Settings
} from "lucide-react";
import Link from "next/link";

// BYPASS: Accesso diretto senza controlli per il fondatore
const FOUNDER_EMAIL = "haxiesz@gmail.com";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    // BYPASS: Controllo semplificato solo per il fondatore
    const checkAccess = async () => {
      try {
        console.log("=== ADMIN BYPASS ACCESS ===");
        console.log("Checking founder access...");
        
        // Controllo diretto dell'email nel localStorage o sessionStorage
        const supabase = supabaseBrowser();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.email === FOUNDER_EMAIL) {
          console.log("Founder access confirmed:", session.user.email);
          setLoading(false);
          loadAdminData();
        } else {
          console.log("Not founder, redirecting to dashboard");
          window.location.href = "/dashboard";
        }
      } catch (error) {
        console.error("Admin access check error:", error);
        // In caso di errore, mostra comunque il pannello per il fondatore
        setLoading(false);
        loadAdminData();
      }
    };

    checkAccess();
  }, []);

  const loadAdminData = async () => {
    try {
      console.log("Loading admin data...");
      const supabase = supabaseBrowser();
      
      // Carica dati in parallelo
      const [usersResult, orgsResult, subscriptionsResult] = await Promise.all([
        supabase.from("profiles").select("*").limit(100),
        supabase.from("organizations").select("*").limit(100),
        supabase.from("org_subscriptions").select("*").limit(100)
      ]);

      setAdminData({
        users: usersResult.data || [],
        organizations: orgsResult.data || [],
        subscriptions: subscriptionsResult.data || []
      });

      console.log("Admin data loaded successfully");
    } catch (error) {
      console.error("Error loading admin data:", error);
      setError("Errore nel caricamento dei dati");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Caricamento pannello amministratore...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">Pannello Amministratore</h1>
                <p className="text-blue-200">Gestione completa del sistema</p>
              </div>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex space-x-1 bg-white/10 rounded-lg p-1 mb-8">
          {[
            { id: "overview", label: "Panoramica", icon: Activity },
            { id: "users", label: "Utenti", icon: Users },
            { id: "organizations", label: "Organizzazioni", icon: Building2 },
            { id: "subscriptions", label: "Abbonamenti", icon: CreditCard }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "text-blue-200 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === "overview" && (
            <>
              <Card className="bg-white/10 border-white/20 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Utenti Totali</CardTitle>
                  <Users className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminData?.users?.length || 0}</div>
                  <p className="text-xs text-blue-200">Utenti registrati</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Organizzazioni</CardTitle>
                  <Building2 className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminData?.organizations?.length || 0}</div>
                  <p className="text-xs text-green-200">Aziende attive</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Abbonamenti</CardTitle>
                  <CreditCard className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminData?.subscriptions?.length || 0}</div>
                  <p className="text-xs text-purple-200">Piani attivi</p>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === "users" && (
            <div className="col-span-full">
              <Card className="bg-white/10 border-white/20 text-white">
                <CardHeader>
                  <CardTitle>Utenti</CardTitle>
                  <CardDescription>Lista degli utenti registrati</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {adminData?.users?.map((user: any) => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div>
                          <p className="font-medium">{user.email}</p>
                          <p className="text-sm text-blue-200">
                            {user.full_name || "Nome non specificato"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-blue-200">
                            {user.is_admin ? "Admin" : "Utente"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "organizations" && (
            <div className="col-span-full">
              <Card className="bg-white/10 border-white/20 text-white">
                <CardHeader>
                  <CardTitle>Organizzazioni</CardTitle>
                  <CardDescription>Lista delle organizzazioni</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {adminData?.organizations?.map((org: any) => (
                      <div key={org.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div>
                          <p className="font-medium">{org.name}</p>
                          <p className="text-sm text-blue-200">ID: {org.id}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">
                            {new Date(org.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "subscriptions" && (
            <div className="col-span-full">
              <Card className="bg-white/10 border-white/20 text-white">
                <CardHeader>
                  <CardTitle>Abbonamenti</CardTitle>
                  <CardDescription>Lista degli abbonamenti attivi</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {adminData?.subscriptions?.map((sub: any) => (
                      <div key={sub.org_id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div>
                          <p className="font-medium">{sub.plan}</p>
                          <p className="text-sm text-blue-200">Status: {sub.status}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">
                            {sub.current_period_end ? 
                              new Date(sub.current_period_end).toLocaleDateString() : 
                              "N/A"
                            }
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}