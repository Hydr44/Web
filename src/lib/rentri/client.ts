import 'server-only';

import { getRentriAuthorizationToken } from './auth';

const DEFAULT_TIMEOUT_MS = Number.parseInt(process.env.RENTRI_HTTP_TIMEOUT_MS ?? '', 10) || 30000;
const DEFAULT_BASE_URL =
  process.env.RENTRI_GATEWAY_URL?.trim() || 'https://rentri-test.rescuemanager.eu';

const SERVICE_PATHS = {
  anagrafiche: '/anagrafiche/v1.0',
  'ca-rentri': '/ca-rentri/v1.0',
  codifiche: '/codifiche/v1.0',
  'dati-registri': '/dati-registri/v1.0',
  formulari: '/formulari/v1.0',
  'vidimazione-formulari': '/vidimazione-formulari/v1.0',
} as const;

export type RentriService = keyof typeof SERVICE_PATHS;

export interface RentriClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
  defaultHeaders?: Record<string, string>;
}

export interface RentriResponse<T = unknown> {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T | null;
  rawBody: string;
}

interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
  expectedStatusCodes?: number[];
  auth?: boolean;
}

export class RentriError extends Error {
  constructor(
    message: string,
    public readonly response: RentriResponse | null,
  ) {
    super(message);
    this.name = 'RentriError';
  }
}

export class RentriClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly defaultHeaders: Record<string, string>;

  constructor(options: RentriClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultHeaders = options.defaultHeaders ?? {};

    if (!this.baseUrl) {
      throw new Error('Missing RENTRI base URL. Set RENTRI_GATEWAY_URL or pass baseUrl to RentriClient.');
    }
  }

  /**
   * Verifica lo stato di un servizio (equivale ad una chiamata GET /<service>/v1.0/status).
   * In modalità STUB l’endpoint restituisce HTTP 422, che consideriamo comunque una risposta valida.
   */
  async getServiceStatus(service: RentriService): Promise<RentriResponse> {
    const path = `${SERVICE_PATHS[service]}/status`;
    return this.request('GET', path, { expectedStatusCodes: [200, 422], auth: false });
  }

  /**
   * Recupera una tabella di codifica tramite /codifiche/v1.0/lookup.
   */
  async lookupCodifica(tabella: string, params: Record<string, string> = {}): Promise<RentriResponse> {
    if (!tabella) {
      throw new Error('Parametro "tabella" obbligatorio per lookup codifiche');
    }
    const path = `${SERVICE_PATHS.codifiche}/lookup`;
    return this.request('GET', path, {
      query: { tabella, ...params },
      expectedStatusCodes: [200],
    });
  }

  async request<T = unknown>(method: string, path: string, options: RequestOptions = {}): Promise<RentriResponse<T>> {
    const url = new URL(path, this.baseUrl);
    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value === undefined || value === null) continue;
        url.searchParams.set(key, String(value));
      }
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...this.defaultHeaders,
      ...options.headers,
    };

    let body: string | undefined;
    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(options.body);
    }

    if (options.auth !== false) {
      const token = await getRentriAuthorizationToken();
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await this.fetchWithTimeout(url, {
      method,
      headers,
      body,
      timeoutMs: options.timeoutMs ?? this.timeoutMs,
    });

    const rawBody = await response.text();
    const rentriResponse = this.buildResponse<T>(response, rawBody, options.expectedStatusCodes);

    if (!rentriResponse.ok) {
      throw new RentriError(`Richiesta RENTRI fallita (${response.status})`, rentriResponse);
    }

    return rentriResponse;
  }

  private async fetchWithTimeout(url: URL, options: FetchOptions): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

    try {
      return await fetch(url, {
        method: options.method,
        headers: options.headers,
        body: options.body,
        signal: controller.signal,
        cache: 'no-store',
      });
    } catch (error: unknown) {
      let message = 'unknown error';
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }
      throw new RentriError(`Errore connessione RENTRI: ${message}`, null);
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildResponse<T>(
    response: Response,
    rawBody: string,
    expectedStatusCodes?: number[],
  ): RentriResponse<T> {
    let data: T | null = null;
    if (rawBody) {
      try {
        data = JSON.parse(rawBody);
      } catch {
        data = null;
      }
    }

    const ok = response.ok || expectedStatusCodes?.includes(response.status) === true;

    return {
      ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data,
      rawBody,
    };
  }
}

export const rentriClient = new RentriClient();

interface FetchOptions {
  method: string;
  headers: Record<string, string>;
  body?: string;
  timeoutMs: number;
}


