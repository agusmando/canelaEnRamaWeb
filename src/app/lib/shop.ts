import type { Measure, Offer, Product, ProductVariant } from '../api/types';
import { formatCurrency, formatNumber } from './utils';

/**
 * Reglas de precios y presentaciones, espejo de las del backend
 * (`utils/pricing.ts`, `PricingService`, `OfferService`). El carrito siempre
 * muestra la cotización oficial del servidor; esto es para catálogo y detalle.
 */

// ---------------------------------------------------------------- Variantes visibles

export const isWebVariant = (v: ProductVariant) => v.active && v.availableWeb && (v.finalPrice ?? 0) > 0;

export function webVariants(p: Product): ProductVariant[] {
  return (p.variants ?? []).filter(isWebVariant).sort((a, b) => (a.finalPrice ?? 0) - (b.finalPrice ?? 0));
}

export const inStock = (v: ProductVariant) => Number(v.currentStock) > 0;

export function productImages(p: Product, preferred?: ProductVariant): string[] {
  const ordered = preferred ? [preferred, ...(p.variants ?? []).filter((v) => v.id !== preferred.id)] : p.variants ?? [];
  const urls = ordered.flatMap((v) => (v.images ?? []).map((i) => i.secure_url));
  return Array.from(new Set(urls));
}

// ---------------------------------------------------------------- Unidades

/** Unidad en la que se mide el stock / las presentaciones. */
export function stockUnit(m?: Measure | string | null) {
  switch (m) {
    case 'KG':
    case 'G':
      return 'g';
    case 'L':
      return 'L';
    case 'ML':
      return 'ml';
    default:
      return 'u';
  }
}

/** 250 → "250g", 1000 → "1kg", 6 (U) → "6 u". */
export function packLabel(size: number, m?: Measure | string | null) {
  if (m === 'KG' || m === 'G') {
    return size >= 1000 ? `${formatNumber(size / 1000)}kg` : `${formatNumber(size)}g`;
  }
  if (m === 'ML' && size >= 1000) return `${formatNumber(size / 1000)}L`;
  return `${formatNumber(size)} ${stockUnit(m)}`;
}

/** Cantidad de stock (g/u) → unidades de precio (kg/u). */
export const toPriceUnits = (stockUnits: number, m?: Measure | string | null) => (m === 'KG' ? stockUnits / 1000 : stockUnits);

export const priceUnitLabel = (m?: Measure | string | null) => (m === 'KG' ? 'kg' : m === 'G' ? 'g' : m === 'L' ? 'L' : m === 'ML' ? 'ml' : 'u');

/** Presentaciones ordenadas; vacío = venta suelta. */
export const packOptions = (v: ProductVariant) =>
  (v.packagingOptions ?? []).map(Number).filter((n) => n > 0).sort((a, b) => a - b);

// ---------------------------------------------------------------- Ofertas

export function selectOffer(v: ProductVariant, p?: Product, now = new Date()): Offer | undefined {
  const isValid = (o: Offer) => {
    if (o.active === false) return false;
    if (o.startTime && new Date(o.startTime) > now) return false;
    if (o.finishTime && new Date(o.finishTime) < now) return false;
    const threshold = Math.max(Number(o.stockThreshold) || 0, Number(v.stockThreshold) || 0);
    return !(threshold > 0 && Number(v.currentStock) < threshold);
  };
  const pick = (offers: Offer[] = []) => offers.filter(isValid).sort((a, b) => b.id - a.id)[0];
  return pick(v.offers) ?? pick(p?.offers ?? v.product?.offers);
}

