import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';
import { BadgePercent, Check, Clock, ImageOff, PackageCheck, PackageX, Share2, ShoppingCart, Store, Tag as TagIcon, Truck } from 'lucide-react';
import { useAddToCartMutation, useCatalogQuery, useProductQuery } from '../api/shopApi';
import type { Product, ProductVariant } from '../api/types';
import { getErrorMessage } from '../api/client';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { FavoriteButton } from '../components/FavoriteButton';
import { ProductGrid } from '../components/ProductCard';
import { OfferProgress, PackPicker, VariantPicker, WeightPicker } from '../components/PurchaseOptions';
import { QtyStepper } from '../components/QtyStepper';
import { RecentlyViewed } from '../components/RecentlyViewed';
import { EmptyState, ErrorState, Spinner } from '../components/States';
import { SectionHeader } from '../components/SectionHeader';
import { useAppDispatch } from '../store';
import { setDrawerOpen } from '../store/cartSlice';
import { markViewed } from '../store/prefsSlice';
import { whatsappLink } from '../lib/contact';
import {
  cardPrice,
  inStock,
  offerDescription,
  packLabel,
  packOptions,
  priceUnitLabel,
  productImages,
  quote,
  selectOffer,
  slugify,
  webVariants,
} from '../lib/shop';
import { cn, formatCurrency } from '../lib/utils';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/** Venta suelta por peso: mínimo y paso en gramos. */
const LOOSE_MIN_G = 100;
const LOOSE_STEP_G = 50;

export default function ProductDetail() {
  const id = Number(useParams().id);
  const { data: product, isLoading, error, refetch } = useProductQuery(id, { skip: !Number.isFinite(id) });
  useDocumentTitle(product?.name);

  if (isLoading) return <DetailSkeleton />;
  if (error || !product || !product.id) {
    const notFound = (error as { status?: number } | undefined)?.status === 404 || (!error && !product?.id);
    return (
      <div className="container-page">
        {notFound ? (
          <EmptyState
            icon={<ImageOff className="size-7" />}
            title="Este producto no existe o ya no está disponible"
            action={
              <Link to="/productos" className="btn-primary px-6 py-2.5">
                Ver productos
              </Link>
            }
          />
        ) : (
          <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
        )}
      </div>
    );
  }
  return <ProductView key={product.id} product={product} />;
}

