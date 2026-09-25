'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase-browser';

const REASONS: Record<string, { title: string; description: string; tone: 'warning' | 'error' }> = {
  web_disabled: {
    title: 'Accesso dal browser sospeso',
    description: 'L\'accesso alla piattaforma web è stato sospeso dall\'amministratore.',
    tone: 'warning',
  },
  desktop_disabled: {
    title: 'Accesso dall\'applicazione sospeso',
    description: 'L\'accesso dall\'applicazione per il computer è stato sospeso. Entra dal browser, oppure scrivici per riattivarlo.',
    tone: 'warning',
  },
  subscription_expired: {
    title: 'Abbonamento scaduto',
    description: 'L\'abbonamento è scaduto. Per rientrare completa il rinnovo, oppure scrivici e lo sistemiamo insieme.',
    tone: 'error',
  },
  trial_ended: {
    title: 'Periodo di prova finito',
    description: 'Il periodo di prova è finito. Per continuare a usare RescueManager attiva un abbonamento.',
    tone: 'warning',
  },
  default: {
    title: 'Accesso non consentito',
    description: 'Questo account non ha i permessi per entrare in quest\'area. Chiedi all\'amministratore della tua azienda, oppure scrivici.',
    tone: 'error',
  },
};

function NoAccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  const reason = params.get('reason') || 'default';
  const info = REASONS[reason] || REASONS.default;
  const noteClass = info.tone === 'error' ? 'rm-note rm-note--errore' : 'rm-note';

  const handleLogout = async () => {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="rm-prod flex items-center justify-center" style={{ padding: '152px 20px 40px' }}>
      <div className="w-full flex flex-col gap-4" style={{ maxWidth: 520 }}>
        <Link href="/" className="inline-flex" style={{ textDecoration: 'none' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logos/logo-principale-bianco.svg" alt="RescueManager" width={150} height={50} />
        </Link>

        <div className="rm-card flex flex-col gap-4">
          <h1>{info.title}</h1>

          <div className={noteClass} role="alert">
            {info.description} Per sbloccare la situazione scrivi a{' '}
            <a href="mailto:info@rescuemanager.eu">info@rescuemanager.eu</a>, indicando il nome dell&apos;azienda.
          </div>

          {reason === 'web_disabled' && (
            <div className="rm-note rm-note--info">
              Nel frattempo l&apos;applicazione per il computer continua a funzionare.
            </div>
          )}

          <button onClick={handleLogout} className="rm-btn rm-btn--secondary rm-btn--full">
            Esci e torna all&apos;accesso
          </button>
        </div>

        <div className="rm-muted flex flex-col" style={{ gap: 2 }}>
          <span>RescueManager S.r.l.</span>
          <span>Via dello Smeraldo 18, 93012 Gela (CL)</span>
          <span>P.IVA 02176370852 · Capitale sociale € 100,00</span>
          <span>© {new Date().getFullYear()} · <a href="https://rescuemanager.eu">rescuemanager.eu</a></span>
        </div>
      </div>
    </div>
  );
}

export default function NoAccessPage() {
  return (
    <Suspense fallback={
      <div className="rm-prod flex items-center justify-center">
        <p className="rm-muted">Caricamento in corso.</p>
      </div>
    }>
      <NoAccessContent />
    </Suspense>
  );
}
