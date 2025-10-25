"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Filter, 
  X, 
  Search, 
  Calendar, 
  User, 
  Building2, 
  Shield,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  type: 'users' | 'organizations' | 'staff' | 'sessions' | 'leads';
}

export default function AdvancedFilters({ isOpen, onClose, onApply, type }: AdvancedFiltersProps) {
  const [filters, setFilters] = useState({
    search: '',
    dateRange: 'all',
    status: 'all',
    role: 'all',
    priority: 'all',
    provider: 'all',
    isActive: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      search: '',
      dateRange: 'all',
      status: 'all',
      role: 'all',
      priority: 'all',
      provider: 'all',
      isActive: 'all',
      sortBy: 'created_at',
      sortOrder: 'desc'
    };
    setFilters(resetFilters);
    onApply(resetFilters);
  };

  const getFilterOptions = () => {
    switch (type) {
      case 'users':
        return {
          status: [
            { value: 'all', label: 'Tutti gli stati' },
            { value: 'active', label: 'Attivi' },
            { value: 'inactive', label: 'Inattivi' },
            { value: 'suspended', label: 'Sospesi' }
          ],
          role: [
            { value: 'all', label: 'Tutti i ruoli' },
            { value: 'admin', label: 'Amministratori' },
            { value: 'user', label: 'Utenti' }
          ],
          provider: [
            { value: 'all', label: 'Tutti i provider' },
            { value: 'email', label: 'Email' },
            { value: 'google', label: 'Google' },
            { value: 'github', label: 'GitHub' },
            { value: 'apple', label: 'Apple' }
          ]
        };
      case 'organizations':
        return {
          status: [
            { value: 'all', label: 'Tutti gli stati' },
            { value: 'active', label: 'Attive' },
            { value: 'inactive', label: 'Inattive' },
            { value: 'suspended', label: 'Sospese' }
          ],
          role: [
            { value: 'all', label: 'Tutte le dimensioni' },
            { value: 'small', label: 'Piccole (< 10 membri)' },
            { value: 'medium', label: 'Medie (10-50 membri)' },
            { value: 'large', label: 'Grandi (> 50 membri)' }
          ]
        };
      case 'staff':
        return {
          status: [
            { value: 'all', label: 'Tutti gli stati' },
            { value: 'active', label: 'Attivi' },
            { value: 'inactive', label: 'Inattivi' }
          ],
          role: [
            { value: 'all', label: 'Tutti i ruoli' },
            { value: 'admin', label: 'Amministratori' },
            { value: 'marketing', label: 'Marketing' },
            { value: 'support', label: 'Supporto' },
            { value: 'staff', label: 'Staff' }
          ]
        };
      case 'sessions':
        return {
          status: [
            { value: 'all', label: 'Tutti gli stati' },
            { value: 'active', label: 'Attive' },
            { value: 'expired', label: 'Scadute' },
            { value: 'terminated', label: 'Terminate' }
          ],
          role: [
            { value: 'all', label: 'Tutte le durate' },
            { value: 'short', label: 'Brevi (< 1 ora)' },
            { value: 'medium', label: 'Medie (1-24 ore)' },
            { value: 'long', label: 'Lunghe (> 24 ore)' }
          ]
        };
      case 'leads':
        return {
          status: [
            { value: 'all', label: 'Tutti gli stati' },
            { value: 'new', label: 'Nuovi' },
            { value: 'contacted', label: 'Contattati' },
            { value: 'converted', label: 'Convertiti' },
            { value: 'lost', label: 'Persi' }
          ],
          role: [
            { value: 'all', label: 'Tutti i tipi' },
            { value: 'demo', label: 'Demo' },
            { value: 'quote', label: 'Preventivo' },
            { value: 'contact', label: 'Contatto' }
          ],
          priority: [
            { value: 'all', label: 'Tutte le priorità' },
            { value: 'high', label: 'Alta' },
            { value: 'medium', label: 'Media' },
            { value: 'low', label: 'Bassa' }
          ]
        };
      default:
        return { status: [], role: [], provider: [] };
    }
  };

  const options = getFilterOptions();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <Filter className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Filtri Avanzati</h2>
                  <p className="text-sm text-gray-600">
                    Filtra e ordina i risultati secondo le tue esigenze
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Filters */}
            <div className="p-6 space-y-6">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ricerca
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Cerca per nome, email, o altro..."
                  />
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Periodo
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={filters.dateRange}
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Tutti i periodi</option>
                    <option value="today">Oggi</option>
                    <option value="week">Questa settimana</option>
                    <option value="month">Questo mese</option>
                    <option value="quarter">Questo trimestre</option>
                    <option value="year">Quest'anno</option>
                  </select>
                </div>
              </div>

              {/* Status */}
              {options.status.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stato
                  </label>
                  <div className="relative">
                    <CheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {options.status.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Role/Type */}
              {options.role.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {type === 'organizations' ? 'Dimensione' : type === 'sessions' ? 'Durata' : type === 'leads' ? 'Tipo' : 'Ruolo'}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={filters.role}
                      onChange={(e) => handleFilterChange('role', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {options.role.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Priority (for leads) */}
              {type === 'leads' && options.priority && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priorità
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={filters.priority}
                      onChange={(e) => handleFilterChange('priority', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {options.priority.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Provider (for users) */}
              {type === 'users' && options.provider && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provider
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={filters.provider}
                      onChange={(e) => handleFilterChange('provider', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {options.provider.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Sort Options */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ordina per
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="created_at">Data creazione</option>
                    <option value="updated_at">Data aggiornamento</option>
                    <option value="name">Nome</option>
                    <option value="email">Email</option>
                    {type === 'leads' && <option value="priority">Priorità</option>}
                    {type === 'sessions' && <option value="last_activity">Ultima attività</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Direzione
                  </label>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="desc">Decrescente</option>
                    <option value="asc">Crescente</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center p-6 border-t border-gray-200">
              <button
                onClick={handleReset}
                className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reset
              </button>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleApply}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Applica Filtri
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
