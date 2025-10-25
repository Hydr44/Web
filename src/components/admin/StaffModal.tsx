"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, User, Mail, Lock, Shield, Users, Crown } from "lucide-react";

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff?: any;
  mode: 'create' | 'edit';
  onSave: (staffData: any) => Promise<void>;
}

export default function StaffModal({ isOpen, onClose, staff, mode, onSave }: StaffModalProps) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    staff_role: 'staff',
    is_admin: false,
    is_staff: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const staffRoles = [
    { value: 'admin', label: 'Amministratore', description: 'Accesso completo al sistema', icon: Crown },
    { value: 'marketing', label: 'Marketing', description: 'Gestione lead e campagne', icon: Users },
    { value: 'support', label: 'Supporto', description: 'Assistenza clienti', icon: Shield },
    { value: 'staff', label: 'Staff', description: 'Accesso base', icon: User }
  ];

  useEffect(() => {
    if (staff && mode === 'edit') {
      setFormData({
        full_name: staff.full_name || '',
        email: staff.email || '',
        password: '',
        staff_role: staff.staff_role || 'staff',
        is_admin: staff.is_admin || false,
        is_staff: staff.is_staff || true
      });
    } else {
      setFormData({
        full_name: '',
        email: '',
        password: '',
        staff_role: 'staff',
        is_admin: false,
        is_staff: true
      });
    }
  }, [staff, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Errore nel salvataggio');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const selectedRole = staffRoles.find(role => role.value === formData.staff_role);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg mr-3">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {mode === 'create' ? 'Crea Nuovo Staff' : 'Modifica Staff'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {mode === 'create' ? 'Aggiungi un nuovo membro dello staff' : 'Modifica i dettagli dello staff'}
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Mario Rossi"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="mario.rossi@staff.com"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password {mode === 'create' ? '*' : '(lascia vuoto per non modificare)'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required={mode === 'create'}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {/* Staff Role */}
                <div>
                  <label htmlFor="staff_role" className="block text-sm font-medium text-gray-700 mb-2">
                    Ruolo Staff *
                  </label>
                  <select
                    id="staff_role"
                    name="staff_role"
                    value={formData.staff_role}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {staffRoles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  
                  {/* Role Description */}
                  {selectedRole && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <selectedRole.icon className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm font-medium text-gray-700">{selectedRole.label}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{selectedRole.description}</p>
                    </div>
                  )}
                </div>

                {/* Admin Checkbox */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_admin"
                    name="is_admin"
                    checked={formData.is_admin}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_admin" className="ml-2 flex items-center">
                    <Crown className="h-4 w-4 text-yellow-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Privilegi Amministratore</span>
                  </label>
                </div>

                {/* Staff Status */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_staff"
                    name="is_staff"
                    checked={formData.is_staff}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_staff" className="ml-2 flex items-center">
                    <Shield className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Attivo come Staff</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {loading ? 'Salvataggio...' : mode === 'create' ? 'Crea Staff' : 'Salva Modifiche'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
