import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { ArrowUpDown, Check, ChevronDown, FilterX, Plus, SearchX, SlidersHorizontal, X } from 'lucide-react';
import { useBrandsQuery, useCatalogSearchQuery, useCategoriesQuery, useLazyCatalogSearchQuery, useTagsQuery } from '../api/shopApi';
import type { CatalogFacets, CatalogSearchArgs, Product } from '../api/types';
import { getErrorMessage } from '../api/client';
import { BannerStrip } from '../components/BannerStrip';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ProductGrid } from '../components/ProductCard';
import { EmptyState, ErrorState } from '../components/States';
import { LOCAL_LABEL, slugify } from '../lib/shop';
import { cn, formatNumber } from '../lib/utils';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const PAGE = 12;
/** Productos que trae cada página del servidor (el botón "Ver más" va pidiendo más). */
const SERVER_PAGE = 60;

const SORTS = [
  { value: 'relevancia', label: 'Relevancia' },
  { value: 'precio-asc', label: 'Menor precio' },
  { value: 'precio-desc', label: 'Mayor precio' },
  { value: 'nombre', label: 'Nombre (A-Z)' },
  { value: 'nuevos', label: 'Más nuevos' },
];

const list = (v: string | null) => (v ? v.split(',').filter(Boolean) : []);

