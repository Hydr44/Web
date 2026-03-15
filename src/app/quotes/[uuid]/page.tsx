'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FileText, Check, X, Loader2, Download, MessageSquare, Clock, Shield } from 'lucide-react';
import Link from 'next/link';

const MODULE_LABELS: Record<string, string> = {
  trasporti: 'Trasporti', tracking: 'Tracking GPS', calendario: 'Calendario',
  clienti: 'Clienti & CRM', mezzi: 'Mezzi', piazzale: 'Piazzale',
  autisti: 'Autisti', ricambi: 'Ricambi', preventivi: 'Preventivi',
  report: 'Report', rvfu: 'Demolizioni RVFU', rentri: 'RENTRI',
  fatturazione: 'Fatturazione Elettronica'
};

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter', flotta: 'Flotta', enterprise: 'Enterprise', custom: 'Custom'
};

function fmt(n: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n || 0);
}

interface PublicQuote {
  quote_number: string;
  plan_type: string;
  base_modules: string[];
  special_modules: string[];
  customizations: string | null;
  base_price: number;
  special_modules_price: number;
  customizations_price: number;
  discount_percent: number;
  discount_amount: number;
  monthly_total: number;
  yearly_total: number | null;
  setup_fee: number;
  contract_duration: string;
  payment_method: string;
  billing_frequency: string;
  special_terms: string | null;
  status: string;
  quote_date: string;
  expiry_date: string;
  pdf_url: string | null;
  lead_name: string | null;
  lead_company: string | null;
  is_expired: boolean;
}

