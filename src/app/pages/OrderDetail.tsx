import { Link, useParams, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, CalendarClock, Check, CheckCircle2, ImageOff, MessageCircle, RotateCcw, XCircle } from 'lucide-react';
import { useAddToCartMutation, useCancelOrderMutation, useOrderQuery } from '../api/shopApi';
import { useAppDispatch } from '../store';
import { setDrawerOpen } from '../store/cartSlice';
import { getErrorMessage } from '../api/client';
import { ErrorState, PageLoader, Spinner } from '../components/States';
import { StatusBadge } from './Orders';
import { ITEM_STATUS, ORDER_STATUS, ORDER_STEPS, describeQty, itemTotal, orderNumber, paymentLabel } from '../lib/orders';
import { whatsappLink } from '../lib/contact';
import { cn, formatCurrency, formatDate, formatDateTime } from '../lib/utils';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function OrderDetail() {
  const id = Number(useParams().id);
  const isNew = useSearchParams()[0].get('nuevo') === '1';
  const { data: order, isLoading, error, refetch } = useOrderQuery(id);
  const [cancel, { isLoading: cancelling }] = useCancelOrderMutation();
  const [addToCart, { isLoading: reordering }] = useAddToCartMutation();
  const dispatch = useAppDispatch();
  useDocumentTitle(`Pedido ${orderNumber(id)}`);

  if (isLoading) return <PageLoader />;
  if (error || !order) return <ErrorState message={getErrorMessage(error) || 'No encontramos el pedido.'} onRetry={refetch} />;

  const step = ORDER_STEPS.indexOf(order.status);
  const items = order.orderItems ?? [];
  const discount = items.reduce((n, i) => n + (i.status === 'CANCELLED' || i.status === 'RETURNED' ? 0 : i.discountAppliedSnapshot || 0), 0);

  const doCancel = async () => {
    if (!window.confirm('¿Seguro que querés cancelar este pedido?')) return;
    try {
      await cancel(order.id).unwrap();
      toast.success('Pedido cancelado.');
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  // "Volver a comprar": mismas variantes, presentaciones y cantidades.
  const reorderLines = items
    .filter((i) => i.productVariantId && i.status !== 'CANCELLED' && i.status !== 'RETURNED' && i.quantity > 0)
    .map((i) => ({
      productVariantId: i.productVariantId!,
      quantity: i.quantity,
      ...(i.selectedBulkOption ? { selectedBulkOption: Number(i.selectedBulkOption) } : {}),
    }));
  const reorder = async () => {
    try {
      await addToCart(reorderLines).unwrap();
      toast.success('Agregamos los productos a tu carrito');
      dispatch(setDrawerOpen(true));
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/mi-cuenta/pedidos" className="btn-ghost -ml-2 h-9 px-2 text-sm text-ink-600">
        <ArrowLeft className="size-4" /> Mis pedidos
      </Link>

      {isNew && (
        <div className="flex gap-4 rounded-xl border border-leaf-500/30 bg-[#f4f9ea] p-5 animate-fade-in">
          <CheckCircle2 className="size-8 shrink-0 text-leaf-600" />
          <div>
            <p className="text-lg font-semibold text-ink-800">¡Gracias por tu compra!</p>
            <p className="mt-1 text-ink-600">
              Recibimos tu pedido. Te vamos a contactar para coordinar el pago ({paymentLabel(order.paymentType)}) y la entrega.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-semibold text-ink-800">
            Pedido {orderNumber(order.id)} <StatusBadge status={order.status} />
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {formatDateTime(order.createdAt)} · {paymentLabel(order.paymentType)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {reorderLines.length > 0 && (
            <button onClick={reorder} disabled={reordering} className="btn-primary h-10 px-4 text-sm">
              {reordering ? <Spinner className="size-4" /> : <RotateCcw className="size-4" />} Volver a comprar
            </button>
          )}
          <a
            href={whatsappLink(`Hola! Consulto por mi pedido ${orderNumber(order.id)}`)}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary h-10 px-4 text-sm"
          >
            <MessageCircle className="size-4" /> Consultar
          </a>
          {order.status === 'PENDING' && (
            <button onClick={doCancel} disabled={cancelling} className="btn-ghost h-10 px-4 text-sm text-brand-600 hover:bg-brand-50 hover:text-brand-700">
              {cancelling ? <Spinner className="size-4" /> : <XCircle className="size-4" />} Cancelar pedido
            </button>
          )}
        </div>
      </div>

      {order.status !== 'CANCELLED' ? (
        <ol className="grid grid-cols-4 gap-2 rounded-xl border border-ink-200 p-5" aria-label="Estado del pedido">
          {ORDER_STEPS.map((s, i) => (
            <li key={s} className="relative flex flex-col items-center text-center">
              {i > 0 && <span className={cn('absolute top-4 right-1/2 h-0.5 w-full -translate-y-1/2', i <= step ? 'bg-brand-500' : 'bg-ink-200')} />}
              <span
                className={cn(
                  'relative z-10 flex size-8 items-center justify-center rounded-full text-sm font-semibold',
                  i < step ? 'bg-brand-500 text-white' : i === step ? 'bg-white text-brand-500 ring-2 ring-brand-500' : 'bg-ink-100 text-ink-400',
                )}
                aria-current={i === step ? 'step' : undefined}
              >
                {i < step ? <Check className="size-4" strokeWidth={3} /> : i + 1}
              </span>
              <span className={cn('mt-2 text-xs sm:text-sm', i <= step ? 'font-medium text-ink-800' : 'text-ink-400')}>{ORDER_STATUS[s].label}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="rounded-xl bg-ink-50 p-4 text-ink-600">{ORDER_STATUS.CANCELLED.hint}</p>
      )}

      {order.estimatedReadyAt && order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
        <p className="flex items-center gap-2 text-sm text-ink-600">
          <CalendarClock className="size-4 text-brand-500" /> Fecha estimada en que estará listo: <strong>{formatDate(order.estimatedReadyAt)}</strong>
        </p>
      )}

      <section className="rounded-xl border border-ink-200">
        <ul className="divide-y divide-ink-100">
          {items.map((it) => {
            const img = it.productVariant?.images?.[0]?.secure_url;
            const closed = it.status === 'CANCELLED' || it.status === 'RETURNED';
            const productId = it.productVariant?.product?.id;
            return (
              <li key={it.id} className={cn('flex items-center gap-4 p-4', closed && 'opacity-60')}>
                <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ink-100 text-ink-300">
                  {img ? <img src={img} alt="" className="size-full object-cover" /> : <ImageOff className="size-6" />}
                </span>
                <div className="min-w-0 flex-1">
                  {productId ? (
                    <Link to={`/producto/${productId}`} className="font-medium text-ink-800 hover:text-brand-500">
                      {it.productNameSnapshot}
                    </Link>
                  ) : (
                    <p className="font-medium text-ink-800">{it.productNameSnapshot}</p>
                  )}
                  <p className="text-sm text-ink-500">
                    {it.variantNameSnapshot} · {describeQty(it.quantity, it.selectedBulkOption, it.productVariant?.contentMeasure)}
                  </p>
                  {ITEM_STATUS[it.status] && <p className="mt-0.5 text-xs font-medium text-amber-700">{ITEM_STATUS[it.status]}</p>}
                  {it.offerTypeSnapshot && !closed && <p className="mt-0.5 text-xs font-medium text-leaf-600">Oferta {it.offerTypeSnapshot}</p>}
                </div>
                <span className={cn('font-semibold text-ink-800 tabular-nums', closed && 'line-through')}>{formatCurrency(itemTotal(it))}</span>
              </li>
            );
          })}
        </ul>
        <dl className="space-y-2 border-t border-ink-200 p-5 text-sm">
          {discount > 0 && (
            <div className="flex justify-between text-leaf-600">
              <dt>Descuentos aplicados</dt>
              <dd>−{formatCurrency(discount)}</dd>
            </div>
          )}
          <div className="flex items-center justify-between">
            <dt className="text-base font-semibold text-ink-800">Total</dt>
            <dd className="text-xl font-bold text-ink-800">{formatCurrency(order.totalPrice)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
