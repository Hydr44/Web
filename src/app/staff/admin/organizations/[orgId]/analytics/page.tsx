"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft,
  Building2,
  Users,
  Activity,
  TrendingUp,
  Calendar,
  BarChart3,
  PieChart,
  LineChart
} from "lucide-react";
import { useRouter } from "next/navigation";

interface OrganizationAnalytics {
  member_count: number;
  active_users: number;
  total_activity: number;
  growth_rate: number;
  last_activity: string;
  monthly_stats?: {
    month: string;
    users: number;
    activity: number;
  }[];
  top_activities?: {
    name: string;
    count: number;
    percentage: number;
  }[];
}

interface Organization {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  member_count: number;
  created_at: string;
}

export default function OrganizationAnalyticsPage({ params }: { params: { orgId: string } }) {
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [analytics, setAnalytics] = useState<OrganizationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrganizationData();
  }, [params.orgId]);

  const loadOrganizationData = async () => {
    try {
      setLoading(true);
      
      // Load organization details
      const orgResponse = await fetch(`/api/staff/admin/organizations/${params.orgId}/view`, {
        method: 'POST'
      });
      const orgData = await orgResponse.json();
      
      if (orgData.success) {
        setOrganization(orgData.organization);
      }

      // Load analytics
      const analyticsResponse = await fetch(`/api/staff/admin/organizations/${params.orgId}/analytics`, {
        method: 'POST'
      });
      const analyticsData = await analyticsResponse.json();
      
      if (analyticsData.success) {
        setAnalytics(analyticsData.analytics);
      }
    } catch (error) {
      console.error('Error loading organization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-16 w-16 border-2 border-blue-200 border-t-blue-600 mx-auto"
            style={{ animation: 'spin 1s linear infinite' }}
          ></div>
          <p className="mt-4 text-gray-600">Caricamento analytics...</p>
        </div>
      </div>
    );
  }

  if (!organization || !analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Organizzazione non trovata</h2>
          <p className="text-gray-600 mb-6">L'organizzazione richiesta non esiste o non hai i permessi per visualizzarla.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Torna indietro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Organizzazione</h1>
              <p className="text-gray-600 mt-2">{organization.name}</p>
            </div>
          </div>
        </div>

        {/* Organization Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-900">{organization.name}</h2>
              <p className="text-gray-600">{organization.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Telefono</p>
              <p className="font-medium">{organization.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Indirizzo</p>
              <p className="font-medium">{organization.address || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Membri</p>
              <p className="font-medium">{organization.member_count}</p>
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Utenti Attivi</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.active_users}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Attività Totale</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.total_activity}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-purple-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tasso di Crescita</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.growth_rate}%</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-orange-50 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ultima Attività</p>
                <p className="text-sm font-bold text-gray-900">
                  {formatDate(analytics.last_activity)}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Activity Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center mb-4">
              <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Attività Mensile</h3>
            </div>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Grafico attività in sviluppo</p>
              </div>
            </div>
          </motion.div>

          {/* User Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center mb-4">
              <PieChart className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Distribuzione Utenti</h3>
            </div>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Grafico distribuzione in sviluppo</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Riepilogo Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{analytics.member_count}</p>
              <p className="text-sm text-gray-600">Totale Membri</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{analytics.active_users}</p>
              <p className="text-sm text-gray-600">Utenti Attivi</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{analytics.growth_rate}%</p>
              <p className="text-sm text-gray-600">Tasso di Crescita</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
