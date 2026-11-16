import type { Product } from '../../src/app/api/types';
import { productSeo, serializeJsonLd, JSON_LD_ID, SITE_NAME } from '../../src/app/lib/seo';
import { apiGet, siteOrigin, withSecurityHeaders, type Env } from '../_lib/api';

/**
 * GET /producto/:id — sirve el index.html de la SPA con title, description, canonical,
 * Open Graph, Twitter y JSON-LD del producto ya escritos, para los crawlers y previews
 * de links que no ejecutan JS (WhatsApp, Facebook, Instagram…). La SPA arranca igual.
 * Si el id no es válido o la API falla/tarda más de 2 s, devuelve la página sin tocar.
 */

const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const onRequestGet: PagesFunction<Env, 'id'> = async ({ request, env, params, next }) => {
  const id = String(params.id ?? '');
  if (!/^\d+$/.test(id)) return next();

  // index.html de la SPA: Pages lo sirve como fallback de /producto/:id.
  const isHtml = (r: Response) => r.ok && (r.headers.get('Content-Type') ?? '').includes('text/html');
  let page = await next();
  if (page.status === 304) return page;
  if (!isHtml(page)) page = await env.ASSETS.fetch(new URL('/', request.url).toString());
  if (!isHtml(page)) return page;

  const product = await apiGet<Product>(env, `/product/${id}`, 2000);
  const headers = withSecurityHeaders(new Headers(page.headers));
  // El cuerpo cambia: el ETag / largo del index.html original ya no sirven.
  headers.delete('ETag');
  headers.delete('Last-Modified');
  headers.delete('Content-Length');
  if (!product?.id || product.active === false) return new Response(page.body, { status: page.status, headers });

  const seo = productSeo(product, siteOrigin(env, request));
  const meta: [attr: 'name' | 'property', key: string, value: string][] = [
    ['name', 'description', seo.description],
    ['property', 'og:site_name', SITE_NAME],
    ['property', 'og:locale', 'es_AR'],
    ['property', 'og:type', 'product'],
    ['property', 'og:title', seo.title],
    ['property', 'og:description', seo.description],
    ['property', 'og:image', seo.image],
    ['property', 'og:image:width', '1200'],
    ['property', 'og:image:height', '630'],
    ['property', 'og:url', seo.url],
    ['name', 'twitter:card', 'summary_large_image'],
    ['name', 'twitter:title', seo.title],
    ['name', 'twitter:description', seo.description],
    ['name', 'twitter:image', seo.image],
  ];
  if (seo.price !== null) {
    meta.push(['property', 'product:price:amount', seo.price.toFixed(2)], ['property', 'product:price:currency', 'ARS']);
  }

  const head = [
    `<link rel="canonical" href="${escapeAttr(seo.url)}" />`,
    ...meta.map(([attr, key, value]) => `<meta ${attr}="${key}" content="${escapeAttr(value)}" />`),
    `<script type="application/ld+json" id="${JSON_LD_ID}">${serializeJsonLd(seo.jsonLd)}</script>`,
  ].join('\n    ');

  // El HTML cambia con el producto (precio/stock): cache corto en navegador y edge.
  headers.set('Cache-Control', 'public, max-age=0, s-maxage=300, must-revalidate');

  const remove = {
    element: (el: Element) => {
      el.remove();
    },
  };
  return new HTMLRewriter()
    .on('title', {
      element: (el) => {
        el.setInnerContent(seo.title);
      },
    })
    // Se borran los valores por defecto de index.html y se agregan los del producto.
    .on('meta[name="description"]', remove)
    .on('meta[property^="og:"]', remove)
    .on('meta[property^="product:"]', remove)
    .on('meta[name^="twitter:"]', remove)
    .on('link[rel="canonical"]', remove)
    .on('head', {
      element: (el) => {
        el.append(`\n    ${head}\n  `, { html: true });
      },
    })
    .transform(new Response(page.body, { status: page.status, headers }));
};
