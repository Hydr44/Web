/**
 * /demo-login?t=<token>
 *
 * Pagina di transito per il primo accesso demo. L'email inviata al lead contiene
 * un link a questa pagina con un token custom (UUID base64url, scadenza 7 giorni
 * controllata da noi nel DB `leads.demo_login_expires_at`). La pagina:
 *  1. Server-side, chiama lead-api /api/leads/redeem-demo-token col token.
 *  2. Lead-api valida + nullifica il token (single-use) + genera al volo un
 *     magic-link Supabase fresco (scade 1h da QUESTA call).
 *  3. La pagina restituisce un redirect HTML al magic-link.
 *
 * Bug risolto: il vecchio flusso emetteva il magic-link Supabase DIRETTAMENTE
 * nell'email, ma ha scadenza fissa 1h non configurabile → se l'utente cliccava
 * dopo (o se l'admin "rinviava" tardi) trovava link scaduto. Ora il magic
 * Supabase nasce solo al click.
 */
import { redirect } from 'next/navigation';
import Link from 'next/link';

const LEAD_API_URL = (process.env.LEAD_API_URL || 'https://lead-api.rescuemanager.eu').replace(/\/+$/, '');
const VPS_API_KEY = process.env.VPS_API_KEY || '';

interface RedeemResult {
  ok: boolean;
  actionLink?: string;
  error?: string;
  status?: number;
}

async function redeemToken(token: string): Promise<RedeemResult> {
  try {
    const r = await fetch(`${LEAD_API_URL}/api/leads/redeem-demo-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': VPS_API_KEY,
      },
      body: JSON.stringify({ token }),
      cache: 'no-store',
    });
    const data = (await r.json().catch(() => ({}))) as { action_link?: string; error?: string };
    if (!r.ok || !data.action_link) {
      return { ok: false, error: data.error || `HTTP ${r.status}`, status: r.status };
    }
    return { ok: true, actionLink: data.action_link };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Errore di rete' };
  }
}

function resolveErrorContent(status: number | undefined, error: string | undefined): { title: string; message: string } {
  if (status === 410) {
    return {
      title: 'Link scaduto',
      message: 'Il tuo link demo è scaduto. Chiedi al tuo referente RescueManager di inviartene uno nuovo dal pannello admin.',
    };
  }
  if (status === 404) {
    return {
      title: 'Link non valido o gia’ usato',
      message: 'Questo link è stato già utilizzato oppure non esiste. I link demo sono single-use per sicurezza. Chiedi un nuovo link al tuo referente.',
    };
  }
  return {
    title: 'Errore',
    message: error || 'Si è verificato un errore inatteso. Riprova tra qualche minuto.',
  };
}

export default async function DemoLoginPage({ searchParams }: Readonly<{ searchParams: Promise<{ t?: string }> }>) {
  const { t } = await searchParams;

  if (!t) {
    return (
      <ErrorScreen
        title="Link non valido"
        message="Manca il token. Controlla che il link copiato dall'email sia completo."
      />
    );
  }

  const result = await redeemToken(t);

  if (result.ok && result.actionLink) {
    // Redirect SSR a Supabase recovery flow. Da qui Supabase imposta i cookie
    // di sessione e poi redireziona a /set-password (configurato lato lead-api).
    redirect(result.actionLink);
  }

  const { title, message } = resolveErrorContent(result.status, result.error);
  return <ErrorScreen title={title} message={message} />;
}

function ErrorScreen({ title, message }: Readonly<{ title: string; message: string }>) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 p-8 text-center shadow-sm">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
          <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">{title}</h1>
        <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/"
            className="inline-flex justify-center items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800"
          >
            Torna alla home
          </Link>
          <a
            href="mailto:info@rescuemanager.eu"
            className="text-xs text-gray-500 hover:text-gray-700 mt-1"
          >
            Hai bisogno di aiuto? info@rescuemanager.eu
          </a>
        </div>
      </div>
    </div>
  );
}
