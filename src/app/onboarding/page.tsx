'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';
import {
  Building2, FileText, CheckCircle, ArrowRight, Loader2,
  AlertCircle, Copy, Check, Info
} from 'lucide-react';

const FORMA_GIURIDICA_OPTIONS = [
  'SRL', 'SRL Semplificata', 'SPA', 'SNC', 'SAS',
  'Società Cooperativa', 'Impresa Individuale', 'Associazione', 'Altro'
];

const SDI_CODE = process.env.NEXT_PUBLIC_SDI_RECIPIENT_CODE || 'XXXXXXX';

type CompanyData = {
  company_name: string;
  vat_number: string;
  codice_fiscale: string;
  pec: string;
  phone: string;
  address_street: string;
  address_city: string;
  address_province: string;
  address_postal_code: string;
  forma_giuridica: string;
  codice_ateco: string;
  iban: string;
  sdi_recipient_code: string;
};

const empty: CompanyData = {
  company_name: '', vat_number: '', codice_fiscale: '', pec: '', phone: '',
  address_street: '', address_city: '', address_province: '', address_postal_code: '',
  forma_giuridica: '', codice_ateco: '', iban: '', sdi_recipient_code: ''
};

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [step, setStep] = useState(1);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [data, setData] = useState<CompanyData>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      // Carica profilo per trovare org
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_org, onboarding_completed')
        .eq('id', user.id)
        .single();

      if (profile?.onboarding_completed) {
        router.push('/staff');
        return;
      }

      if (profile?.current_org) {
        setOrgId(profile.current_org);

        // Carica company_settings pre-compilate
        const { data: cs } = await supabase
          .from('company_settings')
          .select('*')
          .eq('org_id', profile.current_org)
          .single();

        if (cs) {
          setData({
            company_name: cs.company_name || '',
            vat_number: cs.vat_number || '',
            codice_fiscale: cs.codice_fiscale || '',
            pec: cs.pec || '',
            phone: cs.phone || '',
            address_street: cs.address_street || '',
            address_city: cs.address_city || '',
            address_province: cs.address_province || '',
            address_postal_code: cs.address_postal_code || '',
            forma_giuridica: cs.forma_giuridica || '',
            codice_ateco: cs.codice_ateco || '',
            iban: cs.iban || '',
            sdi_recipient_code: cs.sdi_recipient_code || SDI_CODE
          });
        }
      }

      setLoading(false);
    };
    init();
  }, []);

  const handleSaveCompany = async () => {
    if (!orgId) return;
    setSaving(true);
    setError('');

    const { error: err } = await supabase
      .from('company_settings')
      .upsert({ ...data, org_id: orgId, address_country: 'IT', updated_at: new Date().toISOString() }, { onConflict: 'org_id' });

    if (err) { setError(`Errore salvataggio: ${err.message}`); setSaving(false); return; }
    setSaving(false);
    setStep(2);
  };

  const handleComplete = async () => {
    setSaving(true);
    await supabase.auth.updateUser({ data: { onboarding_completed: true } });
    if (orgId) {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('current_org', orgId);
    }
    router.push('/staff');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(SDI_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const set = (field: keyof CompanyData, value: string) =>
    setData(d => ({ ...d, [field]: value }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 px-6 py-12">
      <div className="max-w-2xl mx-auto">

        {/* Progress */}
        <div className="flex items-center gap-3 mb-8">
          {[
            { n: 1, label: 'Dati Azienda', icon: Building2 },
            { n: 2, label: 'Codice SDI', icon: FileText },
            { n: 3, label: 'Completato', icon: CheckCircle },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-3 flex-1">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${step === s.n ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : step > s.n ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800/50 text-slate-500'}`}>
                <s.icon className="h-4 w-4" />
                <span className="text-xs font-medium">{s.label}</span>
              </div>
              {i < 2 && <div className={`h-px flex-1 ${step > s.n ? 'bg-emerald-500/40' : 'bg-slate-700'}`} />}
            </div>
          ))}
        </div>

        {/* ─── STEP 1: Dati Aziendali ─── */}
        {step === 1 && (
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
            <div className="mb-6">
              <h1 className="text-xl font-bold text-slate-100 mb-1">Verifica i dati aziendali</h1>
              <p className="text-sm text-slate-400">
                Questi dati verranno usati per la fatturazione e per la configurazione della tua organizzazione.
                Sono stati pre-compilati dal nostro team — verifica e completa se necessario.
              </p>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Ragione Sociale *</label>
                  <input value={data.company_name} onChange={e => set('company_name', e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
                    placeholder="Nome azienda" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">P.IVA *</label>
                  <input value={data.vat_number} onChange={e => set('vat_number', e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
                    placeholder="IT12345678901" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Codice Fiscale</label>
                  <input value={data.codice_fiscale} onChange={e => set('codice_fiscale', e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Forma Giuridica</label>
                  <select value={data.forma_giuridica} onChange={e => set('forma_giuridica', e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50">
                    <option value="">— Seleziona —</option>
                    {FORMA_GIURIDICA_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">PEC</label>
                  <input value={data.pec} onChange={e => set('pec', e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
                    placeholder="info@pec.esempio.it" type="email" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Telefono</label>
                  <input value={data.phone} onChange={e => set('phone', e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Indirizzo Sede Legale</label>
                <input value={data.address_street} onChange={e => set('address_street', e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
                  placeholder="Via Roma 1" />
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Città</label>
                  <input value={data.address_city} onChange={e => set('address_city', e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Prov.</label>
                  <input value={data.address_province} onChange={e => set('address_province', e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
                    maxLength={2} placeholder="MI" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">CAP</label>
                  <input value={data.address_postal_code} onChange={e => set('address_postal_code', e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
                    maxLength={5} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Codice ATECO</label>
                  <input value={data.codice_ateco} onChange={e => set('codice_ateco', e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
                    placeholder="es. 38.31" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">IBAN</label>
                  <input value={data.iban} onChange={e => set('iban', e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
                    placeholder="IT60 X054 2811 1010 0000 0123 456" />
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button onClick={handleSaveCompany} disabled={saving || !data.company_name || !data.vat_number}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Salva e Continua <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 2: Codice Destinatario SDI ─── */}
        {step === 2 && (
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
            <div className="mb-6">
              <h1 className="text-xl font-bold text-slate-100 mb-1">Codice Destinatario SDI</h1>
              <p className="text-sm text-slate-400">
                Questo è il codice che dovrai fornire ai tuoi clienti e fornitori per ricevere
                fatture elettroniche attraverso la piattaforma RescueManager.
              </p>
            </div>

            <div className="bg-slate-900/50 rounded-xl border border-blue-500/30 p-6 mb-6 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Il tuo Codice Destinatario SDI</p>
              <div className="flex items-center justify-center gap-3 mb-3">
                <span className="text-4xl font-bold font-mono text-blue-400 tracking-widest">{SDI_CODE}</span>
                <button onClick={copyCode}
                  className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-200">
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Questo codice è unico per la tua organizzazione su RescueManager
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/30 border border-slate-700/50">
                <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-200 mb-1">Come usarlo</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Comunica questo codice ai tuoi fornitori quando richiedono il &quot;Codice Destinatario&quot; o 
                    &quot;Codice Univoco Ufficio&quot; per l&apos;invio di fatture elettroniche. 
                    Le fatture arriveranno direttamente nel modulo Fatturazione di RescueManager.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/30 border border-slate-700/50">
                <FileText className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-200 mb-1">Dove inserirlo</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Registra questo codice anche sul portale dell&apos;Agenzia delle Entrate 
                    (sezione &quot;Fatture e Corrispettivi&quot; → &quot;Registrazione dell&apos;indirizzo telematico&quot;) 
                    per ricevere automaticamente tutte le fatture passive.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(1)}
                className="px-4 py-2.5 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors text-sm border border-slate-600/50">
                Indietro
              </button>
              <button onClick={handleComplete} disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Accedi alla Piattaforma
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
