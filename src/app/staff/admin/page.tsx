"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { staffAuth, StaffUser } from "@/lib/staff-auth-real-db";
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  Mail, 
  Phone,
  Calendar,
  Search,
  Filter,
  MoreVertical,
  UserPlus,
  Settings
} from "lucide-react";

export default function StaffAdminPage() {
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);

  useEffect(() => {
    loadStaffUsers();
  }, []);

  const loadStaffUsers = async () => {
    try {
      setLoading(true);
      const users = await staffAuth.getAllStaffUsers();
      setStaffUsers(users);
    } catch (error) {
      console.error('Error loading staff users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = staffUsers.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        user.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.staff_role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'marketing': return 'bg-blue-100 text-blue-800';
      case 'support': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'marketing': return <Mail className="h-4 w-4" />;
      case 'support': return <Phone className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento utenti staff...</p>
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
            Gestione <span className="bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">Staff</span>
          </h1>
          <p className="text-gray-600">
            Amministra gli account staff e i loro ruoli
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Totale Staff</p>
                <p className="text-2xl font-bold text-gray-900">{staffUsers.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admin</p>
                <p className="text-2xl font-bold text-gray-900">
                  {staffUsers.filter(u => u.staff_role === 'admin').length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Marketing</p>
                <p className="text-2xl font-bold text-gray-900">
                  {staffUsers.filter(u => u.staff_role === 'marketing').length}
                </p>
              </div>
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Support</p>
                <p className="text-2xl font-bold text-gray-900">
                  {staffUsers.filter(u => u.staff_role === 'support').length}
                </p>
              </div>
              <Phone className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cerca utenti..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Filter */}
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tutti i ruoli</option>
                <option value="admin">Admin</option>
                <option value="marketing">Marketing</option>
                <option value="support">Support</option>
                <option value="staff">Staff</option>
              </select>
            </div>

            {/* Add User Button */}
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <UserPlus className="h-4 w-4" />
              Aggiungi Staff
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ruolo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creato
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.staff_role)}`}>
                        {getRoleIcon(user.staff_role)}
                        {user.staff_role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_staff ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.is_staff ? 'Attivo' : 'Inattivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('it-IT')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Sei sicuro di voler eliminare questo utente?')) {
                              // Handle delete
                            }
                          }}
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
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nessun utente trovato
            </h3>
            <p className="text-gray-500">
              {searchTerm || filterRole !== "all" 
                ? "Prova a modificare i filtri di ricerca"
                : "Inizia aggiungendo il primo utente staff"
              }
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}