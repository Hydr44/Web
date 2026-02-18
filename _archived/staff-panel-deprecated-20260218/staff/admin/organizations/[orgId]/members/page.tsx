"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft,
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  Shield,
  UserCheck,
  UserX
} from "lucide-react";
import { useRouter } from "next/navigation";
import { LoadingPage } from "@/components/ui/LoadingSpinner";

interface OrganizationMember {
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
  profile: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
  } | null;
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

export default function OrganizationMembersPage({ params }: { params: { orgId: string } }) {
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");

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

      // Load members
      const membersResponse = await fetch(`/api/staff/admin/organizations/${params.orgId}/members`, {
        method: 'POST'
      });
      const membersData = await membersResponse.json();
      
      if (membersData.success) {
        setMembers(membersData.members);
      }
    } catch (error) {
      console.error('Error loading organization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = (member.profile?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                        (member.profile?.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || member.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'text-purple-600 bg-purple-50';
      case 'admin': return 'text-blue-600 bg-blue-50';
      case 'member': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'Proprietario';
      case 'admin': return 'Amministratore';
      case 'member': return 'Membro';
      default: return 'Sconosciuto';
    }
  };

  if (loading) {
    return <LoadingPage text="Caricamento membri..." />;
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
                <h1 className="text-3xl font-bold text-gray-900">Membri Organizzazione</h1>
                <p className="text-gray-600 mt-2">{organization.name}</p>
              </div>
            </div>
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Aggiungi Membro
            </button>
          </div>
        </div>

        {/* Organization Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
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
              <p className="text-sm text-gray-500">Totale Membri</p>
              <p className="font-medium">{members.length}</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cerca membri..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tutti i ruoli</option>
                <option value="owner">Proprietario</option>
                <option value="admin">Amministratore</option>
                <option value="member">Membro</option>
              </select>
            </div>
          </div>
        </div>

        {/* Members List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Membri ({filteredMembers.length})
            </h3>
          </div>
          
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nessun membro trovato
              </h3>
              <p className="text-gray-500">
                {searchTerm || filterRole !== "all"
                  ? "Prova a modificare i filtri di ricerca"
                  : "Non ci sono membri in questa organizzazione"
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredMembers.map((member, index) => (
                <motion.div
                  key={member.user_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        {member.profile?.avatar_url ? (
                          <img
                            src={member.profile.avatar_url}
                            alt={member.profile.full_name || ''}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <Users className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {member.profile?.full_name || 'Nome non disponibile'}
                        </div>
                        <div className="text-sm text-gray-500">{member.profile?.email}</div>
                        <div className="flex items-center mt-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                            {getRoleLabel(member.role)}
                          </span>
                          {member.role === 'owner' && (
                            <Shield className="h-3 w-3 text-purple-600 ml-2" />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          Aggiunto il {formatDate(member.created_at)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="text-gray-400 hover:text-blue-600" title="Visualizza">
                          <UserCheck className="h-4 w-4" />
                        </button>
                        <button className="text-gray-400 hover:text-red-600" title="Rimuovi">
                          <UserX className="h-4 w-4" />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600" title="Altre azioni">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
