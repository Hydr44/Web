"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import { 
  Users, 
  FileText, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Building, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  TrendingUp,
  Target,
  Zap,
  Star
} from "lucide-react";

export default function MarketingPanel() {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    contactedLeads: 0,
    convertedLeads: 0,
    demoRequests: 0,
    quoteRequests: 0
  });
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadLeads = async () => {
      try {
        const supabase = supabaseBrowser();
        
        // Carica lead dal database
        const { data: leads, error } = await supabase
          .from("leads")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error loading leads:", error);
          // Fallback a dati mock se il database non è ancora configurato
          const mockLeads = [
            {
              id: "lead_1",
              name: "Mario Rossi",
              email: "mario.rossi@azienda.it",
              phone: "+39 333 123 4567",
              company: "Trasporti Rossi SRL",
              type: "demo",
              status: "new",
              source: "Website",
              created_at: "2024-01-15T10:30:00Z",
              notes: "Interessato a demo per gestione flotta",
              priority: "high"
            },
            {
              id: "lead_2",
              name: "Giulia Bianchi",
              email: "giulia.bianchi@logistica.com",
              phone: "+39 347 987 6543",
              company: "Logistica Bianchi",
              type: "quote",
              status: "contacted",
              source: "LinkedIn",
              created_at: "2024-01-14T15:20:00Z",
              notes: "Richiesta preventivo per 50 veicoli",
              priority: "medium"
            }
          ];
          setLeads(mockLeads);
          setStats({
            totalLeads: mockLeads.length,
            newLeads: mockLeads.filter(l => l.status === "new").length,
            contactedLeads: mockLeads.filter(l => l.status === "contacted").length,
            convertedLeads: mockLeads.filter(l => l.status === "converted").length,
            demoRequests: mockLeads.filter(l => l.type === "demo").length,
            quoteRequests: mockLeads.filter(l => l.type === "quote").length
          });
        } else if (leads) {
          setLeads(leads);
          
          // Calcola statistiche reali
          setStats({
            totalLeads: leads.length,
            newLeads: leads.filter(l => l.status === "new").length,
            contactedLeads: leads.filter(l => l.status === "contacted").length,
            convertedLeads: leads.filter(l => l.status === "converted").length,
            demoRequests: leads.filter(l => l.type === "demo").length,
            quoteRequests: leads.filter(l => l.type === "quote").length
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading leads:", error);
        setLoading(false);
      }
    };

    loadLeads();
  }, []);

  const filteredLeads = leads.filter(lead => {
    const matchesStatus = filterStatus === "all" || lead.status === filterStatus;
    const matchesType = filterType === "all" || lead.type === filterType;
    const matchesSearch = searchTerm === "" || 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesType && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case "contacted":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "converted":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "contacted":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "converted":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-2 text-sm rounded-full ring-1 ring-primary/30 px-4 py-2 mb-4 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary font-medium">
              <Target className="h-4 w-4" />
              Pannello Marketing
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Gestione <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Lead</span>
            </h1>
            <p className="text-lg text-gray-600">
              Gestisci richieste demo e preventivi
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors duration-200">
              <Plus className="h-4 w-4" />
              Nuovo Lead
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200">
              <Download className="h-4 w-4" />
              Esporta
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-blue-50/30 border border-blue-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Totale Lead</h3>
              <p className="text-sm text-gray-600">Tutti i contatti</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.totalLeads}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-green-50/30 border border-green-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Nuovi</h3>
              <p className="text-sm text-gray-600">Non contattati</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.newLeads}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-yellow-50/30 border border-yellow-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Contattati</h3>
              <p className="text-sm text-gray-600">In lavorazione</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.contactedLeads}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-purple-50/30 border border-purple-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Convertiti</h3>
              <p className="text-sm text-gray-600">Clienti acquisiti</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.convertedLeads}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-orange-50/30 border border-orange-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Demo</h3>
              <p className="text-sm text-gray-600">Richieste demo</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.demoRequests}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-red-50/30 border border-red-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Preventivi</h3>
              <p className="text-sm text-gray-600">Richieste preventivi</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.quoteRequests}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca per nome, email, azienda..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            className="w-full sm:w-auto pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 appearance-none"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Tutti gli Stati</option>
            <option value="new">Nuovo</option>
            <option value="contacted">Contattato</option>
            <option value="converted">Convertito</option>
          </select>
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            className="w-full sm:w-auto pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 appearance-none"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">Tutti i Tipi</option>
            <option value="demo">Demo</option>
            <option value="quote">Preventivo</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Lead ({filteredLeads.length})</h3>
        </div>
        
        {filteredLeads.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredLeads.map((lead) => (
              <div key={lead.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <Users className="h-6 w-6 text-gray-600" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">{lead.name}</h4>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(lead.status)}`}>
                          {getStatusIcon(lead.status)}
                          {lead.status}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(lead.priority)}`}>
                          {lead.priority}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          {lead.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          {lead.phone}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Building className="h-4 w-4" />
                          {lead.company}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          {new Date(lead.created_at).toLocaleDateString('it-IT')}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{lead.notes}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {lead.type === "demo" ? "Demo" : "Preventivo"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {lead.source}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun lead trovato</h3>
            <p className="text-sm text-gray-600">Prova a modificare i filtri di ricerca.</p>
          </div>
        )}
      </div>
    </div>
  );
}
