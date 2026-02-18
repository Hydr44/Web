"use client";

import { useState, useEffect } from "react";
import { Power, Download, Monitor, Activity, AlertCircle, CheckCircle2 } from "lucide-react";

interface MaintenanceStatus {
  is_active: boolean;
  message: string | null;
  started_at: string | null;
}

interface VersionStatus {
  version: string;
  min_required: string;
  force_update: boolean;
  notes: string | null;
}

interface NewVersion {
  version: string;
  download_url: string;
  force_update: boolean;
  notes: string;
}

interface HeartbeatUser {
  user_id: string;
  org_id: string;
  app_version: string;
  online: boolean;
  last_seen: string;
  user: {
    email: string;
    full_name: string;
  };
  org: {
    name: string;
  };
}

export default function RemoteControlPage() {
  const [maintenance, setMaintenance] = useState<MaintenanceStatus>({
    is_active: false,
    message: null,
    started_at: null
  });
  const [version, setVersion] = useState<VersionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<HeartbeatUser[]>([]);
  const [newVersion, setNewVersion] = useState<NewVersion>({
    version: '',
    download_url: '',
    force_update: false,
    notes: ''
  });
  const [versionHistory, setVersionHistory] = useState<VersionStatus[]>([]);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      
      console.log('[RemoteControl] Loading maintenance status...');
      const maintRes = await fetch('/api/maintenance/status');
      const maintData = await maintRes.json();
      console.log('[RemoteControl] Maintenance data:', maintData);
      setMaintenance(maintData);
      
      console.log('[RemoteControl] Loading version status...');
      const versionRes = await fetch('/api/version/check');
      const versionData = await versionRes.json();
      console.log('[RemoteControl] Version data:', versionData);
      setVersion(versionData);

      // Load version history
      try {
        const historyRes = await fetch('/api/version/history');
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          console.log('[RemoteControl] Version history:', historyData);
          setVersionHistory(historyData.versions || []);
        }
      } catch (err) {
        console.error('[RemoteControl] Error loading version history:', err);
      }
      
      // Load online users
      try {
        const usersRes = await fetch('/api/monitoring/users');
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          console.log('[RemoteControl] Online users:', usersData);
          setOnlineUsers(usersData.users || []);
        }
      } catch (err) {
        console.error('[RemoteControl] Error loading users:', err);
      }
      
    } catch (error) {
      console.error('Error loading status:', error);
      setNotification({ type: 'error', text: 'Errore nel caricamento dello stato' });
    } finally {
      setLoading(false);
    }
  };

  const toggleMaintenance = async () => {
    try {
      setSaving(true);
      
      console.log('[RemoteControl] Toggling maintenance, current state:', maintenance.is_active);
      const endpoint = maintenance.is_active 
        ? '/api/maintenance/disable'
        : '/api/maintenance/enable';
      
      console.log('[RemoteControl] Calling endpoint:', endpoint);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      
      console.log('[RemoteControl] Response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Failed to toggle maintenance');
      }
      
      await loadStatus();
      setNotification({ 
        type: 'success', 
        text: maintenance.is_active 
          ? 'Manutenzione disattivata' 
          : 'Manutenzione attivata' 
      });
      setMessage("");
      
    } catch (error) {
      console.error('Error toggling maintenance:', error);
      setNotification({ type: 'error', text: 'Errore nel toggle manutenzione' });
    } finally {
      setSaving(false);
    }
  };

  const setVersionEnforcement = async (force: boolean) => {
    try {
      setSaving(true);
      
      const response = await fetch('/api/version/enforce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force_update: force })
      });
      
      if (!response.ok) {
        throw new Error('Failed to enforce version');
      }
      
      await loadStatus();
      setNotification({ 
        type: 'success', 
        text: force ? 'Aggiornamento forzato attivato' : 'Aggiornamento forzato disattivato' 
      });
      
    } catch (error) {
      console.error('Error setting version enforcement:', error);
      setNotification({ type: 'error', text: 'Errore nell\'aggiornamento versione' });
    } finally {
      setSaving(false);
    }
  };

  const publishNewVersion = async () => {
    try {
      setSaving(true);
      
      console.log('[RemoteControl] Publishing new version:', newVersion);
      
      const response = await fetch('/api/version/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVersion)
      });
      
      console.log('[RemoteControl] Publish response:', response.status);
      
      if (!response.ok) {
        throw new Error('Failed to publish version');
      }
      
      await loadStatus();
      setNotification({ 
        type: 'success', 
        text: `Versione ${newVersion.version} pubblicata con successo!` 
      });
      
      // Reset form
      setNewVersion({
        version: '',
        download_url: '',
        force_update: false,
        notes: ''
      });
      
    } catch (error) {
      console.error('Error publishing version:', error);
      setNotification({ type: 'error', text: 'Errore nella pubblicazione versione' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Caricamento...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          notification.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <p className={notification.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {notification.text}
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">🎮 Controllo Remoto</h1>
          <p className="text-lg text-gray-600">
            Controlla manutenzione, versioni e monitora le app desktop in tempo reale.
          </p>
        </div>

        {/* Maintenance Mode */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${maintenance.is_active ? 'bg-amber-100' : 'bg-green-100'}`}>
                <Power className={`h-6 w-6 ${maintenance.is_active ? 'text-amber-600' : 'text-green-600'}`} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Modalità Manutenzione</h2>
                <p className="text-sm text-gray-500">
                  {maintenance.is_active ? 'App desktop bloccate' : 'App desktop operative'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleMaintenance}
              disabled={saving}
              className={`btn ${maintenance.is_active ? 'btn-danger' : 'btn-success'}`}
            >
              {saving ? '...' : maintenance.is_active ? 'Disattiva' : 'Attiva'}
            </button>
          </div>

          {maintenance.is_active && maintenance.started_at && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-amber-800">
                <strong>Manutenzione attiva dal:</strong> {new Date(maintenance.started_at).toLocaleString('it-IT')}
              </p>
              {maintenance.message && (
                <p className="text-sm text-amber-700 mt-2">{maintenance.message}</p>
              )}
            </div>
          )}

          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Messaggio personalizzato (opzionale)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Es: 'App in manutenzione per aggiornamento. Torniamo online tra 30 minuti.'"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              rows={2}
            />
          </div>
        </div>

        {/* Version Control */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-100">
                <Download className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Controllo Versioni</h2>
                <p className="text-sm text-gray-500">
                  Gestisci aggiornamenti e versioni minime richieste
                </p>
              </div>
            </div>
          </div>

          {version && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Versione Attuale</p>
                  <p className="text-2xl font-bold text-gray-900">{version.version}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Versione Minima</p>
                  <p className="text-2xl font-bold text-gray-900">{version.min_required}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 mb-1">Aggiornamento Forzato</p>
                    <p className="text-sm text-gray-600">
                      {version.force_update 
                        ? 'Le app verranno bloccate fino all\'aggiornamento'
                        : 'Le app continueranno a funzionare anche con versioni obsolete'}
                    </p>
                  </div>
                  <button
                    onClick={() => setVersionEnforcement(!version.force_update)}
                    disabled={saving}
                    className={`btn ${version.force_update ? 'btn-warning' : 'btn-outline'}`}
                  >
                    {saving ? '...' : version.force_update ? 'Disattiva' : 'Attiva'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pubblica Nuova Versione */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pubblica Nuova Versione</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="version-input" className="block text-sm font-medium text-gray-700 mb-2">
                  Numero Versione
                </label>
                <input
                  id="version-input"
                  type="text"
                  value={newVersion.version}
                  onChange={(e) => setNewVersion({ ...newVersion, version: e.target.value })}
                  placeholder="es: 0.2.0"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="download-url-input" className="block text-sm font-medium text-gray-700 mb-2">
                  URL Download
                </label>
                <input
                  id="download-url-input"
                  type="url"
                  value={newVersion.download_url}
                  onChange={(e) => setNewVersion({ ...newVersion, download_url: e.target.value })}
                  placeholder="https://github.com/user/repo/releases/download/v0.2.0/app.dmg"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="notes-textarea" className="block text-sm font-medium text-gray-700 mb-2">
                  Note di Aggiornamento
                </label>
                <textarea
                  id="notes-textarea"
                  value={newVersion.notes}
                  onChange={(e) => setNewVersion({ ...newVersion, notes: e.target.value })}
                  placeholder="Bug fix, nuove funzionalità..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={newVersion.force_update}
                  onChange={(e) => setNewVersion({ ...newVersion, force_update: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label className="text-sm text-gray-700">
                  Aggiornamento obbligatorio (blocca app fino all'update)
                </label>
              </div>

              <button
                onClick={publishNewVersion}
                disabled={saving || !newVersion.version || !newVersion.download_url}
                className="btn btn-primary w-full"
              >
                {saving ? 'Pubblicazione...' : 'Pubblica Versione'}
              </button>
            </div>
          </div>
        </div>

        {/* Monitoring */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-100">
                <Monitor className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Monitoraggio Real-Time</h2>
                <p className="text-sm text-gray-500">
                  Stato online/offline degli utenti desktop
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${onlineUsers.length > 0 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-sm text-gray-600">
                  {onlineUsers.length} utenti online
                </span>
              </div>
              <button
                onClick={() => loadStatus()}
                disabled={loading}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Aggiorna
              </button>
            </div>

            {onlineUsers.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Nessun utente online</p>
                <p className="text-sm text-gray-500">
                  Le app desktop inviano heartbeat ogni 30 secondi
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {onlineUsers.map((user) => (
                  <div key={user.user_id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{user.user.full_name}</p>
                      <p className="text-sm text-gray-600">{user.user.email}</p>
                      <p className="text-xs text-gray-500">
                        {user.org.name} • v{user.app_version} • {new Date(user.last_seen).toLocaleString('it-IT')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm text-green-600">Online</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>

          {/* Cronologia Versioni */}
          {versionHistory.length > 0 && (
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cronologia Versioni</h3>
              <div className="space-y-2">
                {versionHistory.map((v, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{v.version}</p>
                      {v.notes && (
                        <p className="text-xs text-gray-600 mt-1">{v.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {v.force_update && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          Obbligatorio
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

