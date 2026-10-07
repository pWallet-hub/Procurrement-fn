// Typed fetch client: bearer token, single-flight refresh on 401, ApiError parsing.

export const API_BASE: string = (import.meta.env.VITE_API_BASE as string | undefined) || '/api/v1';

const ACCESS_KEY = 'afs.access_token';
const REFRESH_KEY = 'afs.refresh_token';

// Tokens live in localStorage (simple SPA setup). Wrapped: storage can be unavailable.
function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export const tokenStore = {
  get access() {
    return read(ACCESS_KEY);
  },
  get refresh() {
    return read(REFRESH_KEY);
  },
  set(access: string, refresh: string) {
    write(ACCESS_KEY, access);
    write(REFRESH_KEY, refresh);
  },
  clear() {
    write(ACCESS_KEY, null);
    write(REFRESH_KEY, null);
  },
};

/** Parsed `{error:{code,message,fields,hints}}` response. `status` 0 means network failure. `hints`: how to fix each field. */
export class ApiError extends Error {
  status: number;
  code: string;
  fields: Record<string, string>;
  hints: Record<string, string>;
  constructor(status: number, code: string, message: string, fields: Record<string, string> = {}, hints: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.hints = hints;
  }
  get isNetwork() {
    return this.status === 0;
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Something went wrong';
}

/** Generate an Idempotency-Key. Create one per user action and reuse it on retries. */
export function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

let onAuthLost: () => void = () => {};
/** AuthProvider registers a callback invoked when refresh fails (user must sign in again). */
export function setAuthLostHandler(fn: () => void) {
  onAuthLost = fn;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown; // JSON-serialised unless FormData
  auth?: boolean; // default true; false for public endpoints
  idempotencyKey?: string;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = API_BASE.replace(/\/$/, '') + path;
  if (!query) return url;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `${url}?${s}` : url;
}

async function parseError(res: Response): Promise<ApiError> {
  let code = `http.${res.status}`;
  let message = res.statusText || 'Request failed';
  let fields: Record<string, string> = {};
  let hints: Record<string, string> = {};
  try {
    const body = await res.json();
    if (body?.error) {
      code = body.error.code ?? code;
      message = body.error.message ?? message;
      fields = body.error.fields ?? {};
      hints = body.error.hints ?? {};
    }
  } catch {
    /* non JSON body */
  }
  return new ApiError(res.status, code, message, fields, hints);
}

let refreshing: Promise<boolean> | null = null;
/** Single-flight token refresh; resolves true when new tokens are stored. */
function refreshTokens(): Promise<boolean> {
  if (!refreshing) {
    refreshing = (async () => {
      const refresh = tokenStore.refresh;
      if (!refresh) return false;
      try {
        const res = await fetch(buildUrl('/auth/refresh'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refresh }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        tokenStore.set(data.access_token, data.refresh_token);
        return true;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

async function rawRequest(path: string, opts: RequestOptions): Promise<Response> {
  const { method = 'GET', body, auth = true, idempotencyKey, signal, query } = opts;
  const send = () => {
    const headers: Record<string, string> = {};
    let payload: BodyInit | undefined;
    if (body instanceof FormData) payload = body;
    else if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }
    if (auth && tokenStore.access) headers.Authorization = `Bearer ${tokenStore.access}`;
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    return fetch(buildUrl(path, query), { method, headers, body: payload, signal });
  };

  let res: Response;
  try {
    res = await send();
    if (res.status === 401 && auth && tokenStore.refresh) {
      if (await refreshTokens()) res = await send();
      else {
        tokenStore.clear();
        onAuthLost();
      }
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new ApiError(0, 'network', 'Cannot reach the server. Check your connection.');
  }
  if (!res.ok) throw await parseError(res);
  return res;
}

/** JSON request. */
export async function api<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const res = await rawRequest(path, opts);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** Binary request (PDFs, attachments) returned as a Blob. */
export async function apiBlob(path: string, opts: RequestOptions = {}): Promise<Blob> {
  const res = await rawRequest(path, opts);
  return res.blob();
}
