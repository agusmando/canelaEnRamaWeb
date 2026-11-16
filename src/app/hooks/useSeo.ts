import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { absoluteUrl, DEFAULT_DESCRIPTION, DEFAULT_IMAGE, JSON_LD_ID, pageTitle, serializeJsonLd, SITE_NAME } from '../lib/seo';

export interface SeoOptions {
  /** Sin el sufijo " · Canela en Rama". Vacío = título de la home. */
  title?: string;
  description?: string;
  /** Absoluta o ruta de `public/`. */
  image?: string;
  /** `website` por defecto; `product` en el detalle. */
  type?: 'website' | 'product';
  /** Datos estructurados (schema.org) de la página. */
  jsonLd?: Record<string, unknown> | null;
  /** Precio para `product:price:amount` (og). */
  price?: number | null;
  /** Páginas privadas o de error: `noindex`. */
  noindex?: boolean;
}

function setMeta(attr: 'name' | 'property', key: string, content: string | null | undefined) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!content) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}

function setJsonLd(json: string) {
  const current = document.getElementById(JSON_LD_ID);
  if (!json) {
    current?.remove();
    return;
  }
  const el = current ?? Object.assign(document.createElement('script'), { id: JSON_LD_ID, type: 'application/ld+json' });
  el.textContent = json;
  if (!current) document.head.appendChild(el);
}

/**
 * Título, descripción, canonical, Open Graph / Twitter y JSON-LD de la página.
 * Cada página escribe todos los campos (los que no pasa vuelven al valor por defecto),
 * así no quedan datos de la página anterior. Para los crawlers sin JS, las Pages
 * Functions (`functions/`) inyectan lo mismo en el HTML.
 */
export function useSeo({ title, description, image, type = 'website', jsonLd, price, noindex }: SeoOptions = {}) {
  const { pathname } = useLocation();
  const json = jsonLd ? serializeJsonLd(jsonLd) : '';

  useEffect(() => {
    const origin = window.location.origin;
    const fullTitle = pageTitle(title);
    const desc = description || DEFAULT_DESCRIPTION;
    const img = absoluteUrl(image || DEFAULT_IMAGE, origin);
    const url = absoluteUrl(pathname, origin);

    document.title = fullTitle;
    setMeta('name', 'description', desc);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : null);
    setCanonical(url);
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:locale', 'es_AR');
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:image', img);
    setMeta('property', 'og:url', url);
    setMeta('property', 'product:price:amount', type === 'product' && price != null ? price.toFixed(2) : null);
    setMeta('property', 'product:price:currency', type === 'product' && price != null ? 'ARS' : null);
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', desc);
    setMeta('name', 'twitter:image', img);
    setJsonLd(json);
  }, [title, description, image, type, json, price, noindex, pathname]);
}
