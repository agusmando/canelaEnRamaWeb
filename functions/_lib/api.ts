import type { Product } from '../../src/app/api/types';

/** Variables de entorno de Cloudflare Pages usadas por las Functions. */
export interface Env {
  /** Origen del backend, sin `/api` (p. ej. https://api.canelaenrama.com.ar). */
  API_URL?: string;
  /** Dominio público para canonical/sitemap (p. ej. https://canelaenrama.com.ar). Sin definir: el del request. */
  SITE_URL?: string;
  /** Binding de los archivos estáticos (lo provee Pages). */
  ASSETS: Fetcher;
}

/** GET JSON al backend con timeout; `null` ante cualquier error. Desenvuelve `{ response }`. */
export async function apiGet<T>(env: Env, path: string, timeoutMs = 2000): Promise<T | null> {
  const base = (env.API_URL ?? '').trim().replace(/\/+$/, '');
  if (!base) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}/api${path}`, { headers: { Accept: 'application/json' }, signal: controller.signal });
    if (!res.ok) return null;
    const body = (await res.json()) as { response?: T } | T;
    return body && typeof body === 'object' && 'response' in body ? (body.response ?? null) : (body as T);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** El listado puede venir como array o paginado (`{ content }`). */
export const asProductList = (raw: Product[] | { content?: Product[] } | null): Product[] =>
  Array.isArray(raw) ? raw : (raw?.content ?? []);

/**
 * Los headers de `public/_headers` no se aplican a las respuestas de las Functions:
 * se copian acá. Mantener sincronizado con `public/_headers`.
 */
export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://api.canelaenrama.com.ar https://api-dev.canelaenrama.com.ar https://canelaenramaback.onrender.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; frame-src https://www.google.com",
};

export function withSecurityHeaders(headers: Headers) {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) if (!headers.has(k)) headers.set(k, v);
  return headers;
}

/** Origen público del sitio: SITE_URL si está definida (evita que *.pages.dev quede como canónico). */
export const siteOrigin = (env: Env, request: Request) =>
  (env.SITE_URL ?? '').trim().replace(/\/+$/, '') || new URL(request.url).origin;
