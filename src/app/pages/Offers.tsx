import { useMemo } from 'react';
import { Link } from 'react-router';
import { BadgePercent, Gift, Layers, Percent, ShoppingBag, Tag } from 'lucide-react';
import { useCatalogQuery } from '../api/shopApi';
import type { DiscountType, Product } from '../api/types';
import { getErrorMessage } from '../api/client';
import { BannerStrip } from '../components/BannerStrip';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ProductGrid } from '../components/ProductCard';
import { EmptyState, ErrorState } from '../components/States';
import { SectionHeader } from '../components/SectionHeader';
import { cardPrice, selectOffer, webVariants } from '../lib/shop';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/** Grupos de ofertas según el tipo de descuento del backend (`Offer.discountType`). */
const GROUPS: { key: string; title: string; text: string; icon: typeof Percent; types: DiscountType[] }[] = [
  {
    key: 'descuentos',
    title: 'Descuentos directos',
    text: 'Precio rebajado, sin mínimo de compra.',
    icon: Percent,
    types: ['PERCENTAGE', 'FIXED'],
  },
  {
    key: 'llevando-mas',
    title: 'Llevando más, pagás menos',
    text: 'Descuento al superar una cantidad.',
    icon: Layers,
    types: ['BUY_MORE_GET_DISCOUNT', 'BUY_MORE_GET_FIXED_DISCOUNT'],
  },
  {
    key: 'promos',
    title: 'Promos 2x1, 3x2 y más',
    text: 'Llevás más unidades y pagás menos.',
    icon: Gift,
    types: ['BUY_ONE_GET_MORE', 'BUY_MORE_GET_MORE'],
  },
];

function offerType(p: Product): DiscountType | undefined {
  for (const v of webVariants(p)) {
    const o = selectOffer(v, p);
    if (o) return o.discountType;
  }
  return undefined;
}

/** Ahorro relativo de la tarjeta, para ordenar. */
const savingRatio = (p: Product) => {
  const info = cardPrice(p);
  return info && info.list > 0 ? (info.list - info.price) / info.list : 0;
};

export default function Offers() {
  useDocumentTitle('Ofertas', {
    description: 'Ofertas y promociones de Canela en Rama: descuentos y promos por cantidad en frutos secos, especias, harinas y más. Envíos en el Gran Mendoza.',
  });
  const { data: catalog, isLoading, error, refetch } = useCatalogQuery();

  const groups = useMemo(() => {
    const withOffer = (catalog ?? []).filter((p) => cardPrice(p) && offerType(p));
    return GROUPS.map((g) => ({
      ...g,
      products: withOffer.filter((p) => g.types.includes(offerType(p)!)).sort((a, b) => savingRatio(b) - savingRatio(a)),
    })).filter((g) => g.products.length);
  }, [catalog]);
  const total = groups.reduce((n, g) => n + g.products.length, 0);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-[#eef6e0] via-[#f7fbef] to-brand-50">
        <div className="container-page relative py-10 sm:py-14">
          <Breadcrumbs items={[{ label: 'Ofertas' }]} className="py-0 pb-4" />
          <p className="inline-flex items-center gap-2 rounded-full bg-leaf-500 px-3 py-1 text-sm font-semibold text-white shadow-sm">
            <BadgePercent className="size-4" /> Ofertas de la semana
          </p>
          <h1 className="mt-4 max-w-2xl text-3xl leading-tight font-semibold tracking-tight text-ink-800 sm:text-5xl">
            Precios especiales en tus básicos naturales
          </h1>
          <p className="mt-4 max-w-xl text-ink-600 sm:text-lg">
            Los descuentos se aplican solos en el carrito. Sin cupones, sin vueltas.
          </p>
          {groups.length > 1 && (
            <nav aria-label="Tipos de oferta" className="mt-7 flex flex-wrap gap-2">
              {groups.map((g) => (
                <a
                  key={g.key}
                  href={`#${g.key}`}
                  className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 shadow-sm transition-colors hover:border-leaf-500 hover:text-leaf-600"
                >
                  <g.icon className="size-4 text-leaf-600" /> {g.title}
                  <span className="rounded-full bg-ink-100 px-1.5 text-xs text-ink-500">{g.products.length}</span>
                </a>
              ))}
            </nav>
          )}
          <Tag className="pointer-events-none absolute top-1/2 right-[4%] hidden size-72 -translate-y-1/2 rotate-12 text-leaf-500/10 md:block" strokeWidth={1} aria-hidden />
        </div>
      </section>

      <div className="container-page space-y-14 py-10 sm:py-12">
        <BannerStrip className="-mb-4" />
        {error ? (
          <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
        ) : isLoading ? (
          <ProductGrid loading count={8} />
        ) : total === 0 ? (
          <EmptyState
            icon={<BadgePercent className="size-7" />}
            title="Esta semana no hay ofertas activas"
            action={
              <Link to="/productos" className="btn-primary h-12 px-7">
                <ShoppingBag className="size-4" /> Ver todos los productos
              </Link>
            }
          >
            Volvé pronto: renovamos las promos todas las semanas.
          </EmptyState>
        ) : (
          groups.map((g) => (
            <section key={g.key} id={g.key} className="scroll-mt-40" aria-label={g.title}>
              <SectionHeader title={g.title} subtitle={g.text} icon={<g.icon className="size-4" />} />
              <ProductGrid products={g.products} />
            </section>
          ))
        )}
      </div>
    </>
  );
}
