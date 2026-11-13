import { useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { Check, ChevronRight, ImageOff, ShoppingCart } from 'lucide-react';
import type { Product } from '../api/types';
import { useAddToCartMutation } from '../api/shopApi';
import { getErrorMessage } from '../api/client';
import { useAppDispatch } from '../store';
import { setDrawerOpen } from '../store/cartSlice';
import { cardPrice, productImages, quickAddLine } from '../lib/shop';
import { cn, formatCurrency } from '../lib/utils';
import { FavoriteButton } from './FavoriteButton';
import { Spinner } from './States';

export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const info = cardPrice(product);
  const image = productImages(product, info?.variant)[0];
  const to = `/producto/${product.id}`;
  const discounted = info && info.list - info.price > 0.009;

  return (
    <article
      className={cn(
        'group relative flex flex-col rounded-2xl border border-ink-200 bg-white p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-lift sm:p-3',
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-ink-50">
        {image ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-ink-300">
            <ImageOff className="size-10" strokeWidth={1.25} />
          </div>
        )}
        {info?.badge && (
          <span className="absolute top-2 left-2 rounded-full bg-leaf-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">{info.badge}</span>
        )}
        {info && !info.hasStock && (
          <span className="absolute inset-x-0 bottom-0 bg-ink-800/75 py-1 text-center text-xs font-medium tracking-wide text-white uppercase">
            Sin stock
          </span>
        )}
      </div>

      {/* El favorito queda por encima del link que cubre toda la tarjeta. */}
      <FavoriteButton
        productId={product.id}
        name={product.name}
        size="sm"
        className="absolute top-4 right-4 z-10 bg-white/90 shadow-sm backdrop-blur hover:bg-white sm:top-5 sm:right-5"
      />

      <div className="flex flex-1 flex-col px-1 pt-3">
        {product.Brand?.name && <p className="truncate text-[11px] font-medium tracking-wider text-ink-400 uppercase">{product.Brand.name}</p>}
        <h3 className="line-clamp-2 min-h-[2.6em] text-[15px] leading-snug text-ink-800">
          <Link to={to} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none">
            {product.name}
          </Link>
        </h3>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          {info ? (
            <p className="flex min-w-0 flex-col leading-tight">
              {discounted && <span className="text-xs text-ink-400 line-through">{formatCurrency(info.list)}</span>}
              <span className="truncate">
                <span className="font-bold text-ink-800">{formatCurrency(info.price)}</span>
                <span className="text-xs text-ink-500"> x {info.unitLabel}</span>
              </span>
            </p>
          ) : (
            <span className="text-sm text-ink-400">Consultar</span>
          )}
          <CardAction product={product} to={to} />
        </div>
      </div>
    </article>
  );
}

/**
 * Botón de la tarjeta: agrega directo si hay una sola opción posible;
 * si hay que elegir peso o variedad, lleva al detalle.
 */
function CardAction({ product, to }: { product: Product; to: string }) {
  const line = quickAddLine(product);
  const [add, { isLoading }] = useAddToCartMutation();
  const [done, setDone] = useState(false);
  const dispatch = useAppDispatch();

  const base =
    'relative z-10 inline-flex size-9 shrink-0 items-center justify-center gap-1.5 rounded-full text-sm font-medium transition-all active:scale-95 sm:size-auto sm:h-9 sm:px-3.5';

  if (!line) {
    return (
      <Link to={to} className={cn(base, 'bg-brand-50 text-brand-600 hover:bg-brand-500 hover:text-white')} aria-label={`Elegir opciones de ${product.name}`}>
        <span className="hidden sm:inline">Elegir</span>
        <ChevronRight className="size-4" />
      </Link>
    );
  }

  const onAdd = async () => {
    const { label: _label, ...item } = line;
    try {
      await add([item]).unwrap();
      setDone(true);
      window.setTimeout(() => setDone(false), 1600);
      dispatch(setDrawerOpen(true));
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={isLoading}
      title={`Agregar ${line.label} al carrito`}
      aria-label={`Agregar ${product.name} (${line.label}) al carrito`}
      className={cn(base, done ? 'bg-leaf-500 text-white' : 'bg-brand-500 text-white shadow-sm hover:bg-brand-600')}
    >
      {isLoading ? <Spinner className="size-4" /> : done ? <Check className="size-4" strokeWidth={3} /> : <ShoppingCart className="size-4" />}
      <span className="hidden sm:inline">{done ? 'Listo' : 'Agregar'}</span>
    </button>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border border-ink-200 p-3" aria-hidden>
      <div className="skeleton aspect-square rounded-xl" />
      <div className="skeleton mt-3 h-3 w-1/3" />
      <div className="skeleton mt-2 h-4 w-3/4" />
      <div className="mt-4 flex justify-between">
        <div className="skeleton h-5 w-20" />
        <div className="skeleton h-9 w-24 rounded-full" />
      </div>
    </div>
  );
}

export function ProductGrid({ products, loading, count = 8, className }: { products?: Product[]; loading?: boolean; count?: number; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4', className)}>
      {loading
        ? Array.from({ length: count }, (_, i) => <ProductCardSkeleton key={i} />)
        : products?.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
