'use client';

import { useEffect, useState } from 'react';

interface FileStatus {
  filename: string;
  size: number;
  uploaded_at?: string;
  generated_at?: string;
  status?: string;
  content?: string;
}

interface StatusData {
  test_mode: boolean;
  timestamp: string;
  files_pending: FileStatus[];
  files_eo: FileStatus[];
  summary: {
    pending_count: number;
    eo_count: number;
  };
}

export default function SDIMonitorPage() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadStatus = async () => {
    try {
      setError(null);
      const response = await fetch('/api/sdi-sftp/status');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setStatus(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    
    if (autoRefresh) {
      const interval = setInterval(loadStatus, 30000); // 30 secondi
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Appena ora';
    if (diffMins < 60) return `${diffMins} min fa`;
    if (diffHours < 24) return `${diffHours} ore fa`;
    return date.toLocaleString('it-IT');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const parseEOContent = (content?: string) => {
    if (!content) return null;
    try {
      const parser = new DOMParser();
      const xml = parser.parseFromString(content, 'text/xml');
      const esito = xml.querySelector('Esito')?.textContent;
      const nomeSupporto = xml.querySelector('NomeSupporto')?.textContent;
      const dataOraEsito = xml.querySelector('DataOraEsito')?.textContent;
      return { esito, nomeSupporto, dataOraEsito };
    } catch (e) {
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-purple-700 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <h1 className="text-3xl font-bold text-purple-600 mb-4">📊 Monitor SDI-SFTP</h1>
          
          {/* Status Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-sm text-gray-600 uppercase mb-1">File in Attesa</div>
              <div className="text-2xl font-bold text-purple-600">
                {status?.summary.pending_count ?? '-'}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-sm text-gray-600 uppercase mb-1">File EO</div>
              <div className="text-2xl font-bold text-green-600">
                {status?.summary.eo_count ?? '-'}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-sm text-gray-600 uppercase mb-1">Modalità</div>
              <div className="text-2xl font-bold text-blue-600">
                {status?.test_mode ? 'TEST' : 'PROD'}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-sm text-gray-600 uppercase mb-1">Ultimo Aggiornamento</div>
              <div className="text-sm font-bold text-gray-700">
                {status?.timestamp ? new Date(status.timestamp).toLocaleTimeString('it-IT') : '-'}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <button
              onClick={loadStatus}
              disabled={loading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? '⏳ Caricamento...' : '🔄 Aggiorna'}
            </button>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-5 h-5"
              />
              <span className="text-sm">Auto-aggiornamento (30s)</span>
            </label>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            ❌ Errore: {error}
          </div>
        )}

        {/* Loading */}
        {loading && !status && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-gray-600">Caricamento...</div>
          </div>
        )}

        {/* File in Attesa */}
        {status && status.files_pending.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">⏳ File in Attesa di Prelevamento</h2>
            <div className="space-y-3">
              {status.files_pending.map((file, idx) => (
                <div key={idx} className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    <div className="flex-1">
                      <div className="font-bold text-gray-800 break-all">{file.filename}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Caricato: {formatDate(file.uploaded_at)}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">{formatSize(file.size)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* File EO */}
        {status && status.files_eo.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">✅ File Esito (EO)</h2>
            <div className="space-y-3">
              {status.files_eo.map((file, idx) => {
                const parsed = parseEOContent(file.content);
                const isError = parsed?.esito !== 'ET01';
                return (
                  <div
                    key={idx}
                    className={`border-l-4 p-4 rounded-lg ${
                      isError ? 'bg-red-50 border-red-400' : 'bg-green-50 border-green-400'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                      <div className="flex-1">
                        <div className="font-bold text-gray-800 break-all">{file.filename}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Generato: {formatDate(file.generated_at)}
                        </div>
                        {parsed && (
                          <div className="mt-2 text-sm">
                            <strong>Esito:</strong> {parsed.esito} | <strong>Supporto:</strong>{' '}
                            {parsed.nomeSupporto}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{formatSize(file.size)}</div>
                    </div>
                    {file.content && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                          Mostra contenuto XML
                        </summary>
                        <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                          {file.content}
                        </pre>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {status && status.files_pending.length === 0 && status.files_eo.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-gray-600">Nessun file trovato</div>
          </div>
        )}
      </div>
    </div>
  );
}
