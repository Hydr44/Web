'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Shield, AlertCircle, Mail, Phone, LogOut, ExternalLink } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase-browser';

const REASONS: Record<string, { title: string; description: string; tone: 'warning' | 'error' }> = {
  web_disabled: {
    title: 'Accesso web temporaneamente disabilitato',
    description: 'L\'accesso alla dashboard web è stato disabilitato dall\'amministratore. Puoi continuare a usare l\'applicazione desktop oppure contattarci per riattivarlo.',
    tone: 'warning',
  },
  desktop_disabled: {
    title: 'Accesso desktop disabilitato',
    description: 'L\'accesso all\'app desktop è stato disabilitato. Usa la dashboard web o contattaci.',
    tone: 'warning',
  },
  subscription_expired: {
    title: 'Abbonamento scaduto',
    description: 'Il tuo abbonamento è scaduto. Per riattivare l\'accesso completa il rinnovo o contattaci.',
    tone: 'error',
  },
  trial_ended: {
    title: 'Periodo di prova terminato',
    description: 'Il tuo periodo di prova è terminato. Per continuare a usare RescueManager attiva un abbonamento.',
    tone: 'warning',
  },
  default: {
    title: 'Accesso non autorizzato',
    description: 'Non hai i permessi necessari per accedere a questa area. Contattaci per assistenza.',
    tone: 'error',
  },
};

function NoAccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  const reason = params.get('reason') || 'default';
  const info = REASONS[reason] || REASONS.default;
  const toneClass = info.tone === 'error' ? 'border-red-500/30 bg-red-500/5' : 'border-amber-500/30 bg-amber-500/5';
  const iconColor = info.tone === 'error' ? 'text-red-400' : 'text-amber-400';

  const handleLogout = async () => {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className={`bg-slate-900 rounded-xl border ${toneClass} p-8 shadow-2xl`}>
          <div className="flex justify-center mb-6">
            <div className={`p-4 rounded-full ${info.tone === 'error' ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
              <Shield className={`h-10 w-10 ${iconColor}`} />
            </div>
          </div>

          <h1 className="text-xl font-semibold text-slate-100 text-center mb-2">
            {info.title}
          </h1>
          <p className="text-sm text-slate-400 text-center leading-relaxed mb-6">
            {info.description}
          </p>

          <div className="bg-slate-800/50 rounded-lg p-4 mb-4 border border-slate-700">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <AlertCircle className="h-3 w-3" /> Contatta il supporto
            </p>
            <div className="space-y-2">
              <a href="mailto:info@rescuemanager.eu"
                className="flex items-center gap-2 text-sm text-slate-200 hover:text-blue-400">
                <Mail className="h-4 w-4 text-slate-500" />
                info@rescuemanager.eu
              </a>
              <a href="tel:+39000000000"
                className="flex items-center gap-2 text-sm text-slate-200 hover:text-blue-400">
                <Phone className="h-4 w-4 text-slate-500" />
                +39 ___ ___ ____
              </a>
              <a href="https://rescuemanager.eu" target="_blank" rel="noopener"
                className="flex items-center gap-2 text-sm text-slate-200 hover:text-blue-400">
                <ExternalLink className="h-4 w-4 text-slate-500" />
                rescuemanager.eu
              </a>
            </div>
          </div>

          {reason === 'web_disabled' && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4 text-xs text-blue-300">
              💡 <strong>Suggerimento</strong>: puoi continuare a lavorare usando l'<strong>app desktop</strong> mentre risolviamo la questione.
            </div>
          )}

          <button onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-lg text-sm transition-colors">
            <LogOut className="h-4 w-4" />
            Esci e torna al login
          </button>
        </div>

        <p className="text-center text-[11px] text-slate-600 mt-4">
          © {new Date().getFullYear()} RescueManager · Gestionale per autodemolizioni
        </p>
      </div>
    </div>
  );
}

export default function NoAccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="text-slate-500">…</div></div>}>
      <NoAccessContent />
    </Suspense>
  );
}
