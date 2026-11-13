import { Check, Gift, PackageCheck, Scale, Sparkles } from 'lucide-react';
import type { Product, ProductVariant } from '../api/types';
import {
  LOOSE_WEIGHTS,
  inStock,
  offerDescription,
  offerProgress,
  packLabel,
  perUnitPrice,
  priceUnitLabel,
  quote,
  stockUnit,
} from '../lib/shop';
import { cn, formatCurrency, formatNumber } from '../lib/utils';
import { QtyStepper } from './QtyStepper';

/**
 * Selectores de compra del detalle, según lo que admite el backend:
 *
 *   - Variedades (`variants` con `availableWeb`).
 *   - Con `packagingOptions`: se elige el paquete (g/u) y la cantidad de paquetes
 *     (`selectedBulkOption` + `quantity`).
 *   - Sin presentaciones y por peso (KG/G): venta suelta en gramos (`quantity` = g).
 *   - Sin presentaciones por unidad: `quantity` = unidades.
 */

// ---------------------------------------------------------------- Variedades

export function VariantPicker({
  variants,
  value,
  onChange,
}: {
  variants: ProductVariant[];
  value: ProductVariant;
  onChange: (v: ProductVariant) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-3 flex items-baseline gap-2 text-[15px] font-semibold text-ink-800">
        Variedad <span className="font-normal text-ink-500">· {value.name}</span>
      </legend>
      <div role="radiogroup" aria-label="Variedad" className="flex flex-wrap gap-2">
        {variants.map((v) => {
          const selected = v.id === value.id;
          const available = inStock(v);
          return (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(v)}
              className={cn(
                'relative flex min-w-[120px] flex-col items-start rounded-xl border px-4 py-2.5 text-left transition-all active:scale-[0.98]',
                selected
                  ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                  : 'border-ink-200 bg-white hover:border-ink-400',
              )}
            >
              <span className={cn('text-[15px] font-medium', selected ? 'text-brand-700' : 'text-ink-800', !available && 'text-ink-400')}>{v.name}</span>
              <span className="text-xs text-ink-500">
                {available ? `${formatCurrency(v.finalPrice)} / ${priceUnitLabel(v.contentMeasure)}` : 'Sin stock'}
              </span>
              {selected && (
                <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-brand-500 text-white">
                  <Check className="size-3" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

// ---------------------------------------------------------------- Presentaciones

export function PackPicker({
  product,
  variant,
  packs,
  value,
  onChange,
}: {
  product: Product;
  variant: ProductVariant;
  packs: number[];
  value: number | null;
  onChange: (p: number) => void;
}) {
  const stock = Number(variant.currentStock) || 0;
  const m = variant.contentMeasure;
  const weight = m === 'KG' || m === 'G';
  const rows = packs.map((size) => {
    const q = quote(variant, size, 1, product);
    return { size, q, per: perUnitPrice(variant, size, product), available: size <= stock };
  });
  // "Mejor precio" solo si una presentación sale de verdad más barata por kg / u.
  const avail = rows.filter((r) => r.available);
  const minPer = Math.min(...avail.map((r) => r.per));
  const maxPer = Math.max(...avail.map((r) => r.per));
  const best = avail.length > 1 && maxPer - minPer > maxPer * 0.005 ? avail.find((r) => r.per === minPer)?.size : undefined;

  return (
    <fieldset>
      <legend className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-ink-800">
        {weight ? <Scale className="size-4 text-brand-500" /> : <PackageCheck className="size-4 text-brand-500" />}
        {weight ? 'Elegí el peso' : 'Elegí la presentación'}
      </legend>
      <div role="radiogroup" aria-label={weight ? 'Peso' : 'Presentación'} className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {rows.map(({ size, q, per, available }) => {
          const selected = value === size;
          const discounted = q.list - q.total > 0.009;
          return (
            <button
              key={size}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={!available}
              onClick={() => onChange(size)}
              className={cn(
                'group relative flex flex-col rounded-xl border p-3 text-left transition-all active:scale-[0.98] disabled:cursor-not-allowed',
                selected ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-ink-200 bg-white hover:border-ink-400 hover:shadow-card',
                !available && 'bg-ink-50 opacity-60 hover:border-ink-200 hover:shadow-none',
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className={cn('text-lg font-semibold', selected ? 'text-brand-700' : 'text-ink-800', !available && 'line-through')}>
                  {packLabel(size, m)}
                </span>
                <span
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                    selected ? 'border-brand-500 bg-brand-500 text-white' : 'border-ink-300 bg-white group-hover:border-ink-400',
                  )}
                  aria-hidden
                >
                  {selected && <Check className="size-3" strokeWidth={3} />}
                </span>
              </span>
              <span className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5">
                <span className="font-semibold text-ink-800 tabular-nums">{formatCurrency(q.total)}</span>
                {discounted && <span className="text-xs text-ink-400 line-through">{formatCurrency(q.list)}</span>}
              </span>
              <span className="text-xs text-ink-500 tabular-nums">
                {available ? `${formatCurrency(per)} / ${priceUnitLabel(m)}` : 'Sin stock'}
              </span>
              {best === size && (
                <span className="absolute -top-2.5 left-3 inline-flex items-center gap-1 rounded-full bg-leaf-500 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                  <Sparkles className="size-3" /> Más conveniente
                </span>
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

// ---------------------------------------------------------------- Venta suelta por peso

export function WeightPicker({
  product,
  variant,
  grams,
  onChange,
  step,
  min,
}: {
  product: Product;
  variant: ProductVariant;
  grams: number;
  onChange: (g: number) => void;
  step: number;
  min: number;
}) {
  const stock = Number(variant.currentStock) || 0;
  const presets = LOOSE_WEIGHTS.filter((g) => g <= stock);
  const custom = !presets.includes(grams);
  return (
    <fieldset>
      <legend className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-ink-800">
        <Scale className="size-4 text-brand-500" /> ¿Cuánto llevás?
        <span className="font-normal text-ink-500">· lo fraccionamos en el momento</span>
      </legend>
      <div role="radiogroup" aria-label="Peso" className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {presets.map((g) => {
          const selected = grams === g;
          return (
            <button
              key={g}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(g)}
              className={cn(
                'flex flex-col items-center rounded-xl border px-2 py-2.5 transition-all active:scale-[0.97]',
                selected ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-ink-200 bg-white hover:border-ink-400 hover:shadow-card',
              )}
            >
              <span className={cn('font-semibold', selected ? 'text-brand-700' : 'text-ink-800')}>{packLabel(g, variant.contentMeasure)}</span>
              <span className="text-xs text-ink-500 tabular-nums">{formatCurrency(quote(variant, null, g, product).total)}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className={cn('text-sm', custom ? 'font-medium text-brand-600' : 'text-ink-500')}>Otro peso:</span>
        <QtyStepper value={grams} onChange={onChange} min={min} step={step} max={Math.max(min, stock)} unit="g" label="Peso en gramos" />
        <span className="text-xs text-ink-400">de a {step} g · máx. {packLabel(stock, variant.contentMeasure)}</span>
      </div>
    </fieldset>
  );
}

// ---------------------------------------------------------------- Ofertas por cantidad

export function OfferProgress({ product, variant, stockUnits }: { product: Product; variant: ProductVariant; stockUnits: number }) {
  const p = offerProgress(variant, stockUnits, product);
  if (!p) return null;
  const m = variant.contentMeasure;
  const amount = (units: number) => (m === 'KG' || m === 'G' ? packLabel(units, m) : `${formatNumber(units)} ${stockUnit(m)}`);
  return (
    <div className={cn('rounded-xl border p-3.5 text-sm', p.reached ? 'border-leaf-500/40 bg-[#f4f9ea]' : 'border-amber-200 bg-amber-50/60')}>
      <p className="flex items-start gap-2.5">
        <Gift className={cn('mt-0.5 size-4 shrink-0', p.reached ? 'text-leaf-600' : 'text-amber-600')} />
        <span className="text-ink-700">
          <strong className="font-semibold text-ink-800">{offerDescription(p.offer, m)}.</strong>{' '}
          {p.reached ? '¡Ya la estás aprovechando!' : `Te faltan ${amount(p.missing)} para activarla.`}
        </span>
      </p>
      {!p.reached && (
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-amber-100" aria-hidden>
          <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${Math.max(4, p.ratio * 100)}%` }} />
        </div>
      )}
    </div>
  );
}
