// Pagina pubblica di ritorno dopo la firma del mandato SEPA su GoCardless (F4).
// GoCardless reindirizza qui con ?redirect_flow_id=...; l'operatore copia il
// codice e lo incolla nell'admin per completare il mandato.
'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function ReturnInner() {
  const params = useSearchParams();
  const flowId = params.get('redirect_flow_id') || '';
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard?.writeText(flowId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1220', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <div style={{ maxWidth: 480, width: '100%', background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 24 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Mandato SEPA firmato ✓</h1>
        {flowId ? (
          <>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>
              Torna nell'app RescueManager e incolla questo codice per completare il mandato:
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
              <code style={{ flex: 1, background: '#0b1220', border: '1px solid #1f2937', borderRadius: 8, padding: '10px 12px', fontSize: 12, wordBreak: 'break-all' }}>{flowId}</code>
              <button onClick={copy} style={{ background: '#1d4ed8', color: 'white', border: 'none', borderRadius: 8, padding: '10px 14px', fontSize: 13, cursor: 'pointer' }}>
                {copied ? 'Copiato' : 'Copia'}
              </button>
            </div>
          </>
        ) : (
          <p style={{ fontSize: 13, color: '#fbbf24', marginTop: 8 }}>
            Codice mandato non presente nell'URL. Riprova la procedura dall'app.
          </p>
        )}
        <p style={{ fontSize: 11, color: '#64748b', marginTop: 16 }}>Puoi chiudere questa pagina.</p>
      </div>
    </main>
  );
}

export default function GoCardlessReturnPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0b1220' }} />}>
      <ReturnInner />
    </Suspense>
  );
}
