'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

interface PublicAppointment {
  public_uuid: string;
  type: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  meeting_mode: 'video' | 'phone' | 'in_person';
  meeting_url: string | null;
  meeting_phone: string | null;
  meeting_address: string | null;
  status: string;
  proposed_slots: { start: string; end?: string }[];
  scheduled_at: string | null;
  booking_window_start: string | null;
  booking_window_end: string | null;
  lead_name: string;
  lead_company: string | null;
}

const TYPE_LABEL: Record<string, string> = {
  discovery_call: 'Chiamata conoscitiva',
  demo_call: 'Demo del software',
  follow_up: 'Follow-up',
  onboarding: 'Onboarding',
  negotiation: 'Chiamata commerciale',
  contract_signing: 'Firma contratto',
  custom: 'Incontro',
};

function fmtSlot(iso: string, duration: number) {
  const d = new Date(iso);
  const end = new Date(d.getTime() + duration * 60000);
  const day = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  const start = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  const stop = end.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  return { day: day.charAt(0).toUpperCase() + day.slice(1), time: `${start} – ${stop}` };
}

export default function PublicAppointmentPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const [appt, setAppt] = useState<PublicAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<'confirmed' | 'cancelled' | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancel, setShowCancel] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const r = await fetch(`/api/appointments/${uuid}`);
      const j = await r.json();
      if (!j.success) { setError(j.error || 'Errore caricamento'); return; }
      setAppt(j.appointment);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [uuid]);

  useEffect(() => { load(); }, [load]);

  const handleConfirm = async () => {
    if (!selected) return;
    try {
      setSubmitting(true);
      const r = await fetch(`/api/appointments/${uuid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm', slot_start: selected }),
      });
      const j = await r.json();
      if (!j.success) throw new Error(j.error);
      setDone('confirmed');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    try {
      setSubmitting(true);
      const r = await fetch(`/api/appointments/${uuid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', reason: cancelReason }),
      });
      const j = await r.json();
      if (!j.success) throw new Error(j.error);
      setDone('cancelled');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !appt) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-4xl mb-4 text-amber-500 font-bold">!</div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Appuntamento non trovato</h1>
          <p className="text-sm text-slate-600">{error || 'Il link potrebbe essere scaduto o non valido.'}</p>
        </div>
      </div>
    );
  }

  if (done === 'confirmed' || (appt.status === 'confirmed' && appt.scheduled_at && !showCancel)) {
    const at = appt.scheduled_at || selected!;
    const { day, time } = fmtSlot(at, appt.duration_minutes);
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Appuntamento confermato</h1>
          <div className="bg-blue-50 rounded-lg p-4 my-4">
            <p className="text-sm text-slate-700 font-medium">{appt.title}</p>
            <p className="text-lg text-blue-700 font-semibold mt-2">{day}</p>
            <p className="text-base text-slate-700">{time}</p>
            <p className="text-xs text-slate-500 mt-2">
              {appt.meeting_mode === 'video' && 'Videochiamata'}
              {appt.meeting_mode === 'phone' && 'Telefono'}
              {appt.meeting_mode === 'in_person' && 'In presenza'}
            </p>
          </div>
          {appt.meeting_url && (
            <p className="text-sm">
              <a href={appt.meeting_url} className="text-blue-600 hover:underline">Apri link videochiamata</a>
            </p>
          )}
          {appt.meeting_phone && <p className="text-sm text-slate-700">Telefono: {appt.meeting_phone}</p>}
          {appt.meeting_address && <p className="text-sm text-slate-700">{appt.meeting_address}</p>}
          <p className="text-xs text-slate-500 mt-6">A breve riceverai un'email di conferma con il file calendario.</p>
          <button onClick={() => setShowCancel(true)} className="text-xs text-slate-500 hover:text-red-600 mt-4 underline">
            Devi annullare? Clicca qui
          </button>
        </div>
      </div>
    );
  }

  if (done === 'cancelled') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">🚫</div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Appuntamento annullato</h1>
          <p className="text-sm text-slate-600">Ti ricontatteremo per ripianificare quando preferisci.</p>
        </div>
      </div>
    );
  }

  if (showCancel) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md bg-white rounded-2xl shadow-lg p-8 w-full">
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Annulla appuntamento</h1>
          <p className="text-sm text-slate-600 mb-4">Vuoi dirci perché? (opzionale)</p>
          <textarea
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-2 text-sm h-20 resize-none"
            placeholder="Motivazione..."
          />
          <div className="flex gap-2 mt-4">
            <button onClick={() => setShowCancel(false)} className="flex-1 px-4 py-2 rounded-lg border border-slate-300 text-sm text-slate-700">
              Indietro
            </button>
            <button onClick={handleCancel} disabled={submitting}
              className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50">
              {submitting ? 'Annullamento...' : 'Conferma annullamento'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">{TYPE_LABEL[appt.type] || 'Appuntamento'}</p>
            <h1 className="text-2xl font-semibold text-slate-900">{appt.title}</h1>
            <p className="text-sm text-slate-600 mt-1">
              Ciao {appt.lead_name}, scegli lo slot che preferisci. Durata: <b>{appt.duration_minutes} min</b>.
            </p>
            {appt.description && (
              <p className="text-sm text-slate-700 mt-3 p-3 bg-slate-50 rounded-lg">{appt.description}</p>
            )}
          </div>

          <div className="space-y-3 mb-6">
            {appt.proposed_slots.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-500">
                Nessuno slot proposto. Contattaci per concordare un orario.
              </div>
            ) : (
              appt.proposed_slots.map(slot => {
                const isPast = new Date(slot.start) < new Date();
                if (isPast) return null;
                const { day, time } = fmtSlot(slot.start, appt.duration_minutes);
                const isSelected = selected === slot.start;
                return (
                  <button
                    key={slot.start}
                    onClick={() => setSelected(slot.start)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-900">{day}</p>
                    <p className="text-lg text-slate-700">{time}</p>
                  </button>
                );
              })
            )}
          </div>

          <div className="text-xs text-slate-500 mb-4">
            {appt.meeting_mode === 'video' && 'La chiamata sarà in videochiamata'}
            {appt.meeting_mode === 'phone' && 'La chiamata sarà telefonica'}
            {appt.meeting_mode === 'in_person' && 'Incontro in presenza'}
          </div>

          <button
            onClick={handleConfirm}
            disabled={!selected || submitting}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Conferma...' : selected ? 'Conferma questo orario' : 'Seleziona uno slot'}
          </button>

          <button
            onClick={() => setShowCancel(true)}
            className="w-full mt-2 text-xs text-slate-500 hover:text-red-600 py-2"
          >
            Nessuno slot va bene? Annulla e ti ricontattiamo
          </button>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          🛡️ RescueManager · {appt.lead_company || appt.lead_name}
        </p>
      </div>
    </div>
  );
}