export default function PublicQuotePage() {
  const params = useParams();
  const uuid = params.uuid as string;
  const [quote, setQuote] = useState<PublicQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showModifyForm, setShowModifyForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [modificationText, setModificationText] = useState('');

  useEffect(() => {
    if (!uuid) return;
    fetch(`/api/quotes/${uuid}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setQuote(data.quote);
        } else {
          setError(data.error || 'Preventivo non trovato');
        }
      })
      .catch(() => setError('Errore di connessione'))
      .finally(() => setLoading(false));
  }, [uuid]);

  const handleAction = async (action: string, body: Record<string, unknown> = {}) => {
    setActionLoading(action);
    setActionResult(null);
    try {
      const res = await fetch(`/api/quotes/${uuid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...body }),
      });
      const data = await res.json();
      if (data.success) {
        // Se c'è un checkout URL Stripe, reindirizza
        if (data.checkout_url) {
          window.location.href = data.checkout_url;
          return;
        }
        setActionResult({ type: 'success', message: data.message });
        // Refresh quote
        const refreshRes = await fetch(`/api/quotes/${uuid}`);
        const refreshData = await refreshRes.json();
        if (refreshData.success) setQuote(refreshData.quote);
      } else {
        setActionResult({ type: 'error', message: data.error });
      }
    } catch {
      setActionResult({ type: 'error', message: 'Errore di connessione' });
    } finally {
      setActionLoading('');
      setShowRejectForm(false);
      setShowModifyForm(false);
    }
  };

  const BrandHeader = ({ status }: { status?: { label: string; color: string } }) => (
    <header className="border-b border-slate-800 bg-[#0f172a] sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-extrabold text-white tracking-tight">
          RESCUE<span className="text-blue-500">MANAGER</span>
        </Link>
        {status && (
          <span className={`text-xs font-bold px-3 py-1 uppercase tracking-widest ${status.color}`}>
            {status.label}
          </span>
        )}
      </div>
    </header>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col">
        <BrandHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="h-10 w-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 text-sm">Caricamento preventivo...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col">
        <BrandHeader />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 border-2 border-red-500/50 bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <X className="h-8 w-8 text-red-400" />
            </div>
            <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Errore</p>
            <h1 className="text-2xl font-extrabold text-white mb-3">Preventivo non trovato</h1>
            <p className="text-slate-400 text-sm mb-8">{error || 'Il link potrebbe essere scaduto o non valido.'}</p>
            <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors uppercase tracking-wide">
              Vai al sito
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isActionable = ['sent', 'viewed'].includes(quote.status) && !quote.is_expired;

  const durationLabel = quote.contract_duration === 'yearly' ? 'Annuale' :
    quote.contract_duration === 'biennial' ? 'Biennale' : 'Mensile';
  const billingLabel = quote.billing_frequency === 'yearly' ? 'Annuale' :
    quote.billing_frequency === 'quarterly' ? 'Trimestrale' : 'Mensile';

  const statusConfig: Record<string, { label: string; color: string; icon: typeof Check }> = {
    draft: { label: 'Bozza', color: 'text-slate-400', icon: FileText },
    sent: { label: 'In attesa risposta', color: 'text-blue-400', icon: Clock },
    viewed: { label: 'In attesa risposta', color: 'text-blue-400', icon: Clock },
    accepted: { label: 'Accettato', color: 'text-emerald-400', icon: Check },
    paid: { label: 'Pagato', color: 'text-emerald-400', icon: Check },
    rejected: { label: 'Rifiutato', color: 'text-red-400', icon: X },
    expired: { label: 'Scaduto', color: 'text-amber-400', icon: Clock },
  };

  const currentStatus = quote.is_expired ? statusConfig.expired : (statusConfig[quote.status] || statusConfig.draft);

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <BrandHeader status={currentStatus} />

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-5">
        {/* Action Result Banner */}
        {actionResult && (
          <div className={`px-4 py-3 border-l-4 text-sm font-medium ${
            actionResult.type === 'success'
              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
              : 'border-red-500 bg-red-500/10 text-red-400'
          }`}>
            {actionResult.message}
          </div>
        )}

        {/* Quote Header */}
        <div className="bg-slate-900 border border-slate-800 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-2">Preventivo</p>
              <h1 className="text-3xl font-extrabold text-white">{quote.quote_number}</h1>
              {(quote.lead_name || quote.lead_company) && (
                <p className="text-sm text-slate-400 mt-2">
                  Per: <span className="text-slate-300 font-medium">{quote.lead_name}</span>{quote.lead_company ? ` — ${quote.lead_company}` : ''}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Data emissione</p>
              <p className="text-sm text-slate-300 mt-1">{new Date(quote.quote_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-3">Valido fino al</p>
              <p className={`text-sm mt-1 font-medium ${quote.is_expired ? 'text-red-400' : 'text-slate-300'}`}>
                {new Date(quote.expiry_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                {quote.is_expired && ' — Scaduto'}
              </p>
            </div>
          </div>
        </div>

        {/* Plan */}
        <div className="bg-slate-900 border border-slate-800 p-6">
          <div className="flex items-start justify-between mb-6 pb-6 border-b border-slate-800">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Piano</p>
              <p className="text-2xl font-extrabold text-white">{PLAN_LABELS[quote.plan_type] || quote.plan_type}</p>
              <p className="text-xs text-slate-500 mt-1">Contratto {durationLabel} · Fatturazione {billingLabel}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Totale mensile</p>
              <p className="text-3xl font-extrabold text-blue-400">{fmt(quote.monthly_total)}</p>
              <p className="text-xs text-slate-500">/mese IVA esclusa</p>
            </div>
          </div>

          {/* Base Modules */}
          <div className="mb-5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Moduli Base Inclusi</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(quote.base_modules || []).map(mod => (
                <div key={mod} className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-sm text-slate-300">
                  <Check className="h-3 w-3 text-blue-500 shrink-0" />
                  {MODULE_LABELS[mod] || mod}
                </div>
              ))}
            </div>
          </div>

          {/* Special Modules */}
          {quote.special_modules && quote.special_modules.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Moduli Speciali</p>
              <div className="space-y-2">
                {quote.special_modules.map(mod => (
                  <div key={mod} className="flex items-center gap-2 px-3 py-2 bg-blue-600/10 border-l-2 border-blue-500">
                    <Shield className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    <span className="text-sm text-blue-300 font-medium">{MODULE_LABELS[mod] || mod}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customizations */}
          {quote.customizations && (
            <div className="p-4 bg-slate-800 border-l-2 border-slate-600">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Personalizzazioni</p>
              <p className="text-sm text-slate-300">{quote.customizations}</p>
            </div>
          )}
        </div>

        {/* Pricing Breakdown */}
        <div className="bg-slate-900 border border-slate-800 p-6">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Riepilogo Economico</p>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Piano Base</span>
              <span className="text-slate-200">{fmt(quote.base_price)}/mese</span>
            </div>
            {quote.special_modules_price > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Moduli Speciali</span>
                <span className="text-slate-200">{fmt(quote.special_modules_price)}/mese</span>
              </div>
            )}
            {quote.customizations_price > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Personalizzazioni</span>
                <span className="text-slate-200">{fmt(quote.customizations_price)}/mese</span>
              </div>
            )}
            {quote.discount_percent > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-emerald-400">Sconto ({quote.discount_percent}%)</span>
                <span className="text-emerald-400">-{fmt(quote.discount_amount)}</span>
              </div>
            )}
            {quote.setup_fee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Setup iniziale (una tantum)</span>
                <span className="text-slate-200">{fmt(quote.setup_fee)}</span>
              </div>
            )}

            <div className="border-t-2 border-blue-600/30 pt-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-white uppercase tracking-wide">Totale Mensile</span>
                <span className="text-2xl font-extrabold text-blue-400">{fmt(quote.monthly_total)}/mese</span>
              </div>
              {quote.yearly_total && (
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-slate-500">Totale Annuale</span>
                  <span className="text-slate-400">{fmt(quote.yearly_total)}/anno</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Special Terms */}
        {quote.special_terms && (
          <div className="bg-slate-900 border border-slate-800 p-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Condizioni Speciali</p>
            <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{quote.special_terms}</p>
          </div>
        )}

        {/* PDF Download */}
        {quote.pdf_url && (
          <div className="flex justify-center">
            <a href={quote.pdf_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors text-sm font-medium border border-slate-700">
              <Download className="h-4 w-4" /> Scarica PDF
            </a>
          </div>
        )}

        {/* Actions */}
        {isActionable && (
          <div className="bg-slate-900 border border-slate-800 p-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-5">Rispondi al preventivo</p>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <button onClick={() => handleAction('accept')} disabled={!!actionLoading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors font-bold text-sm uppercase tracking-wide disabled:opacity-50">
                {actionLoading === 'accept' ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Reindirizzamento...</>
                ) : (
                  <><Check className="h-4 w-4" /> Accetta e Procedi al Pagamento</>
                )}
              </button>
              <button onClick={() => setShowModifyForm(!showModifyForm)} disabled={!!actionLoading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors font-medium text-sm disabled:opacity-50">
                <MessageSquare className="h-4 w-4" /> Richiedi Modifiche
              </button>
              <button onClick={() => setShowRejectForm(!showRejectForm)} disabled={!!actionLoading}
                className="flex items-center justify-center gap-2 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors text-sm border border-red-500/20 disabled:opacity-50">
                <X className="h-4 w-4" /> Rifiuta
              </button>
            </div>

            {/* Reject Form */}
            {showRejectForm && (
              <div className="bg-red-500/5 border-l-4 border-red-500 p-4 mt-3">
                <p className="text-sm text-red-400 font-medium mb-2">Motivo del rifiuto (opzionale):</p>
                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-200 resize-none h-20 focus:outline-none focus:border-red-500/50"
                  placeholder="Spiega perché stai rifiutando il preventivo..." />
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={() => setShowRejectForm(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200">Annulla</button>
                  <button onClick={() => handleAction('reject', { reason: rejectReason })} disabled={!!actionLoading}
                    className="px-4 py-1.5 text-xs bg-red-600 text-white hover:bg-red-700 font-bold uppercase tracking-wide disabled:opacity-50">
                    Conferma Rifiuto
                  </button>
                </div>
              </div>
            )}

            {/* Modify Form */}
            {showModifyForm && (
              <div className="bg-blue-500/5 border-l-4 border-blue-500 p-4 mt-3">
                <p className="text-sm text-blue-400 font-medium mb-2">Descrivi le modifiche desiderate:</p>
                <textarea value={modificationText} onChange={e => setModificationText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-200 resize-none h-24 focus:outline-none focus:border-blue-500/50"
                  placeholder="es. Aggiungere il modulo RENTRI, ridurre il prezzo base, cambiare durata contratto..." />
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={() => setShowModifyForm(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200">Annulla</button>
                  <button onClick={() => handleAction('request_modification', { modification_text: modificationText })}
                    disabled={!!actionLoading || !modificationText.trim()}
                    className="px-4 py-1.5 text-xs bg-blue-600 text-white hover:bg-blue-700 font-bold uppercase tracking-wide disabled:opacity-50">
                    Invia Richiesta
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status messages */}
        {quote.status === 'accepted' && (
          <div className="bg-slate-900 border-l-4 border-emerald-500 p-6">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Accettato</p>
            <p className="text-white font-bold">Preventivo Accettato</p>
            <p className="text-sm text-slate-400 mt-1">Ti contatteremo a breve per completare la procedura di attivazione.</p>
          </div>
        )}

        {quote.status === 'paid' && (
          <div className="bg-slate-900 border-l-4 border-emerald-500 p-6">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Pagato</p>
            <p className="text-white font-bold">Pagamento Completato</p>
            <p className="text-sm text-slate-400 mt-2">Il tuo account è stato attivato. Accedi all&apos;area personale per iniziare.</p>
            <Link href="/login" className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors uppercase tracking-wide">
              Accedi a RescueManager
            </Link>
          </div>
        )}

        {quote.status === 'rejected' && (
          <div className="bg-slate-900 border-l-4 border-red-500 p-6">
            <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Rifiutato</p>
            <p className="text-white font-bold">Preventivo Rifiutato</p>
            <p className="text-sm text-slate-400 mt-1">Hai rifiutato questo preventivo. Contattaci per un nuovo preventivo personalizzato.</p>
          </div>
        )}

        {quote.is_expired && !['accepted', 'paid', 'rejected'].includes(quote.status) && (
          <div className="bg-slate-900 border-l-4 border-amber-500 p-6">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">Scaduto</p>
            <p className="text-white font-bold">Preventivo Scaduto</p>
            <p className="text-sm text-slate-400 mt-1">Questo preventivo è scaduto. Contattaci per un nuovo preventivo aggiornato.</p>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center pt-8 pb-12 border-t border-slate-800">
          <p className="text-xs text-slate-600">
            I prezzi sono IVA esclusa. Il servizio è soggetto ai{' '}
            <Link href="/terms-of-use" className="text-slate-500 hover:text-slate-400 underline">Termini e Condizioni</Link>.
          </p>
          <p className="text-xs text-slate-600 mt-1">
            RescueManager di Scozzarini Emmanuel — P.IVA 02166430856 — info@rescuemanager.eu
          </p>
        </footer>
      </main>
    </div>
  );
}
