"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { staffData, StaffLead } from "@/lib/staff-data-real";
import { 
  Target, 
  Phone, 
  Mail, 
  Search,
  Eye,
  Edit,
  Trash2,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  MessageSquare,
  FileText,
  Download
} from "lucide-react";
import { SimpleLoadingPage } from "@/components/ui/SimpleLoader";

// Using StaffLead from staff-data-real.ts

export default function StaffMarketingPage() {
  const [leads, setLeads] = useState<StaffLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  // const [selectedLead, setSelectedLead] = useState<StaffLead | null>(null);
  // const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      // Fetch real leads from database
      const realLeads = await staffData.getLeads();
      setLeads(realLeads);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (lead.company?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === "all" || lead.status === filterStatus;
    const matchesType = filterType === "all" || lead.type === filterType;
    const matchesPriority = filterPriority === "all" || lead.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'demo': return <Eye className="h-4 w-4" />;
      case 'quote': return <FileText className="h-4 w-4" />;
      case 'contact': return <MessageSquare className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Clock className="h-4 w-4" />;
      case 'contacted': return <Phone className="h-4 w-4" />;
      case 'converted': return <CheckCircle className="h-4 w-4" />;
      case 'lost': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  // const updateLeadStatus = async (leadId: string, newStatus: string) => {
  //   try {
  //     // Update in database
  //     const success = await staffData.updateLeadStatus(leadId, newStatus);
  //     
  //     if (success) {
  //       // Update local state
  //       setLeads(prevLeads => 
  //         prevLeads.map(lead => 
  //           lead.id === leadId 
  //             ? { 
  //                 ...lead, 
  //                 status: newStatus as any,
  //                 updated_at: new Date().toISOString(),
  //                 ...(newStatus === 'contacted' && { contacted_at: new Date().toISOString() }),
  //                 ...(newStatus === 'converted' && { converted_at: new Date().toISOString() })
  //               }
  //             : lead
  //         )
  //       );
  //     }
  //   } catch (error) {
  //     console.error('Error updating lead:', error);
  //   }
  // };

  const deleteLead = async (leadId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo lead?')) return;

    try {
      // Delete from database
      const success = await staffData.deleteLead(leadId);
      
      if (success) {
        // Update local state
        setLeads(prevLeads => prevLeads.filter(lead => lead.id !== leadId));
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const exportLeads = () => {
    const csvContent = [
      ['Nome', 'Email', 'Telefono', 'Azienda', 'Tipo', 'Status', 'Priorità', 'Fonte', 'Data Creazione'],
      ...filteredLeads.map(lead => [
        lead.name,
        lead.email,
        lead.phone || '',
        lead.company || '',
        lead.type,
        lead.status,
        lead.priority,
        lead.source,
        new Date(lead.created_at).toLocaleDateString('it-IT')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = globalThis.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    globalThis.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <SimpleLoadingPage text="Caricamento lead..." />;
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
            Pannello <span className="bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">Marketing</span>
          </h1>
          <p className="text-gray-600">
            Gestione completa dei lead e campagne marketing
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Totale Lead</p>
                <p className="text-2xl font-bold text-gray-900">{leads.length}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Nuovi</p>
                <p className="text-2xl font-bold text-gray-900">
                  {leads.filter(l => l.status === 'new').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contattati</p>
                <p className="text-2xl font-bold text-gray-900">
                  {leads.filter(l => l.status === 'contacted').length}
                </p>
              </div>
              <Phone className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Convertiti</p>
                <p className="text-2xl font-bold text-gray-900">
                  {leads.filter(l => l.status === 'converted').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Marketing Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Campaign Performance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Performance Campagne
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tasso Conversione</span>
                <span className="text-sm font-medium text-green-600">24.5%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Lead Generati</span>
                <span className="text-sm font-medium text-blue-600">127</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">ROI</span>
                <span className="text-sm font-medium text-green-600">+340%</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Azioni Rapide
            </h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                <Mail className="h-4 w-4" />
                Invia Email
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                <Phone className="h-4 w-4" />
                Chiama Lead
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                <MessageSquare className="h-4 w-4" />
                Segna Come Contattato
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              Attività Recente
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Nuovo lead da demo</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Lead convertito</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Follow-up programmato</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cerca lead..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Filters */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tutti gli status</option>
                <option value="new">Nuovi</option>
                <option value="contacted">Contattati</option>
                <option value="converted">Convertiti</option>
                <option value="lost">Persi</option>
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tutti i tipi</option>
                <option value="demo">Demo</option>
                <option value="quote">Preventivo</option>
                <option value="contact">Contatto</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tutte le priorità</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Bassa</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={exportLeads}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                <Download className="h-4 w-4" />
                Esporta
              </button>
              <button
                onClick={() => {/* setShowCreateForm(true) */}}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <Plus className="h-4 w-4" />
                Nuovo Lead
              </button>
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priorità
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                          {lead.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {lead.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {lead.email}
                          </div>
                          {lead.company && (
                            <div className="text-xs text-gray-400">
                              {lead.company}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getTypeIcon(lead.type)}
                        {lead.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                        {getStatusIcon(lead.status)}
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(lead.priority)}`}>
                        {lead.priority === 'high' && <Star className="h-3 w-3 mr-1" />}
                        {lead.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(lead.created_at).toLocaleDateString('it-IT')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {/* setSelectedLead(lead) */}}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {/* setSelectedLead(lead) */}}
                          className="p-2 text-gray-400 hover:text-green-600 transition-colors duration-200"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteLead(lead.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
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
        </div>

        {/* Empty State */}
        {filteredLeads.length === 0 && (
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nessun lead trovato
            </h3>
            <p className="text-gray-500">
              {searchTerm || filterStatus !== "all" || filterType !== "all" || filterPriority !== "all"
                ? "Prova a modificare i filtri di ricerca"
                : "Inizia aggiungendo il primo lead"
              }
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}