type FilterKey = 'categoria' | 'etiqueta' | 'marca';

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const { data: categories = [] } = useCategoriesQuery();
  const { data: tags = [] } = useTagsQuery();
  const { data: brands = [] } = useBrandsQuery();
  const [visible, setVisible] = useState(PAGE);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const q = params.get('q') ?? '';
  const selCats = list(params.get('categoria'));
  const selTags = list(params.get('etiqueta'));
  const selBrands = list(params.get('marca'));
  const onlyOffers = params.get('ofertas') === '1';
  const onlyLocal = params.get('local') === '1';
  const sort = params.get('orden') ?? 'relevancia';
  const min = params.get('min') ? Number(params.get('min')) : null;
  const max = params.get('max') ? Number(params.get('max')) : null;

  // Búsqueda, filtros, orden y primera página los resuelve el servidor.
  const argsKey = params.toString();
  const args = useMemo<CatalogSearchArgs>(
    () => ({
      q: q || undefined,
      categoria: selCats.join(',') || undefined,
      etiqueta: selTags.join(',') || undefined,
      marca: selBrands.join(',') || undefined,
      ofertas: onlyOffers ? '1' : undefined,
      local: onlyLocal ? '1' : undefined,
      min: min ?? undefined,
      max: max ?? undefined,
      orden: sort === 'relevancia' ? undefined : sort,
      page: 1,
      amountPerPage: SERVER_PAGE,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [argsKey],
  );
  const first = useCatalogSearchQuery(args);
  const { isLoading, error, refetch } = first;

  // Páginas acumuladas del servidor (cada "Ver más" trae la siguiente).
  const [acc, setAcc] = useState<{ key: string; items: Product[]; total: number; facets: CatalogFacets | null }>({
    key: '',
    items: [],
    total: 0,
    facets: null,
  });
  const [nextPage, setNextPage] = useState(2);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchPage] = useLazyCatalogSearchQuery();

  useEffect(() => {
    if (!first.data) return;
    setAcc({ key: argsKey, items: first.data.content, total: first.data.totalElements, facets: first.data.facets });
    setNextPage(2);
    setVisible(PAGE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [first.data]);

  const current = acc.key === argsKey ? acc : null;
  const items = current?.items ?? first.data?.content ?? [];
  const totalElements = current?.total ?? first.data?.totalElements ?? 0;
  const facets = current?.facets ?? first.data?.facets ?? null;

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k);
      else next.set(k, v);
    }
    setParams(next, { replace: true });
  };
  const toggle = (key: FilterKey, slug: string) => {
    const cur = key === 'categoria' ? selCats : key === 'marca' ? selBrands : selTags;
    update({ [key]: (cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]).join(',') });
  };

  // Conteos por categoría / marca sobre TODO lo vendible (los calcula el servidor).
  const [catCount, brandCount] = useMemo(() => {
    const cats = new Map(Object.entries(facets?.categories ?? {}));
    const brs = new Map(Object.entries(facets?.brands ?? {}));
    return [cats, brs] as const;
  }, [facets]);
  const localCount = facets?.local ?? 0;
  const priceCeil = facets?.priceCeil ?? 1000;

  useEffect(() => {
    setVisible(PAGE);
  }, [params]);

  const loadMore = async () => {
    if (visible < items.length) {
      setVisible((v) => v + PAGE);
      return;
    }
    setLoadingMore(true);
    try {
      const res = await fetchPage({ ...args, page: nextPage }).unwrap();
      setAcc((a) => (a.key === argsKey ? { ...a, items: [...a.items, ...res.content] } : a));
      setNextPage((p) => p + 1);
    } catch {
      // Si falla la página siguiente, el botón queda para reintentar.
    } finally {
      setLoadingMore(false);
    }
  };

  const catName = (slug: string) => categories.find((c) => slugify(c.name) === slug)?.name ?? slug;
  const tagName = (slug: string) => tags.find((t) => slugify(t.name) === slug)?.name ?? slug;
  const brandName = (slug: string) => brands.find((b) => slugify(b.name) === slug)?.name ?? slug;

  const title = q
    ? `Resultados para “${q}”`
    : selCats.length === 1
      ? catName(selCats[0])
      : selBrands.length === 1 && !selCats.length
        ? brandName(selBrands[0])
        : onlyOffers
          ? 'Ofertas'
          : onlyLocal
            ? 'Productores locales'
            : 'Todos los productos';
  useDocumentTitle(title, {
    description:
      title === 'Todos los productos'
        ? 'Catálogo de Canela en Rama: frutos secos, harinas, especias, cereales, productos sin TACC y más, por peso o en presentaciones. Envíos en el Gran Mendoza.'
        : `${title} en Canela en Rama, almacén natural en Godoy Cruz, Mendoza. Comprá online con envío en el Gran Mendoza o retiro en el local.`,
    // Las búsquedas no se indexan.
    noindex: !!q,
  });

  const chips: { label: string; remove: () => void }[] = [
    ...(q ? [{ label: `“${q}”`, remove: () => update({ q: null }) }] : []),
    ...(onlyOffers ? [{ label: 'En oferta', remove: () => update({ ofertas: null }) }] : []),
    ...(onlyLocal ? [{ label: LOCAL_LABEL, remove: () => update({ local: null }) }] : []),
    ...selCats.map((s) => ({ label: catName(s), remove: () => toggle('categoria', s) })),
    ...selTags.map((s) => ({ label: tagName(s), remove: () => toggle('etiqueta', s) })),
    ...selBrands.map((s) => ({ label: brandName(s), remove: () => toggle('marca', s) })),
    ...(min !== null || max !== null
      ? [{ label: `$${formatNumber(min ?? 0)} – $${formatNumber(max ?? priceCeil)}`, remove: () => update({ min: null, max: null }) }]
      : []),
  ];
  const clearAll = () => setParams(sort !== 'relevancia' ? { orden: sort } : {}, { replace: true });

  const filters = (
    <Filters
      tags={tags.map((t) => ({ slug: slugify(t.name), name: t.name }))}
      categories={categories.map((c) => ({ slug: slugify(c.name), name: c.name, count: catCount.get(slugify(c.name)) ?? 0 }))}
      brands={brands
        .map((b) => ({ slug: slugify(b.name), name: b.name, count: brandCount.get(slugify(b.name)) ?? 0 }))
        .filter((b) => b.count > 0 || selBrands.includes(b.slug))}
      selCats={selCats}
      selTags={selTags}
      selBrands={selBrands}
      onToggle={toggle}
      priceCeil={priceCeil}
      min={min}
      max={max}
      onPrice={(lo, hi) => update({ min: lo > 0 ? String(lo) : null, max: hi < priceCeil ? String(hi) : null })}
      onlyOffers={onlyOffers}
      onOffers={(v) => update({ ofertas: v ? '1' : null })}
      onlyLocal={onlyLocal}
      localCount={localCount}
      onLocal={(v) => update({ local: v ? '1' : null })}
    />
  );

  return (
    <div className="container-page">
      <Breadcrumbs items={[{ label: title }]} />

      <BannerStrip className="mb-6 sm:mb-8" />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
        <aside className="hidden lg:block">
          <h1 className="text-2xl font-semibold break-words text-ink-800">{title}</h1>
          <p className="mt-3 text-ink-500">{isLoading ? 'Cargando…' : `${formatNumber(totalElements)} resultados`}</p>
          <div className="mt-5 border-t border-ink-200">{filters}</div>
        </aside>

        <div className="min-w-0">
          <div className="mb-3 lg:hidden">
            <h1 className="text-2xl font-semibold break-words text-ink-800">{title}</h1>
            <p className="mt-1 text-sm text-ink-500">{isLoading ? 'Cargando…' : `${formatNumber(totalElements)} resultados`}</p>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-3">
            <button onClick={() => setFiltersOpen(true)} className="btn-secondary h-10 px-3.5 text-sm lg:hidden">
              <SlidersHorizontal className="size-4" /> Filtros {chips.length > 0 && <span className="rounded-full bg-brand-500 px-1.5 text-xs text-white">{chips.length}</span>}
            </button>
            {chips.length > 0 && (
              <button onClick={clearAll} className="btn-ghost h-10 px-2.5 text-sm text-ink-600 lg:h-8">
                <FilterX className="size-4" /> Borrar filtros
              </button>
            )}
            {chips.map((c) => (
              <span key={c.label} className="inline-flex max-w-full items-center gap-1 rounded-full bg-brand-50 py-0.5 pr-0.5 pl-3 text-sm font-medium text-brand-700 ring-1 ring-brand-200 ring-inset">
                <span className="min-w-0 truncate">{c.label}</span>
                <button onClick={c.remove} aria-label={`Quitar filtro ${c.label}`} className="flex size-7 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-brand-500 hover:text-white">
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
            <label className="ml-auto flex items-center gap-3 text-base text-ink-800 sm:text-[15px]">
              <ArrowUpDown className="size-4 text-ink-400" />
              <span className="hidden sm:inline">Ordenar por</span>
              <span className="relative">
                <select
                  value={sort}
                  onChange={(e) => update({ orden: e.target.value === 'relevancia' ? null : e.target.value })}
                  className="h-10 cursor-pointer appearance-none rounded-lg border border-ink-200 bg-white py-1 pr-9 pl-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)] hover:border-ink-300 focus:border-brand-500 focus:outline-none"
                >
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
              </span>
            </label>
          </div>

          {error ? (
            <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
          ) : !isLoading && totalElements === 0 ? (
            <EmptyState
              icon={<SearchX className="size-7" />}
              title="No encontramos productos"
              action={
                <button onClick={clearAll} className="btn-outline px-5 py-2">
                  Borrar filtros
                </button>
              }
            >
              Probá con otra búsqueda o quitá algunos filtros.
            </EmptyState>
          ) : (
            <>
              <ProductGrid products={items.slice(0, visible)} loading={isLoading} count={9} className="md:grid-cols-3 lg:grid-cols-3" />
              {(visible < items.length || items.length < totalElements) && (
                <div className="mt-10 flex flex-col items-center gap-2">
                  <button onClick={loadMore} disabled={loadingMore} className="btn-outline h-11 rounded-full px-8 disabled:opacity-60">
                    <Plus className="size-4" /> {loadingMore ? 'Cargando…' : 'Ver más productos'}
                  </button>
                  <span className="text-xs text-ink-400">
                    Mostrando {Math.min(visible, items.length)} de {formatNumber(totalElements)}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filtros">
          <div className="absolute inset-0 bg-ink-900/40" onClick={() => setFiltersOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-white animate-fade-in">
            <div className="flex items-center justify-between border-b border-ink-100 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
              <p className="text-lg font-semibold">Filtros</p>
              <button onClick={() => setFiltersOpen(false)} aria-label="Cerrar filtros" className="btn-icon">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-5">{filters}</div>
            <div className="border-t border-ink-100 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                onClick={() => {
                  setFiltersOpen(false);
                  window.scrollTo({ top: 0 });
                }}
                className="btn-primary h-12 w-full"
              >
                Ver {totalElements} resultados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Filtros

interface FiltersProps {
  tags: { slug: string; name: string }[];
  categories: { slug: string; name: string; count: number }[];
  brands: { slug: string; name: string; count: number }[];
  selCats: string[];
  selTags: string[];
  selBrands: string[];
  onToggle: (key: FilterKey, slug: string) => void;
  priceCeil: number;
  min: number | null;
  max: number | null;
  onPrice: (lo: number, hi: number) => void;
  onlyOffers: boolean;
  onOffers: (v: boolean) => void;
  onlyLocal: boolean;
  localCount: number;
  onLocal: (v: boolean) => void;
}

function Filters(p: FiltersProps) {
  return (
    <div className="divide-y divide-ink-200">
      <Group title="Etiquetas">
        <ul className="space-y-1">
          <li>
            <FilterRow checked={p.onlyOffers} onChange={() => p.onOffers(!p.onlyOffers)} label="En oferta" />
          </li>
          {(p.localCount > 0 || p.onlyLocal) && (
            <li>
              <FilterRow checked={p.onlyLocal} onChange={() => p.onLocal(!p.onlyLocal)} label={LOCAL_LABEL} count={p.localCount} />
            </li>
          )}
          {p.tags.map((t) => (
            <li key={t.slug}>
              <FilterRow checked={p.selTags.includes(t.slug)} onChange={() => p.onToggle('etiqueta', t.slug)} label={t.name} />
            </li>
          ))}
        </ul>
      </Group>

      <Group title="Precio">
        <PriceRange ceil={p.priceCeil} min={p.min ?? 0} max={p.max ?? p.priceCeil} onCommit={p.onPrice} />
      </Group>

      <Group title="Categorías">
        <ul className="space-y-1">
          {p.categories.map((c) => (
            <li key={c.slug}>
              <FilterRow checked={p.selCats.includes(c.slug)} onChange={() => p.onToggle('categoria', c.slug)} label={c.name} count={c.count} />
            </li>
          ))}
        </ul>
      </Group>

      {p.brands.length > 0 && (
        <Group title="Marcas">
          <ul className="space-y-1">
            {p.brands.map((b) => (
              <li key={b.slug}>
                <FilterRow checked={p.selBrands.includes(b.slug)} onChange={() => p.onToggle('marca', b.slug)} label={b.name} count={b.count} />
              </li>
            ))}
          </ul>
        </Group>
      )}
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="py-5">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex min-h-10 w-full items-center justify-between text-left text-[17px] font-medium text-ink-800 lg:min-h-0">
        {title}
        <ChevronDown className={cn('size-5 transition-transform', !open && '-rotate-90')} />
      </button>
      {open && <div className="mt-4">{children}</div>}
    </section>
  );
}

function FilterRow({ checked, onChange, label, count }: { checked: boolean; onChange: () => void; label: string; count?: number }) {
  return (
    <label className="group flex cursor-pointer items-center gap-3 py-2 text-[15px] text-ink-700 lg:py-1">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        className={cn(
          'flex size-[18px] shrink-0 items-center justify-center rounded border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500/40',
          checked ? 'border-brand-500 bg-brand-500 text-white' : 'border-ink-400 group-hover:border-brand-400',
        )}
      >
        {checked && <Check className="size-3.5" strokeWidth={3} />}
      </span>
      <span className={cn('min-w-0 flex-1 break-words', checked && 'font-medium text-ink-800')}>{label}</span>
      {count !== undefined && <span className="text-ink-400">({count})</span>}
    </label>
  );
}

function PriceRange({ ceil, min, max, onCommit }: { ceil: number; min: number; max: number; onCommit: (lo: number, hi: number) => void }) {
  const [lo, setLo] = useState(min);
  const [hi, setHi] = useState(max);
  useEffect(() => {
    setLo(min);
    setHi(max);
  }, [min, max]);

  const step = ceil > 20000 ? 500 : 100;
  const commit = (a = lo, b = hi) => {
    const x = Math.max(0, Math.min(a, b));
    const y = Math.min(ceil, Math.max(a, b));
    if (x !== min || y !== max) onCommit(x, y);
  };
  const pct = (v: number) => (Math.min(ceil, Math.max(0, v)) / ceil) * 100;

  return (
    <div>
      <div className="relative h-5">
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-ink-200" />
        <div className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-brand-500" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
        <input
          type="range"
          aria-label="Precio mínimo"
          min={0}
          max={ceil}
          step={step}
          value={lo}
          onChange={(e) => setLo(Math.min(Number(e.target.value), hi))}
          onPointerUp={() => commit()}
          onKeyUp={() => commit()}
          className="range-thumb absolute inset-0 w-full"
        />
        <input
          type="range"
          aria-label="Precio máximo"
          min={0}
          max={ceil}
          step={step}
          value={hi}
          onChange={(e) => setHi(Math.max(Number(e.target.value), lo))}
          onPointerUp={() => commit()}
          onKeyUp={() => commit()}
          className="range-thumb absolute inset-0 w-full"
        />
      </div>
      <form
        className="mt-4 flex items-center gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          commit();
        }}
      >
        <MoneyInput label="Desde" value={lo} onChange={setLo} onBlur={() => commit()} />
        <span className="text-ink-600">hasta</span>
        <MoneyInput label="Hasta" value={hi} onChange={setHi} onBlur={() => commit()} />
        <button type="submit" className="sr-only">
          Aplicar
        </button>
      </form>
    </div>
  );
}

function MoneyInput({ label, value, onChange, onBlur }: { label: string; value: number; onChange: (v: number) => void; onBlur: () => void }) {
  return (
    <label className="flex h-10 min-w-0 flex-1 items-center gap-1 rounded-md border border-ink-300 px-3 focus-within:border-brand-500">
      <span className="text-ink-700">$</span>
      <span className="sr-only">{label}</span>
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, '')) || 0)}
        onBlur={onBlur}
        className="w-full min-w-0 bg-transparent text-right tabular-nums focus:outline-none"
      />
    </label>
  );
}
