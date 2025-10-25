"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Building2, 
  Activity, 
  Clock,
  Database,
  Server,
  Zap,
  Eye,
  Download,
  RefreshCw
} from "lucide-react";
import { SimpleLoadingPage } from "@/components/ui/SimpleLoader";

interface AnalyticsData {
  overview: {
    total_users: number;
    total_organizations: number;
    total_staff: number;
    active_sessions: number;
    total_leads: number;
  };
  growth: {
    users: {
      total: number;
      recent: number;
      rate: number;
      chart: Array<{ date: string; users: number; admins: number }>;
    };
    organizations: {
      total: number;
      recent: number;
      rate: number;
      chart: Array<{ date: string; organizations: number }>;
    };
    leads: {
      total: number;
      recent: number;
      rate: number;
      by_status: Record<string, number>;
      by_type: Record<string, number>;
      by_priority: Record<string, number>;
    };
  };
  system: {
    uptime: number;
    response_time: number;
    error_rate: number;
    database_size: string;
    last_backup: string;
    active_connections: number;
    memory_usage: number;
    cpu_usage: number;
  };
  performance: {
    page_views: number;
    unique_visitors: number;
    bounce_rate: number;
    avg_session_duration: number;
    conversion_rate: number;
    top_pages: Array<{ page: string; views: number; unique: number }>;
  };
  top_actions: Array<{ action: string; count: number }>;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('all');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange, selectedMetric]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/staff/admin/analytics/stats?timeRange=${timeRange}&metric=${selectedMetric}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.stats);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'converted': return 'bg-green-100 text-green-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <SimpleLoadingPage text="Caricamento analytics..." />;
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-xl shadow-lg">
          <p className="text-red-600 font-semibold">Errore nel caricamento delle analytics</p>
          <button
            onClick={loadAnalytics}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-lg text-gray-600">Analisi dettagliate e metriche di performance della piattaforma</p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7d">Ultimi 7 giorni</option>
              <option value="30d">Ultimi 30 giorni</option>
              <option value="90d">Ultimi 90 giorni</option>
            </select>
            
            <button
              onClick={loadAnalytics}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Aggiorna
            </button>
            
            <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Esporta
            </button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Utenti Totali</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.overview.total_users}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-4">
              <span className="text-sm text-green-600 font-medium">
                +{analytics.growth.users.recent} questo periodo
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Organizzazioni</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.overview.total_organizations}</p>
              </div>
              <Building2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-4">
              <span className="text-sm text-green-600 font-medium">
                +{analytics.growth.organizations.recent} questo periodo
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Staff</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.overview.total_staff}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-500">Personale interno</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sessioni Attive</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.overview.active_sessions}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-500">Utenti online</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lead Totali</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.overview.total_leads}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-600" />
            </div>
            <div className="mt-4">
              <span className="text-sm text-green-600 font-medium">
                +{analytics.growth.leads.recent} questo periodo
              </span>
            </div>
          </motion.div>
        </div>

        {/* System Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Server className="h-5 w-5 mr-2 text-blue-600" />
              System Health
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Uptime</span>
                <span className="font-semibold text-green-600">{analytics.system.uptime}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Response Time</span>
                <span className="font-semibold">{analytics.system.response_time}ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Error Rate</span>
                <span className="font-semibold text-red-600">{analytics.system.error_rate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Connections</span>
                <span className="font-semibold">{analytics.system.active_connections}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Memory Usage</span>
                <span className="font-semibold">{analytics.system.memory_usage}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">CPU Usage</span>
                <span className="font-semibold">{analytics.system.cpu_usage}%</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
              Performance
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Page Views</span>
                <span className="font-semibold">{analytics.performance.page_views.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Unique Visitors</span>
                <span className="font-semibold">{analytics.performance.unique_visitors.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Bounce Rate</span>
                <span className="font-semibold">{analytics.performance.bounce_rate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg Session Duration</span>
                <span className="font-semibold">{analytics.performance.avg_session_duration} min</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Conversion Rate</span>
                <span className="font-semibold text-green-600">{analytics.performance.conversion_rate}%</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Lead Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Lead per Status</h3>
            <div className="space-y-3">
              {Object.entries(analytics.growth.leads.by_status).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                    {status}
                  </span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Lead per Tipo</h3>
            <div className="space-y-3">
              {Object.entries(analytics.growth.leads.by_type).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-gray-600 capitalize">{type}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Lead per Priorità</h3>
            <div className="space-y-3">
              {Object.entries(analytics.growth.leads.by_priority).map(([priority, count]) => (
                <div key={priority} className="flex justify-between items-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(priority)}`}>
                    {priority}
                  </span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Top Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-purple-600" />
            Top Actions
          </h3>
          <div className="space-y-3">
            {analytics.top_actions.map((action, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-600">{action.action}</span>
                <span className="font-semibold">{action.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}