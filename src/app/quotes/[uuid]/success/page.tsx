'use client';

// Pagina legacy del VECCHIO modello ("Il tuo account è attivo / imposta password /
// accedi") RIMOSSA. Nel flusso unico (modello C) dopo il pagamento NON esiste ancora
// un account: si va al wizard di configurazione (/configura) e l'attivazione avviene
// all'approvazione in Revisione. Reindirizziamo qui per sicurezza, nel caso qualche
// vecchia sessione/link Stripe puntasse ancora a /success.
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function QuoteSuccessRedirect() {
  const { uuid } = useParams<{ uuid: string }>();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/configura/${uuid}?paid=1`);
  }, [uuid, router]);
  return null;
}
