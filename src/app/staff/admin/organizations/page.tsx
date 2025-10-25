"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Building2, 
  Search, 
  Filter, 
  Plus,
  Edit,
  Trash2,
  Eye,
  Users,
  Calendar,
  MapPin,
  Phone,
  Mail,
  MoreVertical,
  UserPlus,
  Settings,
  BarChart3
} from "lucide-react";
import OrganizationModal from "@/components/admin/OrganizationModal";
import AdvancedFilters from "@/components/admin/AdvancedFilters";

interface Organization {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  created_at: string;
  updated_at: string;
  member_count: number;
  admin_name: string;
  status: 'active' | 'inactive' | 'suspended';
}

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSize, setFilterSize] = useState<string>("all");
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showOrganizationModal, setShowOrganizationModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);
  const [filters, setFilters] = useState<any>({});

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/staff/admin/organizations');
      const data = await response.json();
      
      if (data.success) {
        setOrganizations(data.organizations);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = (org.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                        (org.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                        (org.city?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || org.status === filterStatus;
    const matchesSize = filterSize === "all" || 
                       (filterSize === "small" && org.member_count < 10) ||
                       (filterSize === "medium" && org.member_count >= 10 && org.member_count < 50) ||
                       (filterSize === "large" && org.member_count >= 50);
    
    return matchesSearch && matchesStatus && matchesSize;
  });

  const handleOrgAction = async (orgId: string, action: string) => {
    try {
      const response = await fetch(`/api/staff/admin/organizations/${orgId}/${action}`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadOrganizations();
      } else {
        alert('Errore: ' + data.error);
      }
    } catch (error) {
      console.error('Error performing action:', error);
      alert('Errore di connessione');
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedOrgs.length === 0) {
      alert('Seleziona almeno un\'organizzazione');
      return;
    }

    if (confirm(`Sei sicuro di voler ${action} ${selectedOrgs.length} organizzazioni?`)) {
      try {
        const response = await fetch('/api/staff/admin/organizations/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orgIds: selectedOrgs,
            action: action
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          setSelectedOrgs([]);
          await loadOrganizations();
        } else {
          alert('Errore: ' + data.error);
        }
      } catch (error) {
        console.error('Error performing bulk action:', error);
        alert('Errore di connessione');
      }
    }
  };

  const handleCreateOrganization = () => {
    setEditingOrganization(null);
    setShowOrganizationModal(true);
  };

  const handleEditOrganization = (org: Organization) => {
    setEditingOrganization(org);
    setShowOrganizationModal(true);
  };

  const handleSaveOrganization = async (orgData: any) => {
    try {
      if (editingOrganization) {
        // Edit existing organization
        const response = await fetch(`/api/staff/admin/organizations/${editingOrganization.id}/edit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orgData)
        });
        
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error);
        }
      } else {
        // Create new organization
        const response = await fetch('/api/staff/admin/organizations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orgData)
        });
        
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error);
        }
      }
      
      await loadOrganizations();
    } catch (error: any) {
      throw new Error(error.message || 'Errore nel salvataggio');
    }
  };

  const handleApplyFilters = (newFilters: any) => {
    setFilters(newFilters);
    // Apply filters to the organizations list
  };

  const handleViewMembers = async (orgId: string) => {
    try {
      const response = await fetch(`/api/staff/admin/organizations/${orgId}/members`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Show members in a modal or navigate to members page
        alert(`Membri dell'organizzazione: ${data.members.length} membri trovati`);
      } else {
        alert('Errore: ' + data.error);
      }
    } catch (error) {
      console.error('Error loading members:', error);
      alert('Errore di connessione');
    }
  };

  const handleViewAnalytics = async (orgId: string) => {
    try {
      const response = await fetch(`/api/staff/admin/organizations/${orgId}/analytics`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Show analytics in a modal or navigate to analytics page
        alert(`Analytics organizzazione: ${JSON.stringify(data.analytics, null, 2)}`);
      } else {
        alert('Errore: ' + data.error);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      alert('Errore di connessione');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'inactive': return 'text-yellow-600 bg-yellow-50';
      case 'suspended': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Attiva';
      case 'inactive': return 'Inattiva';
      case 'suspended': return 'Sospesa';
      default: return 'Sconosciuto';
    }
  };

  const getSizeLabel = (memberCount: number) => {
    if (memberCount < 10) return 'Piccola';
    if (memberCount < 50) return 'Media';
    return 'Grande';
  };

  const getSizeColor = (memberCount: number) => {
    if (memberCount < 10) return 'text-blue-600 bg-blue-50';
    if (memberCount < 50) return 'text-green-600 bg-green-50';
    return 'text-purple-600 bg-purple-50';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestione Organizzazioni</h1>
              <p className="text-gray-600 mt-2">
                Gestisci tutte le organizzazioni e i loro membri
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleCreateOrganization}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuova Organizzazione
              </button>
              <button
                onClick={() => setShowAdvancedFilters(true)}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtri Avanzati
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Totale Organizzazioni</p>
                <p className="text-2xl font-bold text-gray-900">{organizations.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Membri Totali</p>
                <p className="text-2xl font-bold text-gray-900">
                  {organizations.reduce((sum, org) => sum + org.member_count, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-50 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Organizzazioni Attive</p>
                <p className="text-2xl font-bold text-gray-900">
                  {organizations.filter(org => org.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-amber-50 rounded-lg">
                <Calendar className="h-6 w-6 text-amber-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Nuove Questo Mese</p>
                <p className="text-2xl font-bold text-gray-900">
                  {organizations.filter(org => {
                    const monthAgo = new Date();
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    return new Date(org.created_at) > monthAgo;
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tutte</option>
                  <option value="active">Attive</option>
                  <option value="inactive">Inattive</option>
                  <option value="suspended">Sospese</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dimensione
                </label>
                <select
                  value={filterSize}
                  onChange={(e) => setFilterSize(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tutte</option>
                  <option value="small">Piccole (&lt; 10 membri)</option>
                  <option value="medium">Medie (10-50 membri)</option>
                  <option value="large">Grandi (&gt; 50 membri)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Azioni di massa
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleBulkAction('activate')}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    Attiva
                  </button>
                  <button
                    onClick={() => handleBulkAction('suspend')}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  >
                    Sospendi
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca per nome, email o città..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Organizations Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedOrgs.length === filteredOrganizations.length && filteredOrganizations.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOrgs(filteredOrganizations.map(org => org.id));
                        } else {
                          setSelectedOrgs([]);
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organizzazione
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Membri
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creata
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrganizations.map((org) => (
                  <tr key={org.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedOrgs.includes(org.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrgs([...selectedOrgs, org.id]);
                          } else {
                            setSelectedOrgs(selectedOrgs.filter(id => id !== org.id));
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {org.name}
                          </div>
                          <div className="text-sm text-gray-500">{org.email}</div>
                          <div className="text-xs text-gray-400 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {org.city}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSizeColor(org.member_count)}`}>
                          {org.member_count} membri
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          ({getSizeLabel(org.member_count)})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(org.status)}`}>
                        {getStatusLabel(org.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(org.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOrgAction(org.id, 'view')}
                          className="text-gray-400 hover:text-blue-600"
                          title="Visualizza"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditOrganization(org)}
                          className="text-gray-400 hover:text-blue-600"
                          title="Modifica"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleViewMembers(org.id)}
                          className="text-gray-400 hover:text-green-600"
                          title="Gestisci Membri"
                        >
                          <Users className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleViewAnalytics(org.id)}
                          className="text-gray-400 hover:text-purple-600"
                          title="Analytics"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {filteredOrganizations.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nessuna organizzazione trovata
            </h3>
            <p className="text-gray-500">
              {searchTerm || filterStatus !== "all" || filterSize !== "all"
                ? "Prova a modificare i filtri di ricerca"
                : "Non ci sono organizzazioni nel sistema"
              }
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <OrganizationModal
        isOpen={showOrganizationModal}
        onClose={() => setShowOrganizationModal(false)}
        organization={editingOrganization}
        mode={editingOrganization ? 'edit' : 'create'}
        onSave={handleSaveOrganization}
      />

      <AdvancedFilters
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        onApply={handleApplyFilters}
        type="organizations"
      />
    </div>
  );
}