function ProductView({ product }: { product: Product }) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(markViewed(product.id));
  }, [dispatch, product.id]);

  const variants = useMemo(() => webVariants(product), [product]);
  const [variant, setVariant] = useState<ProductVariant | undefined>(() => variants.find(inStock) ?? variants[0]);

  const stock = Number(variant?.currentStock ?? 0);
  const packs = variant ? packOptions(variant) : [];
  const loose = !packs.length;
  const isWeight = variant?.contentMeasure === 'KG' || variant?.contentMeasure === 'G';
  const firstPack = (v?: ProductVariant) => {
    const p = v ? packOptions(v) : [];
    return p.find((s) => s <= Number(v?.currentStock ?? 0)) ?? p[0] ?? null;
  };
  const defaultLoose = (v?: ProductVariant) =>
    v?.contentMeasure === 'KG' || v?.contentMeasure === 'G' ? Math.min(250, Math.max(LOOSE_MIN_G, Number(v.currentStock) || 0)) : 1;

  const [pack, setPack] = useState<number | null>(() => firstPack(variant));
  // Con presentación: cantidad de paquetes. Suelto: gramos o unidades.
  const [qty, setQty] = useState(() => (loose ? defaultLoose(variant) : 1));

  const chooseVariant = (v: ProductVariant) => {
    setVariant(v);
    const p = firstPack(v);
    setPack((cur) => (cur && packOptions(v).includes(cur) && cur <= Number(v.currentStock) ? cur : p));
    setQty(packOptions(v).length ? 1 : defaultLoose(v));
  };

  const maxQty = loose ? stock : pack ? Math.floor(stock / pack) : 0;
  const choosePack = (p: number) => {
    setPack(p);
    setQty((n) => Math.max(1, Math.min(n, Math.floor(stock / p))));
  };

  const [addToCart, { isLoading: adding }] = useAddToCartMutation();
  const [added, setAdded] = useState(false);

  const images = useMemo(() => productImages(product, variant), [product, variant]);
  const offer = variant ? selectOffer(variant, product) : undefined;
  const available = !!variant && inStock(variant) && maxQty > 0;
  const q = variant ? quote(variant, loose ? null : pack, qty, product) : null;
  const saving = q ? q.list - q.total : 0;

  const add = async () => {
    if (!variant) return;
    try {
      await addToCart([{ productVariantId: variant.id, quantity: qty, ...(pack && !loose ? { selectedBulkOption: pack } : {}) }]).unwrap();
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1800);
      dispatch(setDrawerOpen(true));
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const category = product.Category;
  const amountLabel = !variant
    ? ''
    : loose
      ? isWeight
        ? packLabel(qty, variant.contentMeasure)
        : `${qty} u`
      : `${qty} × ${packLabel(pack ?? 0, variant.contentMeasure)}${qty > 1 && isWeight ? ` (${packLabel(qty * (pack ?? 0), variant.contentMeasure)})` : ''}`;

  return (
    <>
      <div className="container-page">
        <Breadcrumbs
          items={[
            { label: 'Productos', to: '/productos' },
            ...(category ? [{ label: category.name, to: `/productos?categoria=${slugify(category.name)}` }] : []),
            { label: product.name },
          ]}
        />

        <div className="grid gap-8 lg:grid-cols-[minmax(0,540px)_1fr] lg:gap-14">
          <div className="lg:sticky lg:top-36 lg:self-start">
            <Gallery images={images} name={product.name} badge={offer ? offerDescription(offer, variant?.contentMeasure) : null} />
          </div>

          <div className="min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                {product.Brand?.name && (
                  <Link
                    to={`/productos?marca=${slugify(product.Brand.name)}`}
                    className="text-xs font-semibold tracking-wider text-brand-500 uppercase hover:underline"
                  >
                    {product.Brand.name}
                  </Link>
                )}
                <h1 className="mt-1 text-3xl font-medium tracking-tight text-ink-800 sm:text-[40px] sm:leading-tight">{product.name}</h1>
              </div>
              <div className="flex shrink-0 items-center gap-1 pt-1">
                <ShareButton name={product.name} />
                <FavoriteButton productId={product.id} name={product.name} className="border border-ink-200 hover:border-brand-200 hover:bg-brand-50" />
              </div>
            </div>

            {!!product.Tags?.length && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {product.Tags.map((t) => (
                  <li key={t.id}>
                    <Link
                      to={`/productos?etiqueta=${slugify(t.name)}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-3 py-1 text-sm text-ink-700 transition-colors hover:bg-brand-100 hover:text-brand-600"
                    >
                      <TagIcon className="size-3.5" /> {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {variant && (
              <p className="mt-5 flex flex-wrap items-baseline gap-x-2 text-ink-500">
                <span className="text-2xl font-bold text-ink-800 tabular-nums">{formatCurrency(variant.finalPrice)}</span>
                <span>/ {priceUnitLabel(variant.contentMeasure)}</span>
                {offer && (
                  <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-leaf-500/15 px-2.5 py-0.5 text-sm font-medium text-leaf-600">
                    <BadgePercent className="size-4" /> {offerDescription(offer, variant.contentMeasure)}
                  </span>
                )}
              </p>
            )}

            {product.description && <p className="mt-4 leading-relaxed text-ink-600">{product.description}</p>}

            {!variant ? (
              <div className="mt-8 rounded-xl bg-ink-50 p-5 text-ink-600">Este producto no está disponible para la venta online por el momento.</div>
            ) : (
              <div className="mt-7 space-y-6 rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-6">
                {variants.length > 1 && <VariantPicker variants={variants} value={variant} onChange={chooseVariant} />}

                {!loose ? (
                  <PackPicker product={product} variant={variant} packs={packs} value={pack} onChange={choosePack} />
                ) : isWeight ? (
                  <WeightPicker product={product} variant={variant} grams={qty} onChange={setQty} step={LOOSE_STEP_G} min={LOOSE_MIN_G} />
                ) : null}

                {(!loose || !isWeight) && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="text-[15px] font-semibold text-ink-800">{loose ? 'Cantidad' : 'Cantidad de paquetes'}</span>
                    <QtyStepper value={qty} onChange={setQty} min={1} max={Math.max(1, maxQty)} disabled={!available} />
                    {available && maxQty <= 5 && <span className="text-xs text-amber-600">Quedan {maxQty} disponibles</span>}
                  </div>
                )}

                <OfferProgress product={product} variant={variant} stockUnits={q?.stockUnits ?? 0} />

                <div className="flex flex-col gap-4 border-t border-ink-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-ink-500">
                      Total · <span className="text-ink-700">{amountLabel}</span>
                    </p>
                    <p className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-3xl font-bold text-ink-800 tabular-nums">{formatCurrency(q?.total)}</span>
                      {saving > 0.009 && (
                        <>
                          <span className="text-ink-400 line-through tabular-nums">{formatCurrency(q?.list)}</span>
                          <span className="text-sm font-medium text-leaf-600">Ahorrás {formatCurrency(saving)}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={add}
                    disabled={!available || adding}
                    className={cn('btn-primary h-13 shrink-0 rounded-xl px-8 text-[17px]', added && 'bg-leaf-500 hover:bg-leaf-600')}
                  >
                    {adding ? <Spinner /> : added ? <Check className="size-5" strokeWidth={3} /> : <ShoppingCart className="size-5" />}
                    {!available ? 'Sin stock' : added ? '¡Agregado!' : 'Agregar al carrito'}
                  </button>
                </div>
              </div>
            )}

            {variant && (
              <ul className="mt-5 grid gap-3 text-sm text-ink-600 sm:grid-cols-2">
                <InfoItem icon={available ? <PackageCheck className="size-4 text-leaf-600" /> : <PackageX className="size-4 text-ink-400" />}>
                  {available ? (
                    <>
                      <strong className="font-medium text-ink-800">En stock</strong>
                      {stock <= Math.max(variant.stockThreshold, 0) && <span className="text-amber-600"> · ¡Quedan pocas!</span>}
                    </>
                  ) : (
                    <>
                      Sin stock por ahora.{' '}
                      <a
                        href={whatsappLink(`Hola! Quería consultar por ${product.name} (${variant.name})`)}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-brand-500 hover:underline"
                      >
                        Avisame
                      </a>
                    </>
                  )}
                </InfoItem>
                <InfoItem icon={<Clock className="size-4 text-brand-500" />}>
                  {Number(variant.requestTime) > 0
                    ? `Por encargo: listo en ${variant.requestTime} día${Number(variant.requestTime) > 1 ? 's' : ''}`
                    : 'Preparamos tu pedido en el día'}
                </InfoItem>
                <InfoItem icon={<Truck className="size-4 text-brand-500" />}>
                  Envíos en el Gran Mendoza ·{' '}
                  <Link to="/envios" className="font-medium text-brand-500 hover:underline">
                    Ver zonas
                  </Link>
                </InfoItem>
                <InfoItem icon={<Store className="size-4 text-brand-500" />}>Retiro sin cargo en Godoy Cruz</InfoItem>
              </ul>
            )}
          </div>
        </div>
      </div>

      <Related product={product} />
      <RecentlyViewed exclude={product.id} />
    </>
  );
}

function InfoItem({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 rounded-xl bg-ink-50 px-3.5 py-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">{icon}</span>
      <span>{children}</span>
    </li>
  );
}

function ShareButton({ name }: { name: string }) {
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: name, text: `Mirá ${name} en Canela en Rama`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado');
    } catch {
      /* el usuario canceló */
    }
  };
  return (
    <button type="button" onClick={share} aria-label="Compartir" title="Compartir" className="btn-icon size-11 border border-ink-200">
      <Share2 className="size-5" />
    </button>
  );
}

// ---------------------------------------------------------------- Galería

function Gallery({ images, name, badge }: { images: string[]; name: string; badge: string | null }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    setI(0);
  }, [images]);
  const current = images[i];
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:gap-5">
      {images.length > 1 && (
        <div className="no-scrollbar flex gap-3 overflow-x-auto sm:w-[90px] sm:shrink-0 sm:flex-col">
          {images.map((src, idx) => (
            <button
              key={src}
              onClick={() => setI(idx)}
              aria-label={`Ver imagen ${idx + 1}`}
              aria-current={idx === i}
              className={cn('size-[72px] shrink-0 overflow-hidden rounded-md ring-offset-2 transition sm:size-[90px]', idx === i ? 'ring-2 ring-brand-500' : 'opacity-70 hover:opacity-100')}
            >
              <img src={src} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-ink-100">
        {current ? (
          <img src={current} alt={name} className="size-full object-cover animate-fade-in" key={current} />
        ) : (
          <div className="flex size-full items-center justify-center text-ink-300">
            <ImageOff className="size-16" strokeWidth={1} />
          </div>
        )}
        {badge && <span className="absolute top-3 left-3 rounded-md bg-leaf-500 px-2.5 py-1 text-sm font-bold text-white shadow">{badge}</span>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Relacionados

function Related({ product }: { product: Product }) {
  const { data: catalog, isLoading } = useCatalogQuery();
  const related = useMemo(() => {
    const pool = (catalog ?? []).filter((p) => p.id !== product.id && cardPrice(p));
    const tagIds = new Set((product.Tags ?? []).map((t) => t.id));
    const score = (p: Product) =>
      (p.categoryId === product.categoryId ? 3 : 0) + (p.Tags ?? []).filter((t) => tagIds.has(t.id)).length + (productImages(p).length ? 0.5 : 0);
    return pool
      .map((p) => ({ p, s: score(p) }))
      .filter((x) => x.s >= 1)
      .sort((a, b) => b.s - a.s)
      .slice(0, 4)
      .map((x) => x.p);
  }, [catalog, product]);

  if (!isLoading && related.length === 0) return null;
  return (
    <section className="container-page mt-16" aria-labelledby="related">
      <SectionHeader title="Productos relacionados" />
      <ProductGrid products={related} loading={isLoading} count={4} />
    </section>
  );
}

function DetailSkeleton() {
  return (
    <div className="container-page" aria-busy>
      <div className="skeleton my-6 h-5 w-64" />
      <div className="grid gap-10 lg:grid-cols-[560px_1fr]">
        <div className="skeleton aspect-square" />
        <div className="space-y-5">
          <div className="skeleton h-10 w-3/4" />
          <div className="skeleton h-16 w-full" />
          <div className="skeleton h-12 w-2/3" />
          <div className="skeleton h-12 w-1/2" />
          <div className="skeleton h-24 w-full" />
        </div>
      </div>
    </div>
  );
}
