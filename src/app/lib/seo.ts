import type { Product } from '../api/types';
import { cld } from './cloudinary';
import { cardPrice, localKind, productImages } from './shop';

/**
 * Datos SEO compartidos entre la SPA (`useSeo`) y las Cloudflare Pages Functions
 * (`functions/`), que los inyectan en el HTML para los crawlers que no ejecutan JS
 * (WhatsApp, Facebook, Instagram…). Sin DOM ni `import.meta.env`.
 */

export const SITE_NAME = 'Canela en Rama';
export const SITE_URL = 'https://canelaenrama.com.ar';
export const DEFAULT_TITLE = 'Canela en Rama · Almacén natural en Godoy Cruz, Mendoza';
export const DEFAULT_DESCRIPTION =
  'Canela en Rama · almacén natural en Godoy Cruz, Mendoza. Frutos secos, harinas, especias, productos sin TACC y más. Envíos en el Gran Mendoza.';
/** Imagen por defecto para compartir (1200×630, en `public/`). */
export const DEFAULT_IMAGE = '/og-image.jpg';
/** Id del `<script type="application/ld+json">` que se reemplaza en cada página. */
export const JSON_LD_ID = 'seo-jsonld';

export const pageTitle = (title?: string) => (title ? `${title} · ${SITE_NAME}` : DEFAULT_TITLE);

/** Colapsa espacios y corta en ~`max` caracteres sin partir palabras. */
export function truncate(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:—-]+$/, '')}…`;
}

export const absoluteUrl = (pathOrUrl: string, origin = SITE_URL) =>
  /^https?:\/\//i.test(pathOrUrl) ? pathOrUrl : `${origin.replace(/\/+$/, '')}/${pathOrUrl.replace(/^\/+/, '')}`;

export const productPath = (id: number | string) => `/producto/${id}`;

/** Imagen para compartir: 1200×630 recortada (si es de Cloudinary). */
export const shareImage = (url: string) => cld(url, { w: 1200, h: 630, crop: 'fill' });

export interface ProductSeo {
  title: string;
  description: string;
  /** Absoluta. */
  image: string;
  /** Absoluta. */
  url: string;
  price: number | null;
  inStock: boolean;
  jsonLd: Record<string, unknown>;
}

export function productSeo(product: Product, origin = SITE_URL): ProductSeo {
  const url = absoluteUrl(productPath(product.id), origin);
  const images = productImages(product);
  const info = cardPrice(product);
  const price = info ? Math.round(info.price * 100) / 100 : null;
  const inStock = !!info?.hasStock;
  // 100 % de productores locales: no tiene marca comercial (la "marca" cargada es la de la casa)
  const local = localKind(product) === 'all';
  const brand = local ? null : product.Brand?.name;
  const description = truncate(
    product.description?.trim() ||
      `Comprá ${product.name}${local ? ' de productores locales' : brand ? ` de ${brand}` : ''} en Canela en Rama, almacén natural en Godoy Cruz, Mendoza. Envíos en el Gran Mendoza.`,
  );

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description,
    sku: String(product.id),
    url,
    ...(images.length ? { image: images.slice(0, 3).map((i) => cld(i, { w: 1200 })) } : {}),
    ...(brand ? { brand: { '@type': 'Brand', name: brand } } : {}),
    ...(product.Category?.name ? { category: product.Category.name } : {}),
    ...(price !== null
      ? {
          offers: {
            '@type': 'Offer',
            url,
            price: price.toFixed(2),
            priceCurrency: 'ARS',
            availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            itemCondition: 'https://schema.org/NewCondition',
            seller: { '@type': 'Organization', name: SITE_NAME },
          },
        }
      : {}),
  };

  return {
    title: pageTitle(product.name),
    description,
    image: images[0] ? shareImage(images[0]) : absoluteUrl(DEFAULT_IMAGE, origin),
    url,
    price,
    inStock,
    jsonLd,
  };
}

export interface StoreContact {
  phone: string;
  instagram?: string;
  facebook?: string;
  mapsUrl?: string;
}

/** `Store` (LocalBusiness) para la home. */
export function storeJsonLd(contact: StoreContact, origin = SITE_URL): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    url: absoluteUrl('/', origin),
    image: absoluteUrl(DEFAULT_IMAGE, origin),
    logo: absoluteUrl('/apple-touch-icon.png', origin),
    telephone: contact.phone,
    priceRange: '$$',
    currenciesAccepted: 'ARS',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Colombia 1268',
      addressLocality: 'Godoy Cruz',
      addressRegion: 'Mendoza',
      addressCountry: 'AR',
    },
    ...(contact.mapsUrl ? { hasMap: contact.mapsUrl } : {}),
    sameAs: [contact.instagram, contact.facebook].filter(Boolean),
  };
}

/** JSON para incrustar en `<script type="application/ld+json">` sin poder cerrar el tag. */
export const serializeJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
