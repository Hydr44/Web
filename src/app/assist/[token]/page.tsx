'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type AssistStatus = 'idle' | 'requesting' | 'sharing' | 'success' | 'error' | 'stopped';

interface AssistRequest {
  id: string;
  token: string | null;
  status: string;
  phone: string;
  note: string | null;
  url: string | null;
  created_at: string;
  updated_at: string | null;
  received_at: string | null;
  closed_at: string | null;
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.error || 'Richiesta non riuscita');
  }
  return json as T;
}

export default function AssistTokenPage({ params }: { params: { token: string } }) {
  const { token } = params;
  const [status, setStatus] = useState<AssistStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [requestInfo, setRequestInfo] = useState<AssistRequest | null>(null);
  const [position, setPosition] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [lastUpdateIso, setLastUpdateIso] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<{ ok: boolean; row: AssistRequest }>(`/api/assist/by-token/${token}`);
        setRequestInfo(data.row);
      } catch (err) {
        console.error('assist/by-token error', err);
        setError('Link non valido o scaduto. Contatta il centro di assistenza.');
        setStatus('error');
      }
    })();
  }, [token]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const lastUpdateLabel = useMemo(() => {
    if (!lastUpdateIso) return null;
    try {
      return new Date(lastUpdateIso).toLocaleTimeString();
    } catch {
      return null;
    }
  }, [lastUpdateIso]);

  const startSharing = () => {
    if (!('geolocation' in navigator)) {
      setError('Il tuo dispositivo non supporta la geolocalizzazione.');
      setStatus('error');
      return;
    }

    setStatus('requesting');
    setError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const coords = pos.coords;
        const payload = {
          token,
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy: coords.accuracy,
        };

        try {
          setStatus('sharing');
          await apiFetch('/api/assist/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          setPosition({ lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy });
          setLastUpdateIso(new Date().toISOString());
          setStatus('success');
        } catch (err) {
          console.error('assist/update error', err);
          setError('Impossibile inviare la posizione. Riprova più tardi.');
          setStatus('error');
        }
      },
      (geoError) => {
        console.error('geolocation error', geoError);
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            setError('Permesso negato. Concedi l’autorizzazione alla posizione per proseguire.');
            break;
          case geoError.POSITION_UNAVAILABLE:
            setError('Posizione non disponibile. Controlla il GPS o la rete.');
            break;
          case geoError.TIMEOUT:
            setError('Tempo scaduto durante l’acquisizione della posizione. Riprova.');
            break;
          default:
            setError('Errore durante la geolocalizzazione.');
        }
        setStatus('error');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
      }
    );
  };

  const stopSharing = async (closeRequest = false) => {
    if (watchIdRef.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (closeRequest) {
      try {
        await apiFetch('/api/assist/close', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
      } catch (err) {
        console.error('assist/close error', err);
      }
    }

    setStatus('stopped');
  };

  const shareWhatsAppLink = useMemo(() => {
    if (!position) return null;
    const message = encodeURIComponent(
      `Posizione condivisa: https://www.google.com/maps?q=${position.lat},${position.lng}`
    );
    return `https://wa.me/?text=${message}`;
  }, [position]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="bg-slate-900/70 border border-slate-700 rounded-3xl shadow-2xl p-8 backdrop-blur">
          <div className="space-y-6">
            <header className="space-y-2 text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">RescueManager Assist</p>
              <h1 className="text-3xl font-semibold">Condividi la tua posizione</h1>
              <p className="text-sm text-slate-400">
                Questo link è stato inviato dal centro di assistenza per individuarti rapidamente. Premi il pulsante
                per autorizzare l’invio della tua posizione in tempo reale.
              </p>
            </header>

            <section className="bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Token richiesta</p>
                  <p className="text-sm font-mono text-slate-200">{token}</p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
                  {requestInfo?.status?.toUpperCase() || 'IN ATTESA'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400">
                <div>
                  <p className="uppercase tracking-[0.2em] text-slate-500">Ultimo aggiornamento</p>
                  <p className="text-slate-200">{lastUpdateLabel || '—'}</p>
                </div>
                <div>
                  <p className="uppercase tracking-[0.2em] text-slate-500">Precisione</p>
                  <p className="text-slate-200">
                    {position ? `${Math.round(position.accuracy)} metri` : '—'}
                  </p>
                </div>
              </div>

              {position ? (
                <div className="text-xs text-slate-300">
                  <p className="font-medium text-slate-200">Coordinate inviate</p>
                  <p>{position.lat.toFixed(5)}, {position.lng.toFixed(5)}</p>
                </div>
              ) : (
                <div className="text-xs text-slate-400">
                  In attesa dell’autorizzazione alla posizione.
                </div>
              )}
            </section>

            {error && (
              <div className="bg-red-500/10 border border-red-500/40 text-red-200 text-sm rounded-2xl p-4">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={startSharing}
                className="flex-1 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold transition"
              >
                {status === 'sharing' || status === 'success'
                  ? 'Trasmissione in corso'
                  : 'Autorizza la posizione'}
              </button>
              <button
                onClick={() => stopSharing(true)}
                className="px-5 py-3 rounded-2xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition"
              >
                Termina
              </button>
            </div>

            <footer className="space-y-3 text-xs text-slate-400">
              <p>
                Puoi chiudere questa pagina dopo aver autorizzato la condivisione. Il centro di assistenza riceverà la
                tua posizione e potrà guidarti o inviarti aiuto.
              </p>
              {shareWhatsAppLink && (
                <a
                  href={shareWhatsAppLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300"
                >
                  Condividi anche via WhatsApp
                </a>
              )}
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}

