'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';
import Link from 'next/link';
import Image from 'next/image';
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

    const payload: Record<string, any> = {
      org_id: orgId,
      address_country: 'IT',
      updated_at: new Date().toISOString()
    };
    for (const [k, v] of Object.entries(data)) {
      payload[k] = v || null;
    }

    const { error: err } = await supabase
      .from('company_settings')
      .upsert(payload, { onConflict: 'org_id' });

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
    router.push('/dashboard');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(SDI_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const set = (field: keyof CompanyData, value: string) =>
    setData(d => ({ ...d, [field]: value }));

  const LeftPanel = () => (
    <div className="hidden lg:flex lg:w-1/2 bg-[#0f172a] flex-col justify-between p-12">
      <Link href="/" className="inline-flex items-center">
        <img 
          src="/assets/logos/logo-principale-bianco.svg" 
          alt="RescueManager"
          width={160}
          height={53}
          className="h-auto"
        />
      </Link>
      <div>
        <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Configurazione iniziale</p>
        <h2 className="text-4xl font-extrabold text-white leading-[1.1] mb-4">
          Quasi pronto<span className="text-blue-500">.</span>
        </h2>
        <p className="text-slate-400 text-base mb-10 max-w-sm">
          Completa la configurazione della tua organizzazione per iniziare a usare RescueManager.
        </p>
        <div className="space-y-3">
          {[
            { n: 1, label: 'Dati Aziendali', done: step > 1 },
            { n: 2, label: 'Codice SDI', done: step > 2 },
          ].map(s => (
            <div key={s.n} className="flex items-center gap-3">
              <div className={`w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 ${s.done ? 'bg-emerald-500 text-white' : step === s.n ? 'bg-blue-500 text-white' : 'border border-slate-600 text-slate-500'}`}>
                {s.done ? '✓' : s.n}
              </div>
              <span className={`text-sm ${s.done ? 'text-emerald-400' : step === s.n ? 'text-white font-medium' : 'text-slate-500'}`}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-600">© {new Date().getFullYear()} RescueManager · rescuemanager.eu</p>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex">
        <LeftPanel />
        <div className="flex-1 bg-white flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <LeftPanel />
      <div className="flex-1 bg-white flex items-start justify-center p-8 lg:p-12 overflow-y-auto">
      <div className="w-full max-w-xl">

        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Link href="/" className="inline-flex items-center">
            <img 
              src="/assets/logos/logo-principale-a-colori.svg" 
              alt="RescueManager"
              width={160}
              height={53}
              className="h-auto"
            />
          </Link>
        </div>

        {/* Step indicator mobile */}
        <div className="lg:hidden flex items-center gap-2 mb-6">
          {[{n:1,l:'Dati'},{n:2,l:'SDI'}].map((s,i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className={`w-6 h-6 flex items-center justify-center text-xs font-bold ${step === s.n ? 'bg-blue-600 text-white' : step > s.n ? 'bg-emerald-500 text-white' : 'border border-gray-300 text-gray-400'}`}>{step > s.n ? '✓' : s.n}</div>
              <span className={`text-xs ${step === s.n ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{s.l}</span>
              {i < 1 && <div className="w-8 h-px bg-gray-200" />}
            </div>
          ))}
        </div>

        {/* ─── STEP 1: Dati Aziendali ─── */}
        {step === 1 && (
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Passo 1 di 2</p>
            <h1 className="text-3xl font-extrabold text-[#0f172a] mb-1">Dati aziendali.</h1>
            <p className="text-sm text-gray-500 mb-8">Verifica e completa i dati della tua organizzazione. I campi con * sono obbligatori.</p>

            {error && (
              <div className="mb-6 border-l-4 border-red-500 bg-red-50 px-4 py-3 flex items-start gap-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">Ragione Sociale *</label>
                  <input value={data.company_name} onChange={e => set('company_name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Nome azienda" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">P.IVA *</label>
                  <input value={data.vat_number} onChange={e => set('vat_number', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="IT12345678901" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">Codice Fiscale</label>
                  <input value={data.codice_fiscale} onChange={e => set('codice_fiscale', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">Forma Giuridica</label>
                  <select value={data.forma_giuridica} onChange={e => set('forma_giuridica', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                    <option value="">— Seleziona —</option>
                    {FORMA_GIURIDICA_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">PEC</label>
                  <input value={data.pec} onChange={e => set('pec', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="info@pec.esempio.it" type="email" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">Telefono</label>
                  <input value={data.phone} onChange={e => set('phone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">Indirizzo Sede Legale <span className="text-gray-400 font-normal normal-case">(opzionale)</span></label>
                <input value={data.address_street} onChange={e => set('address_street', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Via Roma 1" />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">Città</label>
                  <input value={data.address_city} onChange={e => set('address_city', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">Prov.</label>
                  <input value={data.address_province} onChange={e => set('address_province', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    maxLength={2} placeholder="MI" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">CAP</label>
                  <input value={data.address_postal_code} onChange={e => set('address_postal_code', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    maxLength={5} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">Codice ATECO</label>
                  <input value={data.codice_ateco} onChange={e => set('codice_ateco', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="es. 38.31" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">IBAN</label>
                  <input value={data.iban} onChange={e => set('iban', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="IT60 X054 2811 1010 0000 0123 456" />
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button onClick={handleSaveCompany} disabled={saving || !data.company_name || !data.vat_number}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 uppercase tracking-wide">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Salva e Continua <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 2: Codice Destinatario SDI ─── */}
        {step === 2 && (
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Passo 2 di 2</p>
            <h1 className="text-3xl font-extrabold text-[#0f172a] mb-1">Codice SDI.</h1>
            <p className="text-sm text-gray-500 mb-8">
              Questo codice ti permette di ricevere fatture elettroniche direttamente su RescueManager.
            </p>

            <div className="border border-blue-200 bg-blue-50 p-6 mb-6 text-center">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Il tuo Codice Destinatario SDI</p>
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-4xl font-bold font-mono text-[#0f172a] tracking-widest">{SDI_CODE}</span>
                <button onClick={copyCode}
                  className="p-2 border border-gray-200 hover:bg-white transition-colors text-gray-500 hover:text-gray-800">
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500">Codice univoco della tua organizzazione su RescueManager</p>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3 p-4 border border-gray-200">
                <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-1">Come usarlo</p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Comunicalo ai tuoi fornitori quando richiedono il &quot;Codice Destinatario&quot; per l&apos;invio di fatture elettroniche.
                    Le fatture arriveranno direttamente nel modulo Fatturazione di RescueManager.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 border border-gray-200">
                <FileText className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-1">Dove registrarlo</p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Registralo sul portale dell&apos;Agenzia delle Entrate
                    (Fatture e Corrispettivi → Registrazione indirizzo telematico)
                    per ricevere automaticamente tutte le fatture passive.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(1)}
                className="px-5 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium">
                Indietro
              </button>
              <button onClick={handleComplete} disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 uppercase tracking-wide">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Accedi alla Piattaforma
              </button>
            </div>
          </div>
        )}

      </div>
      </div>
    </div>
  );
}
