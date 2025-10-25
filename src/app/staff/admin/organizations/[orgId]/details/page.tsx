"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft,
  Building2,
  Users,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  UserPlus
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Organization {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  vat: string;
  tax_code: string;
  description: string;
  created_at: string;
  updated_at: string;
  member_count: number;
  admin_name: string;
}

export default function OrganizationDetailsPage({ params }: { params: { orgId: string } }) {
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrganizationData();
  }, [params.orgId]);

  const loadOrganizationData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/staff/admin/organizations/${params.orgId}/view`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setOrganization(data.organization);
      } else {
        console.error('Error loading organization:', data.error);
      }
    } catch (error) {
      console.error('Error loading organization:', error);
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
          <p className="mt-4 text-gray-600">Caricamento organizzazione...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
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
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dettagli Organizzazione</h1>
                <p className="text-gray-600 mt-2">{organization.name}</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => window.location.href = `/staff/admin/organizations/${params.orgId}/members`}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Users className="h-4 w-4 mr-2" />
                Membri
              </button>
              <button
                onClick={() => window.location.href = `/staff/admin/organizations/${params.orgId}/analytics`}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </button>
            </div>
          </div>
        </div>

        {/* Organization Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-2xl font-bold text-gray-900">{organization.name}</h2>
                  <p className="text-gray-600">{organization.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefono</label>
                  <p className="text-gray-900">{organization.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sito Web</label>
                  <p className="text-gray-900">{organization.website || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Partita IVA</label>
                  <p className="text-gray-900">{organization.vat || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Codice Fiscale</label>
                  <p className="text-gray-900">{organization.tax_code || 'N/A'}</p>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Indirizzo</label>
                <p className="text-gray-900">{organization.address || 'N/A'}</p>
              </div>

              {organization.description && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descrizione</label>
                  <p className="text-gray-900">{organization.description}</p>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <p className="text-sm font-medium text-gray-600">Membri</p>
                    <p className="text-2xl font-bold text-gray-900">{organization.member_count}</p>
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
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Creata</p>
                    <p className="text-sm font-bold text-gray-900">
                      {formatDate(organization.created_at)}
                    </p>
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
                    <Building2 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Admin</p>
                    <p className="text-sm font-bold text-gray-900">{organization.admin_name}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Azioni Rapide</h3>
              <div className="space-y-3">
                <button
                  onClick={() => window.location.href = `/staff/admin/organizations/${params.orgId}/members`}
                  className="w-full flex items-center px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Users className="h-4 w-4 mr-3" />
                  Gestisci Membri
                </button>
                <button
                  onClick={() => window.location.href = `/staff/admin/organizations/${params.orgId}/analytics`}
                  className="w-full flex items-center px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <BarChart3 className="h-4 w-4 mr-3" />
                  Visualizza Analytics
                </button>
                <button className="w-full flex items-center px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  <Edit className="h-4 w-4 mr-3" />
                  Modifica Organizzazione
                </button>
              </div>
            </div>

            {/* Organization Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informazioni Sistema</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">ID Organizzazione</p>
                  <p className="text-sm font-mono text-gray-900">{organization.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ultimo Aggiornamento</p>
                  <p className="text-sm text-gray-900">{formatDate(organization.updated_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Stato</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Attiva
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
