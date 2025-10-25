"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
// Removed direct Supabase import - using API routes instead
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target, 
  Building2, 
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Activity,
  Eye,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

interface AnalyticsData {
  totalLeads: number;
  totalOrgs: number;
  totalUsers: number;
  totalTransports: number;
  totalVehicles: number;
  totalDrivers: number;
  leadsByType: { type: string; count: number }[];
  leadsByStatus: { status: string; count: number }[];
  leadsByMonth: { month: string; count: number }[];
  recentLeads: any[];
  topSources: { source: string; count: number }[];
  conversionRate: number;
  averageResponseTime: number;
}

export default function StaffAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalLeads: 0,
    totalOrgs: 0,
    totalUsers: 0,
    totalTransports: 0,
    totalVehicles: 0,
    totalDrivers: 0,
    leadsByType: [],
    leadsByStatus: [],
    leadsByMonth: [],
    recentLeads: [],
    topSources: [],
    conversionRate: 0,
    averageResponseTime: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Load analytics data via API
      const response = await fetch('/api/staff/analytics');
      const result = await response.json();
      
      if (!result.success) {
        console.error('Error loading analytics:', result.error);
        return;
      }

      const {
        leads,
        orgs,
        profiles,
        transports,
        vehicles,
        drivers
      } = result.data;

      // Calculate analytics
      const leadsByType = leads.reduce((acc: any, lead: any) => {
        acc[lead.type] = (acc[lead.type] || 0) + 1;
        return acc;
      }, {});

      const leadsByStatus = leads.reduce((acc: any, lead: any) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {});

      const leadsByMonth = leads.reduce((acc: any, lead: any) => {
        const month = new Date(lead.created_at).toLocaleDateString('it-IT', { month: 'short', year: 'numeric' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {});

      const topSources = leads.reduce((acc: any, lead: any) => {
        acc[lead.source] = (acc[lead.source] || 0) + 1;
        return acc;
      }, {});

      const convertedLeads = leads.filter((lead: any) => lead.status === 'converted').length;
      const conversionRate = leads.length > 0 ? (convertedLeads / leads.length) * 100 : 0;

      // Calculate average response time (mock for now)
      const averageResponseTime = 2.5; // hours

      setAnalytics({
        totalLeads: leads.length,
        totalOrgs: orgs.length,
        totalUsers: profiles.length,
        totalTransports: transports.length,
        totalVehicles: vehicles.length,
        totalDrivers: drivers.length,
        leadsByType: Object.entries(leadsByType).map(([type, count]) => ({ type, count: count as number })),
        leadsByStatus: Object.entries(leadsByStatus).map(([status, count]) => ({ status, count: count as number })),
        leadsByMonth: Object.entries(leadsByMonth).map(([month, count]) => ({ month, count: count as number })),
        recentLeads: leads.slice(0, 5),
        topSources: Object.entries(topSources).map(([source, count]) => ({ source, count: count as number })),
        conversionRate,
        averageResponseTime
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">Analytics</span> Sistema
          </h1>
          <p className="text-gray-600">
            Monitora le performance e le metriche del sistema
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Totale Lead</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalLeads}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Organizzazioni</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalOrgs}</p>
              </div>
              <Building2 className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Utenti</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Trasporti</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalTransports}</p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Veicoli</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalVehicles}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Autisti</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalDrivers}</p>
              </div>
              <Users className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasso di Conversione</h3>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-green-600">
                {analytics.conversionRate.toFixed(1)}%
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Lead convertiti su totale
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tempo di Risposta Medio</h3>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-blue-600">
                {analytics.averageResponseTime}h
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Tempo medio per contattare un lead
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Leads by Type */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead per Tipo</h3>
            <div className="space-y-3">
              {analytics.leadsByType.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      item.type === 'demo' ? 'bg-blue-500' :
                      item.type === 'quote' ? 'bg-green-500' : 'bg-purple-500'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {item.type}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Leads by Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead per Status</h3>
            <div className="space-y-3">
              {analytics.leadsByStatus.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      item.status === 'new' ? 'bg-blue-500' :
                      item.status === 'contacted' ? 'bg-yellow-500' :
                      item.status === 'converted' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {item.status}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Leads */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Recenti</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics.recentLeads.map((lead: any) => (
                  <tr key={lead.id}>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{lead.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{lead.email}</td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {lead.type}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                        lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                        lead.status === 'converted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {new Date(lead.created_at).toLocaleDateString('it-IT')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
