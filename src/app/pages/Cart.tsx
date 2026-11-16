import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { AlertTriangle, ArrowLeft, ArrowRight, Banknote, CircleCheck, CreditCard, ImageOff, Landmark, Lock, ShieldCheck, ShoppingBag, Trash2, Wallet, X, type LucideIcon } from 'lucide-react';
import { useCartQuery, useCheckoutMutation, useCreatePaymentPreferenceMutation, usePaymentConfigQuery, useUpdateCartMutation } from '../api/shopApi';
import type { CartItem, PaymentType } from '../api/types';
import { getErrorMessage } from '../api/client';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { QtyStepper } from '../components/QtyStepper';
import { EmptyState, ErrorState, PageLoader, Spinner } from '../components/States';
import { useAppSelector, useCartKey } from '../store';
import { PAYMENT_OPTIONS } from '../lib/orders';
import { packLabel, stockUnit } from '../lib/shop';
import { cn, formatCurrency, formatNumber } from '../lib/utils';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const PAYMENT_ICONS: Record<PaymentType, LucideIcon> = {
  MERCADOPAGO: Wallet,
  TRANSFER: Landmark,
  CASH: Banknote,
  DEBIT: CreditCard,
  CREDIT: CreditCard,
};

export default function Cart() {
  useDocumentTitle('Carrito');
  const key = useCartKey();
  const authStatus = useAppSelector((s) => s.auth.status);
  const { data: cart, isLoading, error, refetch, isFetching } = useCartQuery(key);
  const [updateCart] = useUpdateCartMutation();
  const [checkout, { isLoading: placing }] = useCheckoutMutation();
  const [createPreference, { isLoading: redirecting }] = useCreatePaymentPreferenceMutation();
  const { data: paymentConfig } = usePaymentConfigQuery();
  const mpEnabled = paymentConfig?.mercadoPago.enabled ?? false;
  const [chosen, setPayment] = useState<PaymentType>('MERCADOPAGO');
  // Si Mercado Pago no está configurado en el backend, no se ofrece
  const options = PAYMENT_OPTIONS.filter((o) => o.value !== 'MERCADOPAGO' || mpEnabled);
  const payment = options.some((o) => o.value === chosen) ? chosen : (options[0]?.value ?? 'TRANSFER');
  const navigate = useNavigate();

  if (isLoading || authStatus === 'checking') return <PageLoader />;

  const items = cart?.items ?? [];
  const problems = items.filter((i) => !i.available || !i.enoughStock);

  const run = async (body: Parameters<typeof updateCart>[0]) => {
    try {
      await updateCart(body).unwrap();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const finish = async () => {
    try {
      const order = await checkout({ paymentType: payment }).unwrap();
      if (payment === 'MERCADOPAGO') {
        try {
          const pref = await createPreference(order.id).unwrap();
          window.location.assign(pref.initPoint);
          return;
        } catch (e) {
          // El pedido ya está creado: se puede reintentar el pago desde su detalle
          toast.error(`No pudimos abrir Mercado Pago: ${getErrorMessage(e)}. Podés reintentar desde tu pedido.`);
          navigate(`/mi-cuenta/pedidos/${order.id}?nuevo=1`);
          return;
        }
      }
      toast.success('¡Pedido confirmado!');
      navigate(`/mi-cuenta/pedidos/${order.id}?nuevo=1`);
    } catch (e) {
      toast.error(getErrorMessage(e));
      refetch();
    }
  };

  return (
    <div className="container-page">
      <Breadcrumbs items={[{ label: 'Carrito' }]} />

      {error ? (
        <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="size-7" />}
          title="Tu carrito está vacío"
          action={
            <Link to="/productos" className="btn-primary h-12 px-7">
              Explorar productos
            </Link>
          }
        >
          Sumá frutos secos, harinas, especias y todo lo que necesites.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-10 pb-4 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
          <section aria-labelledby="mi-carrito" className="min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
              <h1 id="mi-carrito" className="text-3xl font-semibold text-ink-800 sm:text-[40px]">
                Mi Carrito
              </h1>
              <button
                onClick={() => window.confirm('¿Vaciar el carrito?') && run({ clear: true })}
                className="btn-ghost -mr-3 h-10 px-3 text-sm text-ink-500 hover:text-brand-600 sm:mr-0 sm:h-9"
              >
                <Trash2 className="size-4" /> Vaciar carrito
              </button>
            </div>

            {problems.length > 0 && (
              <div role="alert" className="mt-6 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <AlertTriangle className="mt-0.5 size-5 shrink-0" />
                <p>Algunos productos no tienen stock suficiente. Al confirmar, ajustaremos esas cantidades a lo disponible o los quitaremos del pedido.</p>
              </div>
            )}

            <ul className={cn('mt-6 divide-y divide-ink-200 transition-opacity', isFetching && 'opacity-80')}>
              {items.map((it) => (
                <CartLine
                  key={`${it.productVariantId}-${it.selectedBulkOption}`}
                  item={it}
                  onQty={(quantity) =>
                    run({ editItem: [{ productVariantId: it.productVariantId, selectedBulkOption: it.selectedBulkOption || undefined, quantity }] })
                  }
                  onRemove={() =>
                    run({
                      removeItem: [{ productVariantId: it.productVariantId, ...(it.selectedBulkOption ? { selectedBulkOption: it.selectedBulkOption } : {}) }],
                    })
                  }
                />
              ))}
            </ul>

            <Link to="/productos" className="btn-ghost mt-4 -ml-3 h-10 px-3 text-sm text-brand-500 hover:bg-brand-50 hover:text-brand-600">
              <ArrowLeft className="size-4" /> Seguir comprando
            </Link>
          </section>

          <aside className="space-y-6 lg:sticky lg:top-40 lg:self-start">
            <div className="rounded-xl border border-ink-200 p-4 min-[375px]:p-5 sm:p-8">
              <h2 className="text-2xl font-semibold text-ink-800">Forma de pago</h2>
              <p className="mt-1 text-sm text-ink-500">Las ofertas y descuentos se aplican automáticamente.</p>
              <div role="radiogroup" aria-label="Forma de pago" className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {options.map((o) => {
                  const Icon = PAYMENT_ICONS[o.value];
                  const selected = payment === o.value;
                  return (
                    <button
                      key={o.value}
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setPayment(o.value)}
                      className={cn(
                        'flex items-center gap-2.5 rounded-xl border px-3 py-3 text-left text-sm transition-all active:scale-[0.98]',
                        selected ? 'border-brand-500 bg-brand-50 font-medium text-brand-700 ring-1 ring-brand-500' : 'border-ink-200 text-ink-700 hover:border-ink-400',
                        o.value === 'MERCADOPAGO' && 'sm:col-span-2',
                      )}
                    >
                      <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', selected ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-500')}>
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1 leading-tight">{o.label}</span>
                      {selected && <CircleCheck className="size-4 shrink-0 text-brand-500" />}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-ink-500">{PAYMENT_OPTIONS.find((o) => o.value === payment)?.hint}</p>
            </div>

            <div className="rounded-xl border border-ink-200 p-4 min-[375px]:p-5 sm:p-8">
              <h2 className="text-2xl font-semibold text-ink-800">Resumen de la orden</h2>
              <dl className="mt-6 space-y-4 text-[17px]">
                <div className="flex justify-between text-ink-400">
                  <dt>Subtotal</dt>
                  <dd className="tabular-nums">{formatCurrency(cart?.summary.subtotal)}</dd>
                </div>
                <div className="flex justify-between text-ink-400">
                  <dt>Descuentos</dt>
                  <dd className={cn('tabular-nums', (cart?.summary.discount ?? 0) > 0 && 'text-leaf-600')}>
                    {(cart?.summary.discount ?? 0) > 0 ? `−${formatCurrency(cart?.summary.discount)}` : formatCurrency(0)}
                  </dd>
                </div>
                <div className="flex items-center justify-between border-t border-ink-200 pt-5">
                  <dt className="font-semibold text-ink-800">Total</dt>
                  <dd className="text-2xl font-bold text-ink-800 tabular-nums">{formatCurrency(cart?.summary.total)}</dd>
                </div>
              </dl>

              {authStatus === 'authenticated' ? (
                <button onClick={finish} disabled={placing || redirecting || isFetching} className="btn-primary mt-6 h-13 w-full rounded-xl text-base sm:text-[17px]">
                  {placing || redirecting ? <Spinner /> : <ShieldCheck className="size-5" />}
                  {redirecting ? 'Abriendo Mercado Pago…' : payment === 'MERCADOPAGO' ? 'Pagar con Mercado Pago' : 'Finalizar compra'}
                  <ArrowRight className="size-4" />
                </button>
              ) : (
                <>
                  <Link to="/login" state={{ from: '/carrito' }} className="btn-primary mt-6 h-13 w-full rounded-xl px-3 text-center text-base leading-tight whitespace-normal sm:text-[17px]">
                    <Lock className="size-4" /> Iniciá sesión para finalizar
                  </Link>
                  <p className="mt-3 text-center text-xs text-ink-500">Tu carrito se guarda: lo vas a encontrar al ingresar.</p>
                </>
              )}
              <p className="mt-4 text-center text-xs text-ink-400">
                Coordinamos la entrega o el retiro por WhatsApp una vez confirmado el pedido.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function CartLine({ item, onQty, onRemove }: { item: CartItem; onQty: (q: number) => void; onRemove: () => void }) {
  const v = item.productVariant;
  const img = v.images?.[0]?.secure_url;
  const productName = v.product?.name ?? v.name;
  const loose = !item.selectedBulkOption;
  const weight = v.contentMeasure === 'KG' || v.contentMeasure === 'G';
  const step = loose && weight ? 50 : 1;
  const stock = Number(v.currentStock) || 0;
  const max = loose ? Math.max(stock, item.quantity) : Math.max(Math.floor(stock / item.selectedBulkOption), item.quantity);
  const productId = v.product?.id ?? v.productId;

  return (
    <li className="flex gap-3 py-6 sm:items-center sm:gap-5">
      <button
        onClick={onRemove}
        aria-label={`Quitar ${productName}`}
        title="Quitar"
        className="btn-icon mt-5 size-9 self-start text-ink-500 hover:bg-brand-50 hover:text-brand-600 sm:mt-0 sm:self-center"
      >
        <X className="size-5" />
      </button>
      <Link to={`/producto/${productId}`} className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ink-50 text-ink-300 sm:size-[100px]">
        {img ? <img src={img} alt="" className="size-full object-cover" /> : <ImageOff className="size-7" />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Link to={`/producto/${productId}`} className="line-clamp-2 text-lg text-ink-800 hover:text-brand-500 sm:text-xl">
            {productName}
          </Link>
          <p className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-[15px] text-ink-400">
            {v.product?.name && v.name !== v.product.name && (
              <span>
                Variedad: <span className="break-words text-ink-800">{v.name}</span>
              </span>
            )}
            <span>
              {v.contentMeasure === 'KG' ? 'Peso' : 'Presentación'}:{' '}
              <span className="text-ink-800">{loose ? `${formatNumber(item.quantity)} ${stockUnit(v.contentMeasure)}` : packLabel(item.selectedBulkOption, v.contentMeasure)}</span>
            </span>
          </p>
          {item.quote.offerType && <p className="mt-1 text-sm font-medium text-leaf-600">Oferta {item.quote.offerType} aplicada</p>}
          {(!item.available || !item.enoughStock) && (
            <p className="mt-1 text-sm text-amber-700">{item.available ? `Stock disponible: ${formatNumber(stock)} ${stockUnit(v.contentMeasure)}` : 'Sin stock'}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:flex-col sm:flex-nowrap sm:items-end sm:gap-2">
          <p className="text-xl font-medium whitespace-nowrap text-ink-800 tabular-nums sm:text-[22px]">
            {item.quote.discount > 0 && <span className="mr-2 text-sm font-normal text-ink-400 line-through">{formatCurrency(item.quote.total + item.quote.discount)}</span>}
            {formatCurrency(item.quote.total)}
          </p>
          <QtyStepper
            size="sm"
            value={item.quantity}
            min={step}
            step={step}
            max={max}
            unit={loose && weight ? 'g' : undefined}
            onChange={onQty}
            onRemove={onRemove}
          />
        </div>
      </div>
    </li>
  );
}
