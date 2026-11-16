import type { Product } from '../src/app/api/types';
import { productPath } from '../src/app/lib/seo';
import { apiGet, asProductList, siteOrigin, type Env } from './_lib/api';

/**
 * GET /sitemap.xml — páginas fijas + un `<url>` por producto activo (desde la API).
 * Si la API no responde, devuelve igual las páginas fijas (con cache corto).
 */

const STATIC_PATHS = ['/', '/productos', '/ofertas', '/contacto', '/envios'];

const xmlEscape = (s: string) =>
  s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c] as string);

const isoDate = (value: unknown) => {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const origin = siteOrigin(env, request);
  const raw = await apiGet<Product[] | { content?: Product[] }>(env, '/product?active=true&detalle=true&paginate=false', 5000);
  const products = asProductList(raw).filter((p) => p && p.id && p.active !== false);

  const urls = [
    ...STATIC_PATHS.map((path) => ({ loc: `${origin}${path}`, lastmod: null as string | null, priority: path === '/' ? '1.0' : '0.8' })),
    ...products.map((p) => ({
      loc: `${origin}${productPath(p.id)}`,
      lastmod: isoDate((p as Product & { updatedAt?: string }).updatedAt),
      priority: '0.6',
    })),
  ];

  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls
      .map(
        (u) =>
          `  <url><loc>${xmlEscape(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<priority>${u.priority}</priority></url>`,
      )
      .join('\n') +
    '\n</urlset>\n';

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // 1 h en navegadores y en el edge de Cloudflare; 5 min si la API falló.
      'Cache-Control': raw ? 'public, max-age=3600, s-maxage=3600' : 'public, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