/** Precio por unidad de precio luego de la oferta, para `priceUnits` unidades. */
export function applyOffer(unitPrice: number, priceUnits: number, o?: Offer): number {
  if (!o || priceUnits <= 0) return unitPrice;
  const value = Number(o.discountValue ?? 0);
  switch (o.discountType) {
    case 'PERCENTAGE':
      return unitPrice * (1 - value / 100);
    case 'FIXED':
      return Math.max(0, unitPrice - value);
    case 'BUY_ONE_GET_MORE':
    case 'BUY_MORE_GET_MORE': {
      const take = Number(o.discountQuantity) || 1;
      const pay = Number(o.quantityToGet) || take;
      if (priceUnits < take) return unitPrice;
      const sets = Math.floor(priceUnits / take);
      const rest = priceUnits - sets * take;
      return ((sets * pay + rest) * unitPrice) / priceUnits;
    }
    case 'BUY_MORE_GET_DISCOUNT':
      return priceUnits >= (Number(o.discountQuantity) || 0) ? unitPrice * (1 - value / 100) : unitPrice;
    case 'BUY_MORE_GET_FIXED_DISCOUNT':
      return priceUnits >= (Number(o.discountQuantity) || 0) ? Math.max(0, unitPrice - value) : unitPrice;
    default:
      return unitPrice;
  }
}

/** Texto corto para la etiqueta verde de la tarjeta. */
export function offerBadge(o?: Offer): string | null {
  if (!o) return null;
  switch (o.discountType) {
    case 'PERCENTAGE':
      return `${formatNumber(o.discountValue)}%`;
    case 'FIXED':
      return `-${formatCurrency(o.discountValue)}`;
    case 'BUY_ONE_GET_MORE':
    case 'BUY_MORE_GET_MORE':
      return `${o.discountQuantity}x${o.quantityToGet}`;
    case 'BUY_MORE_GET_DISCOUNT':
    case 'BUY_MORE_GET_FIXED_DISCOUNT':
      return 'Promo';
    default:
      return null;
  }
}

/** Descripción para el detalle del producto. */
export function offerDescription(o: Offer, m?: Measure | string | null): string {
  const u = priceUnitLabel(m);
  const value = Number(o.discountValue ?? 0);
  switch (o.discountType) {
    case 'PERCENTAGE':
      return `${formatNumber(value)}% de descuento`;
    case 'FIXED':
      return `${formatCurrency(value)} menos por ${u}`;
    case 'BUY_ONE_GET_MORE':
    case 'BUY_MORE_GET_MORE':
      return `Llevando ${o.discountQuantity} ${u} pagás ${o.quantityToGet}`;
    case 'BUY_MORE_GET_DISCOUNT':
      return `${formatNumber(value)}% off comprando desde ${o.discountQuantity} ${u}`;
    case 'BUY_MORE_GET_FIXED_DISCOUNT':
      return `${formatCurrency(value)} menos por ${u} comprando desde ${o.discountQuantity} ${u}`;
    default:
      return 'Oferta';
  }
}

// ---------------------------------------------------------------- Cotización

export interface Quote {
  /** Total con oferta. */
  total: number;
  /** Total de lista (sin oferta). */
  list: number;
  /** Unidades de stock (g/u). */
  stockUnits: number;
}

/**
 * @param pack tamaño del paquete (null = venta suelta)
 * @param qty  paquetes si hay `pack`; si no g/u
 */
export function quote(v: ProductVariant, pack: number | null, qty: number, p?: Product): Quote {
  const unit = Number(v.finalPrice ?? 0);
  const stockUnits = pack ? pack * qty : qty;
  const priceUnits = toPriceUnits(stockUnits, v.contentMeasure);
  const after = applyOffer(unit, priceUnits, selectOffer(v, p));
  return { total: after * priceUnits, list: unit * priceUnits, stockUnits };
}

