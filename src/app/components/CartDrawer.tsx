import { useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { ArrowRight, CheckCircle2, ImageOff, X } from 'lucide-react';
import { useCartQuery } from '../api/shopApi';
import { useAppDispatch, useAppSelector, useCartKey } from '../store';
import { setDrawerOpen } from '../store/cartSlice';
import { describeQty } from '../lib/orders';
import { cn, formatCurrency } from '../lib/utils';

/** Panel lateral que confirma lo agregado y muestra el resumen del carrito. */
export function CartDrawer() {
  const open = useAppSelector((s) => s.cart.drawerOpen);
  const dispatch = useAppDispatch();
  const { data: cart } = useCartQuery(useCartKey());
  const location = useLocation();
  const close = () => dispatch(setDrawerOpen(false));

  useEffect(() => {
    close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Carrito">
      <div className="absolute inset-0 bg-ink-900/40 animate-fade-in" onClick={close} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl animate-slide-in">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <p className="flex items-center gap-2 font-medium text-ink-800">
            <CheckCircle2 className="size-5 text-leaf-600" /> Agregado al carrito
          </p>
          <button onClick={close} aria-label="Cerrar" className="btn-icon size-9">
            <X className="size-5" />
          </button>
        </div>

        <ul className="flex-1 divide-y divide-ink-100 overflow-y-auto px-5">
          {cart?.items.map((it) => {
            const v = it.productVariant;
            const img = v.images?.[0]?.secure_url;
            return (
              <li key={`${it.productVariantId}-${it.selectedBulkOption}`} className="flex gap-3 py-4">
                <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ink-50 text-ink-300">
                  {img ? <img src={img} alt="" className="size-full object-cover" /> : <ImageOff className="size-6" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-800">{v.product?.name ?? v.name}</p>
                  <p className="truncate text-xs text-ink-500">{v.name}</p>
                  <p className="mt-1 text-xs text-ink-600">{describeQty(it.quantity, it.selectedBulkOption, v.contentMeasure)}</p>
                </div>
                <div className="shrink-0 text-right">
                  {it.quote.discount > 0 && (
                    <p className="text-xs text-ink-400 line-through tabular-nums">{formatCurrency(it.quote.total + it.quote.discount)}</p>
                  )}
                  <p className={cn('text-sm font-semibold tabular-nums', it.quote.discount > 0 ? 'text-leaf-600' : 'text-ink-800')}>
                    {formatCurrency(it.quote.total)}
                  </p>
                  {it.quote.discount > 0 && it.quote.offerType && (
                    <span className="mt-0.5 inline-block rounded-full bg-leaf-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-leaf-600">{it.quote.offerType}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="space-y-3 border-t border-ink-100 bg-ink-50/60 p-5">
          {(cart?.summary.discount ?? 0) > 0 && (
            <div className="flex items-center justify-between text-sm text-leaf-600">
              <span>Ahorro con ofertas</span>
              <span className="font-medium">−{formatCurrency(cart?.summary.discount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-ink-600">Total</span>
            <span className="text-xl font-bold text-ink-800">{formatCurrency(cart?.summary.total ?? 0)}</span>
          </div>
          <Link to="/carrito" className="btn-primary h-12 w-full rounded-xl text-base">
            Ver carrito y finalizar <ArrowRight className="size-4" />
          </Link>
          <button onClick={close} className="btn-secondary h-11 w-full rounded-xl">
            Seguir comprando
          </button>
        </div>
      </aside>
    </div>
  );
}
