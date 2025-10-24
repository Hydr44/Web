"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import { 
  BarChart3, 
  ArrowLeft, 
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Clock,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Eye,
  MousePointer,
  Database,
  Zap
} from "lucide-react";

export default function OrgAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [orgData, setOrgData] = useState<any>(null);
  const [timeRange, setTimeRange] = useState("30d");
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const [analytics, setAnalytics] = useState({
    totalMembers: 0,
    activeMembers: 0,
    totalActivities: 0,
    activitiesThisMonth: 0,
    growthRate: 0,
    topActions: [],
    activityTrend: [],
    memberEngagement: 0,
    averageSessionTime: 0,
    peakHours: [],
    deviceUsage: {
      desktop: 0,
      mobile: 0,
      tablet: 0
    }
  });

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const supabase = supabaseBrowser();
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("Error getting user:", userError);
          setLoading(false);
          return;
        }
        
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

          // Carica dati reali dall'organizzazione
          const { data: members } = await supabase
            .from("org_members")
            .select("user_id, role, created_at")
            .eq("org_id", profile.current_org);

          const { data: transports } = await supabase
            .from("transports")
            .select("id, created_at, status")
            .eq("org_id", profile.current_org);

          const { data: vehicles } = await supabase
            .from("vehicles")
            .select("id")
            .eq("org_id", profile.current_org);

          setAnalytics({
            totalMembers: members?.length || 0,
            activeMembers: members?.length || 0,
            totalActivities: transports?.length || 0,
            activitiesThisMonth: transports?.length || 0,
            growthRate: 0,
            topActions: [],
            activityTrend: [],
            memberEngagement: 0,
            averageSessionTime: 0,
            peakHours: [],
            deviceUsage: {
              desktop: 0,
              mobile: 0,
              tablet: 0
            }
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading analytics:", error);
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [timeRange]);

  const handleRefresh = () => {
    setLastRefresh(new Date());
    // Qui si potrebbe ricaricare i dati
  };

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
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 text-sm rounded-full ring-1 ring-primary/30 px-4 py-2 mb-4 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary font-medium">
              <BarChart3 className="h-4 w-4" />
              Analytics Organizzazione
            </div>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  Analytics <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">{orgData?.name}</span>
                </h1>
                <p className="text-lg text-gray-600">
                  Monitora l'attività e le performance del tuo team
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
                >
                  <option value="7d">Ultimi 7 giorni</option>
                  <option value="30d">Ultimi 30 giorni</option>
                  <option value="90d">Ultimi 90 giorni</option>
                  <option value="1y">Ultimo anno</option>
                </select>
                <button
                  onClick={handleRefresh}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <RefreshCw className="h-5 w-5 text-gray-600" />
                </button>
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors duration-200 font-medium">
                  <Download className="h-4 w-4" />
                  Esporta
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-blue-50/30 border border-primary/20 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Membri Totali</h3>
              <p className="text-sm text-gray-600">Team completo</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {analytics.totalMembers}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-green-600 font-medium">+{analytics.growthRate}%</span>
            <span className="text-gray-500">vs mese scorso</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-green-50/30 border border-green-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Attività</h3>
              <p className="text-sm text-gray-600">Questo mese</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {analytics.activitiesThisMonth}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-green-600 font-medium">+8.2%</span>
            <span className="text-gray-500">vs mese scorso</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-purple-50/30 border border-purple-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Engagement</h3>
              <p className="text-sm text-gray-600">Membri attivi</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {analytics.memberEngagement}%
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-green-600 font-medium">+5.1%</span>
            <span className="text-gray-500">vs mese scorso</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-orange-50/30 border border-orange-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Tempo Medio</h3>
              <p className="text-sm text-gray-600">Per sessione</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {analytics.averageSessionTime}m
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingDown className="h-4 w-4 text-red-600" />
            <span className="text-red-600 font-medium">-2.3%</span>
            <span className="text-gray-500">vs mese scorso</span>
          </div>
        </div>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Activity Trend */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Trend Attività</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              Ultimi 7 giorni
            </div>
          </div>
          
          {/* Simple bar chart representation */}
          <div className="space-y-4">
            {analytics.activityTrend.map((day, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-16 text-sm text-gray-600">
                  {new Date(day.date).toLocaleDateString('it-IT', { weekday: 'short' })}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-6 bg-gradient-to-r from-primary to-blue-600 rounded-full"
                      style={{ width: `${(day.activities / 25) * 100}%` }}
                    ></div>
                    <span className="text-sm font-medium text-gray-900">{day.activities}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Actions */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Azioni Più Frequenti</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MousePointer className="h-4 w-4" />
              Questo mese
            </div>
          </div>
          
          <div className="space-y-4">
            {analytics.topActions.map((action, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{action.action}</h4>
                    <p className="text-sm text-gray-600">{action.count} volte</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{action.percentage}%</div>
                  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-blue-600"
                      style={{ width: `${action.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Device Usage and Peak Hours */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Device Usage */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Utilizzo Dispositivi</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-blue-500"></div>
                <span className="font-medium text-gray-900">Desktop</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500"
                    style={{ width: `${analytics.deviceUsage.desktop}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">{analytics.deviceUsage.desktop}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-green-500"></div>
                <span className="font-medium text-gray-900">Mobile</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500"
                    style={{ width: `${analytics.deviceUsage.mobile}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">{analytics.deviceUsage.mobile}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-purple-500"></div>
                <span className="font-medium text-gray-900">Tablet</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500"
                    style={{ width: `${analytics.deviceUsage.tablet}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">{analytics.deviceUsage.tablet}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Peak Hours */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Ore di Picco</h3>
          
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="text-center">
                <div 
                  className={`h-8 rounded-lg mb-1 ${
                    analytics.peakHours.includes(hour) 
                      ? 'bg-gradient-to-t from-primary to-blue-600' 
                      : 'bg-gray-200'
                  }`}
                ></div>
                <div className="text-xs text-gray-600">{hour}:00</div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Picco massimo:</strong> 14:00-16:00 con il 35% dell'attività totale
            </p>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Ultimo aggiornamento: {lastRefresh.toLocaleString('it-IT')}
      </div>
    </div>
  );
}
