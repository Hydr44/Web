'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FileText, Check, X, Loader2, Download, MessageSquare, Clock, Shield } from 'lucide-react';
import Link from 'next/link';

const MODULE_LABELS: Record<string, string> = {
  trasporti: 'Soccorso & trasporti', tracking: 'Tracking GPS', calendario: 'Calendario',
  clienti: 'Clienti & CRM', mezzi: 'Mezzi', piazzale: 'Custodia veicoli',
  autisti: 'Autisti', ricambi: 'Ricambi', preventivi: 'Preventivi',
  report: 'Report', rvfu: 'Demolizioni RVFU', rentri: 'RENTRI',
  fatturazione: 'Fatturazione Elettronica'
};

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter', professional: 'Professional', business: 'Business', full: 'Full',
  flotta: 'Flotta', enterprise: 'Enterprise', custom: 'Personalizzato'
};

function fmt(n: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n || 0);
}

interface QuotePackage {
  key: string;
  name: string;
  description?: string;
  billing: 'one_time' | 'monthly' | 'note';
  price: number;
  quantity: number;
}
const pkgTotal = (p: QuotePackage) =>
  p.billing === 'note' ? 0 : (Number(p.price) || 0) * Math.max(1, Number(p.quantity) || 1);

// Coordinate bancarie RescueManager SRL (conto Revolut Business) per il bonifico.
const BANK_IBAN = 'LT18 3250 0510 5254 7082';
const BANK_BIC = 'REVOLT21';
const BANK_INTESTATARIO = 'RescueManager SRL';

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
  packages: QuotePackage[];
  one_time_total: number;
  prices_include_vat: boolean;
  discount_reason: string | null;
  setup_description: string | null;
  quote_title: string | null;
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

  // Riepilogo economico (stesso modello del PDF):
  //  - canone mensile di listino → sconto → canone mensile scontato
  //  - importo del periodo contrattuale (annuale -10% / biennale -15%)
  //  - una tantum = setup + pacchetti una tantum (mai scontati)
  const isYearly = quote.contract_duration === 'yearly';
  const isBiennial = quote.contract_duration === 'biennial';
  const packages: QuotePackage[] = Array.isArray(quote.packages) ? quote.packages : [];
  const monthlyPkgs = packages.filter(p => p.billing === 'monthly');
  const oneTimePkgs = packages.filter(p => p.billing === 'one_time');
  const notePkgs = packages.filter(p => p.billing === 'note');
  const monthlyList = (quote.monthly_total || 0) + (quote.discount_amount || 0);
  const yearlyTotal = quote.yearly_total || Math.round(quote.monthly_total * 12 * 0.9 * 100) / 100;
  const biennialTotal = Math.round(quote.monthly_total * 24 * 0.85 * 100) / 100;
  const recurring = isYearly ? yearlyTotal : isBiennial ? biennialTotal : quote.monthly_total;
  const periodLabel = isYearly ? '/anno' : isBiennial ? '/biennio' : '/mese';
  const oneTimeTotal = quote.one_time_total ?? ((quote.setup_fee || 0) + oneTimePkgs.reduce((s, p) => s + pkgTotal(p), 0));
  const firstPayment = recurring + oneTimeTotal;
  const vatLabel = quote.prices_include_vat === false ? 'IVA esclusa' : 'IVA inclusa';
  const vatFooter = quote.prices_include_vat === false
    ? 'I prezzi sono IVA esclusa: l’IVA 22% verrà applicata in fattura.'
    : 'I prezzi indicati sono IVA inclusa.';

  // Importo del bonifico = totale al primo pagamento
  const bonificoRecurring = recurring;
  const bonificoTotal = firstPayment;

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
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                {isYearly ? 'Canone annuale' : isBiennial ? 'Canone biennale' : 'Canone mensile'}
              </p>
              <p className="text-3xl font-extrabold text-blue-400">{fmt(recurring)}</p>
              <p className="text-xs text-slate-500">{periodLabel} · {vatLabel}</p>
              {(isYearly || isBiennial) && (
                <p className="text-xs text-slate-500">pari a {fmt(recurring / (isYearly ? 12 : 24))}/mese</p>
              )}
            </div>
          </div>
          {quote.quote_title && (
            <p className="text-lg font-bold text-white mb-5">{quote.quote_title}</p>
          )}

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
            <div className="p-4 bg-slate-800 border-l-2 border-slate-600 mb-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Personalizzazioni</p>
              <p className="text-sm text-slate-300">{quote.customizations}</p>
            </div>
          )}

          {/* Pacchetti e servizi extra */}
          {packages.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Pacchetti e servizi extra</p>
              <div className="space-y-2">
                {packages.map((p, i) => (
                  <div key={`${p.key}-${i}`} className="flex items-start justify-between gap-4 px-3 py-2 bg-slate-800 border-l-2 border-slate-600">
                    <div className="min-w-0">
                      <p className="text-sm text-slate-200 font-medium">{p.name}{p.quantity > 1 ? ` × ${p.quantity}` : ''}</p>
                      {p.description && <p className="text-xs text-slate-500 mt-0.5">{p.description}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      {p.billing === 'note' ? (
                        <span className="text-xs text-slate-500 italic">voce informativa</span>
                      ) : (
                        <>
                          <p className="text-sm text-slate-200">{fmt(pkgTotal(p))}</p>
                          <p className="text-[11px] text-slate-500">{p.billing === 'monthly' ? 'al mese' : 'una tantum'}</p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pricing Breakdown */}
        <div className="bg-slate-900 border border-slate-800 p-6">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Riepilogo Economico</p>

          <div className="space-y-3">
            {/* Canone: voci di listino */}
            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Canone</p>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Piano {PLAN_LABELS[quote.plan_type] || quote.plan_type}</span>
              <span className="text-slate-200">{fmt(quote.base_price)}/mese</span>
            </div>
            {quote.special_modules_price > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Moduli speciali</span>
                <span className="text-slate-200">{fmt(quote.special_modules_price)}/mese</span>
              </div>
            )}
            {quote.customizations_price > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Personalizzazioni</span>
                <span className="text-slate-200">{fmt(quote.customizations_price)}/mese</span>
              </div>
            )}
            {monthlyPkgs.map((p, i) => (
              <div key={`m-${i}`} className="flex justify-between text-sm">
                <span className="text-slate-400">{p.name}{p.quantity > 1 ? ` × ${p.quantity}` : ''}</span>
                <span className="text-slate-200">{fmt(pkgTotal(p))}/mese</span>
              </div>
            ))}
            {quote.discount_percent > 0 && (
              <>
                <div className="flex justify-between text-sm border-t border-slate-800 pt-3">
                  <span className="text-slate-400">Canone mensile di listino</span>
                  <span className="text-slate-300 line-through decoration-slate-600">{fmt(monthlyList)}/mese</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-400">Sconto {quote.discount_percent}%{quote.discount_reason ? ` (${quote.discount_reason})` : ''}</span>
                  <span className="text-emerald-400">-{fmt(quote.discount_amount)}/mese</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-sm border-t border-slate-800 pt-3">
              <span className="text-slate-200 font-semibold">{quote.discount_percent > 0 ? 'Canone mensile scontato' : 'Canone mensile'}</span>
              <span className="text-slate-100 font-semibold">{fmt(quote.monthly_total)}/mese</span>
            </div>
            {(isYearly || isBiennial) && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">
                  {isYearly ? 'Canone annuale (12 mesi, -10% pagamento anticipato)' : 'Canone biennale (24 mesi, -15% pagamento anticipato)'}
                </span>
                <span className="text-slate-100 font-semibold">{fmt(recurring)}{periodLabel}</span>
              </div>
            )}

            {/* Una tantum */}
            {oneTimeTotal > 0 && (
              <>
                <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest pt-3">Una tantum · solo al primo pagamento</p>
                {quote.setup_fee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Setup iniziale{quote.setup_description ? ` · ${quote.setup_description}` : ''}</span>
                    <span className="text-slate-200">{fmt(quote.setup_fee)}</span>
                  </div>
                )}
                {oneTimePkgs.map((p, i) => (
                  <div key={`o-${i}`} className="flex justify-between text-sm">
                    <span className="text-slate-400">{p.name}{p.quantity > 1 ? ` × ${p.quantity}` : ''}</span>
                    <span className="text-slate-200">{fmt(pkgTotal(p))}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm border-t border-slate-800 pt-3">
                  <span className="text-slate-200 font-semibold">Totale una tantum</span>
                  <span className="text-slate-100 font-semibold">{fmt(oneTimeTotal)}</span>
                </div>
              </>
            )}
            {notePkgs.map((p, i) => (
              <div key={`n-${i}`} className="flex justify-between text-sm">
                <span className="text-slate-400">{p.name}{p.description ? ` · ${p.description}` : ''}</span>
                <span className="text-slate-500 italic">voce informativa</span>
              </div>
            ))}

            {/* Totale */}
            <div className="border-t-2 border-blue-600/30 pt-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-white uppercase tracking-wide">
                  {oneTimeTotal > 0 ? 'Totale al primo pagamento' : 'Totale offerta'}
                </span>
                <span className="text-2xl font-extrabold text-blue-400">{fmt(firstPayment)}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 text-right">
                {oneTimeTotal > 0
                  ? `Canone ${fmt(recurring)}${periodLabel} + una tantum ${fmt(oneTimeTotal)} · periodi successivi ${fmt(recurring)}${periodLabel}`
                  : `Canone ${fmt(recurring)}${periodLabel}`}
              </p>
              <p className="text-xs text-slate-400 mt-1 text-right font-medium">Importi {vatLabel}.</p>
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
                  <><Loader2 className="h-4 w-4 animate-spin" /> {quote.payment_method === 'bank_transfer' ? 'Accettazione…' : 'Reindirizzamento...'}</>
                ) : (
                  <><Check className="h-4 w-4" /> {quote.payment_method === 'bank_transfer' ? 'Accetta preventivo' : 'Accetta e Procedi al Pagamento'}</>
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
        {quote.status === 'accepted' && quote.payment_method === 'bank_transfer' && (
          <div className="bg-slate-900 border-l-4 border-emerald-500 p-6">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Accettato &middot; Bonifico bancario</p>
            <p className="text-white font-bold">Completa con un bonifico</p>
            <p className="text-sm text-slate-400 mt-1 mb-4">Per attivare il servizio effettua un bonifico con i dati qui sotto. Appena lo riceviamo procediamo con la verifica e l&apos;attivazione.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500">IBAN</p>
                <p className="text-white font-mono break-all">{BANK_IBAN}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500">BIC / SWIFT</p>
                <p className="text-white font-mono">{BANK_BIC}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500">Intestatario</p>
                <p className="text-white">{BANK_INTESTATARIO}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500">Causale</p>
                <p className="text-white font-mono">RM-{quote.quote_number}</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Importo da bonificare</p>
              <p className="text-emerald-400 font-bold text-lg">{fmt(bonificoTotal)}</p>
              {oneTimeTotal > 0 && (
                <p className="text-xs text-slate-500">{fmt(bonificoRecurring)} canone + {fmt(oneTimeTotal)} una tantum</p>
              )}
            </div>
          </div>
        )}

        {quote.status === 'accepted' && quote.payment_method !== 'bank_transfer' && (
          <div className="bg-slate-900 border-l-4 border-amber-500 p-6">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">Accettato</p>
            <p className="text-white font-bold">Preventivo accettato</p>
            <p className="text-sm text-slate-400 mt-1">Per procedere, completa il pagamento. Se hai interrotto il checkout, clicca di nuovo su &laquo;Accetta e Procedi al Pagamento&raquo;.</p>
          </div>
        )}

        {quote.status === 'paid' && (
          <div className="bg-slate-900 border-l-4 border-emerald-500 p-6">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Pagato</p>
            <p className="text-white font-bold">Pagamento ricevuto</p>
            <p className="text-sm text-slate-400 mt-2">Ora configura la tua azienda: carica la visura e conferma i dati. Riceverai l&apos;esito della verifica <b>entro 24 ore</b>.</p>
            <Link href={`/configura/${uuid}`} className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors uppercase tracking-wide">
              Configura la tua azienda
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
            {vatFooter} Il servizio è soggetto ai{' '}
            <Link href="/terms-of-use" className="text-slate-500 hover:text-slate-400 underline">Termini e Condizioni</Link>.
          </p>
          <p className="text-xs text-slate-600 mt-1">
            RescueManager di RescueManager S.r.l. — P.IVA 02176370852 — info@rescuemanager.eu
          </p>
        </footer>
      </main>
    </div>
  );
}