/** Lo que muestra la tarjeta: el precio de la presentación más chica de la variante más barata. */
export function cardPrice(p: Product) {
  const variants = webVariants(p);
  const v = variants.find(inStock) ?? variants[0];
  if (!v) return null;
  const pack = packOptions(v)[0] ?? null;
  // Venta suelta: precio por kg (1000 g) o por unidad.
  const size = pack ?? (v.contentMeasure === 'KG' ? 1000 : 1);
  const q = quote(v, size, 1, p);
  const offer = selectOffer(v, p);
  return {
    variant: v,
    price: q.total,
    list: q.list,
    unitLabel: pack ? packLabel(pack, v.contentMeasure) : priceUnitLabel(v.contentMeasure),
    badge: offerBadge(offer),
    hasStock: variants.some(inStock),
  };
}

/** Normaliza para búsquedas: minúsculas y sin acentos. */
export const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

export const slugify = (s: string) => normalize(s).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// ---------------------------------------------------------------- Selector de compra

/** Pesos sugeridos para la venta suelta por peso (g). */
export const LOOSE_WEIGHTS = [100, 250, 500, 1000, 2000];

/** Precio equivalente por unidad de precio (kg / u) de una presentación, con oferta. */
export function perUnitPrice(v: ProductVariant, pack: number, p?: Product) {
  const q = quote(v, pack, 1, p);
  const units = toPriceUnits(pack, v.contentMeasure);
  return units > 0 ? q.total / units : 0;
}

/**
 * Ofertas por cantidad todavía no alcanzadas: cuánto falta (en unidades de stock g/u)
 * para activarla. `null` si no hay oferta por cantidad o ya se cumple.
 */
export function offerProgress(v: ProductVariant, stockUnits: number, p?: Product) {
  const o = selectOffer(v, p);
  if (!o) return null;
  const threshold =
    o.discountType === 'BUY_MORE_GET_DISCOUNT' || o.discountType === 'BUY_MORE_GET_FIXED_DISCOUNT'
      ? Number(o.discountQuantity) || 0
      : o.discountType === 'BUY_ONE_GET_MORE' || o.discountType === 'BUY_MORE_GET_MORE'
        ? Number(o.discountQuantity) || 0
        : 0;
  if (threshold <= 0) return null;
  // Umbral en unidades de stock (kg → g).
  const target = v.contentMeasure === 'KG' ? threshold * 1000 : threshold;
  if (stockUnits >= target) return { reached: true as const, offer: o, target, missing: 0, ratio: 1 };
  return { reached: false as const, offer: o, target, missing: target - stockUnits, ratio: stockUnits / target };
}

/**
 * Línea por defecto para "agregar rápido" desde una tarjeta: la presentación más chica
 * de la única variante, o 1 unidad. `null` si el cliente tiene que elegir (varias
 * variantes o venta suelta por peso).
 */
export function quickAddLine(p: Product) {
  const variants = webVariants(p);
  if (variants.length !== 1) return null;
  const v = variants[0];
  if (!inStock(v)) return null;
  const packs = packOptions(v);
  if (packs.length) {
    const pack = packs.find((s) => s <= Number(v.currentStock));
    return pack ? { productVariantId: v.id, quantity: 1, selectedBulkOption: pack, label: packLabel(pack, v.contentMeasure) } : null;
  }
  if (v.contentMeasure === 'KG' || v.contentMeasure === 'G') return null;
  return { productVariantId: v.id, quantity: 1, label: '1 u' };
}

/**
 * Oferta vigente de una variante para mostrar al elegirla: precio por kg/u con
 * la oferta aplicada a 1 unidad (si la oferta depende de la cantidad, como un
 * 3x2, el precio no cambia y solo se muestra la etiqueta).
 */
export function variantDeal(v: ProductVariant, p?: Product) {
  const offer = selectOffer(v, p);
  const list = Number(v.finalPrice ?? 0);
  if (!offer) return { offer: undefined, badge: null, list, price: list, discounted: false };
  const price = applyOffer(list, 1, offer);
  return { offer, badge: offerBadge(offer), list, price, discounted: list - price > 0.009 };
}

export const hasOffer = (p: Product) => webVariants(p).some((v) => selectOffer(v, p));
