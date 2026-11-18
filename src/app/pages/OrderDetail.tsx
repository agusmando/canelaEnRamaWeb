import { useEffect, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { AlertTriangle, ArrowLeft, CalendarClock, Check, CheckCircle2, Clock, ExternalLink, ImageOff, MapPin, MessageCircle, RotateCcw, Store, Truck, Wallet, XCircle } from 'lucide-react';
import {
  useAddToCartMutation,
  useCancelOrderMutation,
  useCreatePaymentPreferenceMutation,
  useOrderQuery,
  useOrderShipmentQuery,
  useShippingConfigQuery,
  useSyncPaymentMutation,
} from '../api/shopApi';
import type { Order, OrderItem } from '../api/types';
import { useAppDispatch } from '../store';
import { setDrawerOpen } from '../store/cartSlice';
import { getErrorMessage } from '../api/client';
import { ErrorState, PageLoader, Spinner } from '../components/States';
import { StatusBadge } from './Orders';
import { ShipmentDetails } from '../components/ShipmentTracking';
import { ITEM_STATUS, ORDER_STATUS, ORDER_STEPS, orderStatusInfo, PAYMENT_STATUS, canPayOnline, describeQty, itemTotal, orderNumber, orderTotal, paymentLabel } from '../lib/orders';
import { SHIPMENT_METHOD } from '../lib/shipments';
import { whatsappLink } from '../lib/contact';
import { cn, formatCurrency, formatDate, formatDateTime } from '../lib/utils';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { cld } from '../lib/cloudinary';

/** La variante sigue a la venta en la web (si el API no manda el dato, se asume que sí). */
const isSellable = (v: OrderItem['productVariant']) =>
  !!v && v.active !== false && v.availableWeb !== false && v.product?.active !== false;

export default function OrderDetail() {
  const id = Number(useParams().id);
  const [params] = useSearchParams();
  const isNew = params.get('nuevo') === '1';
  /** Vuelta desde Mercado Pago: ?pago=aprobado|pendiente|rechazado */
  const returnedFromMp = params.get('pago');
  const { data: order, isLoading, error, refetch } = useOrderQuery(id);
  const [syncPayment, { isLoading: syncing }] = useSyncPaymentMutation();
  const [createPreference, { isLoading: redirecting }] = useCreatePaymentPreferenceMutation();
  // Al volver de Mercado Pago, el webhook puede demorar: consultamos el pago una vez
  const synced = useRef(false);
  useEffect(() => {
    if (!returnedFromMp || synced.current || !Number.isFinite(id)) return;
    synced.current = true;
    syncPayment(id).unwrap().catch(() => {});
  }, [returnedFromMp, id, syncPayment]);
  const [cancel, { isLoading: cancelling }] = useCancelOrderMutation();
  const [addToCart, { isLoading: reordering }] = useAddToCartMutation();
  const dispatch = useAppDispatch();
  // El pedido trae `shipment` (o null si no tiene); si el backend no lo incluye, se pide aparte (404 → sin envío).
  const { data: fetchedShipment } = useOrderShipmentQuery(id, { skip: !order || order.shipment !== undefined });
  const shipment = order?.shipment !== undefined ? order.shipment : fetchedShipment;
  const { data: shippingConfig } = useShippingConfigQuery();
  useDocumentTitle(`Pedido ${orderNumber(id)}`, { noindex: true });

  if (isLoading) return <PageLoader />;
  if (error || !order) return <ErrorState message={getErrorMessage(error) || 'No encontramos el pedido.'} onRetry={refetch} />;

  const step = ORDER_STEPS.indexOf(order.status);
  const items = order.orderItems ?? [];
  const discount = items.reduce((n, i) => n + (i.status === 'CANCELLED' || i.status === 'RETURNED' ? 0 : i.discountAppliedSnapshot || 0), 0);

  const payOnline = async () => {
    try {
      const pref = await createPreference(order.id).unwrap();
      window.location.assign(pref.initPoint);
    } catch (e) {
      toast.error(getErrorMessage(e));
      refetch();
    }
  };
  const isMp = order.paymentType === 'MERCADOPAGO';
  const method = order.shippingMethod ?? shipment?.method ?? 'PICKUP';
  const isDelivery = method === 'DELIVERY';
  const shippingCost = Number(order.shippingCost) || 0;
  const deliveryAddress = shipment ? [shipment.address, shipment.city, shipment.province, shipment.postalCode].filter(Boolean).join(', ') : '';
  const courierUrl = isDelivery && shipment?.carrierTrackingUrl && !['DELIVERED', 'RETURNED', 'CANCELLED'].includes(shipment.status) ? shipment.carrierTrackingUrl : null;
  const paymentLocked = order.paymentStatus === 'APPROVED' || order.paymentStatus === 'IN_PROCESS';

  const doCancel = async () => {
    if (!window.confirm('¿Seguro que querés cancelar este pedido?')) return;
    try {
      await cancel(order.id).unwrap();
      toast.success('Pedido cancelado.');
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  // "Volver a comprar": mismas variantes, presentaciones y cantidades, salvo
  // las que ya no se venden en la web (el API las rechazaría).
  const boughtLines = items.filter((i) => i.productVariantId && i.status !== 'CANCELLED' && i.status !== 'RETURNED' && i.quantity > 0);
  const reorderLines = boughtLines
    .filter((i) => isSellable(i.productVariant))
    .map((i) => ({
      productVariantId: i.productVariantId!,
      quantity: i.quantity,
      ...(i.selectedBulkOption ? { selectedBulkOption: Number(i.selectedBulkOption) } : {}),
    }));
  const reorder = async () => {
    try {
      await addToCart(reorderLines).unwrap();
      const skipped = boughtLines.length - reorderLines.length;
      toast.success(
        skipped
          ? `Agregamos los productos a tu carrito (${skipped === 1 ? '1 ya no está disponible' : `${skipped} ya no están disponibles`})`
          : 'Agregamos los productos a tu carrito',
      );
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

      {isMp && (returnedFromMp || canPayOnline(order)) && order.status !== 'CANCELLED' && (
        <PaymentBanner order={order} syncing={syncing} redirecting={redirecting} onPay={payOnline} />
      )}

      {isNew && !isMp && (
        <div className="flex gap-3 rounded-xl border border-leaf-500/30 bg-[#f4f9ea] p-4 animate-fade-in sm:gap-4 sm:p-5">
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
            Pedido {orderNumber(order.id)} <StatusBadge status={order.status} method={method} />
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {formatDateTime(order.createdAt)} · {paymentLabel(order.paymentType)} · {SHIPMENT_METHOD[method] ?? method}
            {isMp && order.paymentStatus && (
              <span className={cn('ml-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1', PAYMENT_STATUS[order.paymentStatus].className)}>
                {PAYMENT_STATUS[order.paymentStatus].label}
              </span>
            )}
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
          {order.status === 'PENDING' && !paymentLocked && (
            <button onClick={doCancel} disabled={cancelling} className="btn-ghost h-10 px-4 text-sm text-brand-600 hover:bg-brand-50 hover:text-brand-700">
              {cancelling ? <Spinner className="size-4" /> : <XCircle className="size-4" />} Cancelar pedido
            </button>
          )}
        </div>
      </div>

      {order.status !== 'CANCELLED' ? (
        <ol className="grid grid-cols-4 gap-1 rounded-xl border border-ink-200 px-2 py-4 sm:gap-2 sm:p-5" aria-label="Estado del pedido">
          {ORDER_STEPS.map((s, i) => (
            <li key={s} className="relative flex min-w-0 flex-col items-center text-center">
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
              <span className={cn('mt-2 max-w-full text-[11px] leading-tight break-words hyphens-auto min-[375px]:text-xs sm:text-sm', i <= step ? 'font-medium text-ink-800' : 'text-ink-400')}>{orderStatusInfo(s, method).label}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="rounded-xl bg-ink-50 p-4 text-ink-600">{ORDER_STATUS.CANCELLED.hint}</p>
      )}

      {order.estimatedReadyAt && order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
        <p className="flex items-start gap-2 text-sm text-ink-600 sm:items-center">
          <CalendarClock className="mt-0.5 size-4 shrink-0 text-brand-500 sm:mt-0" /> Fecha estimada en que estará listo: <strong>{formatDate(order.estimatedReadyAt)}</strong>
        </p>
      )}

      <section aria-labelledby="entrega" className="flex flex-col gap-4 rounded-xl border border-ink-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500">
            {isDelivery ? <Truck className="size-5" /> : <Store className="size-5" />}
          </span>
          <div className="min-w-0 text-sm">
            <h2 id="entrega" className="text-base font-semibold text-ink-800">
              {SHIPMENT_METHOD[method] ?? method}
              <span className="ml-2 font-normal text-ink-500">· {shippingCost > 0 ? formatCurrency(shippingCost) : isDelivery ? 'Envío gratis' : 'Sin cargo'}</span>
            </h2>
            {isDelivery ? (
              deliveryAddress ? (
                <p className="mt-1 flex items-start gap-1.5 break-words text-ink-600">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-ink-400" />
                  <span>
                    {deliveryAddress}
                    {(shipment?.recipientName || shipment?.phone) && (
                      <span className="block text-ink-500">Recibe {[shipment?.recipientName, shipment?.phone].filter(Boolean).join(' · ')}</span>
                    )}
                    {shipment?.notes && <span className="block text-ink-500">{shipment.notes}</span>}
                  </span>
                </p>
              ) : (
                order.shippingZone && <p className="mt-1 text-ink-600">Envío a {order.shippingZone}</p>
              )
            ) : (
              shippingConfig?.pickup && (
                <p className="mt-1 text-ink-600">
                  Retirás en {shippingConfig.pickup.name}, {shippingConfig.pickup.address}
                </p>
              )
            )}
          </div>
        </div>
        {courierUrl && (
          <a href={courierUrl} target="_blank" rel="noreferrer" className="btn-primary h-11 shrink-0 px-5 text-sm">
            <Truck className="size-4" /> Seguir al repartidor <ExternalLink className="size-3.5" />
            <span className="sr-only">(se abre en otra pestaña)</span>
          </a>
        )}
      </section>

      {shipment && <ShipmentDetails data={shipment} />}

      <section className="rounded-xl border border-ink-200">
        <ul className="divide-y divide-ink-100">
          {items.map((it) => {
            const img = it.productVariant?.images?.[0]?.secure_url;
            const closed = it.status === 'CANCELLED' || it.status === 'RETURNED';
            const productId = it.productVariant?.product?.active === false ? undefined : it.productVariant?.product?.id;
            return (
              <li key={it.id} className={cn('flex items-center gap-3 p-3.5 sm:gap-4 sm:p-4', closed && 'opacity-60')}>
                <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ink-100 text-ink-300 sm:size-16">
                  {img ? <img src={cld(img, { w: 160, h: 160 })} alt="" loading="lazy" decoding="async" className="size-full object-cover" /> : <ImageOff className="size-6" />}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                  <div className="min-w-0 flex-1">
                    {productId ? (
                      <Link to={`/producto/${productId}`} className="font-medium break-words text-ink-800 hover:text-brand-500">
                        {it.productNameSnapshot}
                      </Link>
                    ) : (
                      <p className="font-medium break-words text-ink-800">{it.productNameSnapshot}</p>
                    )}
                    <p className="text-sm text-ink-500">
                      {it.variantNameSnapshot} · {describeQty(it.quantity, it.selectedBulkOption, it.productVariant?.contentMeasure)}
                    </p>
                    {ITEM_STATUS[it.status] && <p className="mt-0.5 text-xs font-medium text-amber-700">{ITEM_STATUS[it.status]}</p>}
                    {it.offerTypeSnapshot && !closed && (
                      <p className="mt-0.5 text-xs font-medium text-leaf-600">
                        Oferta {it.offerTypeSnapshot}
                        {(it.discountAppliedSnapshot || 0) > 0 && ` · ahorraste ${formatCurrency(it.discountAppliedSnapshot)}`}
                      </p>
                    )}
                  </div>
                  <span className="flex items-baseline gap-2 whitespace-nowrap sm:shrink-0 sm:flex-col sm:items-end sm:gap-0">
                    {!closed && (it.discountAppliedSnapshot || 0) > 0 && (
                      <span className="text-xs text-ink-400 line-through tabular-nums">{formatCurrency(itemTotal(it) + (it.discountAppliedSnapshot || 0))}</span>
                    )}
                    <span className={cn('font-semibold tabular-nums', closed ? 'text-ink-800 line-through' : (it.discountAppliedSnapshot || 0) > 0 ? 'text-leaf-600' : 'text-ink-800')}>
                      {formatCurrency(itemTotal(it))}
                    </span>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
        <dl className="space-y-2 border-t border-ink-200 p-4 text-sm sm:p-5">
          {discount > 0 && (
            <div className="flex justify-between text-leaf-600">
              <dt>Descuentos aplicados</dt>
              <dd>−{formatCurrency(discount)}</dd>
            </div>
          )}
          <div className="flex justify-between text-ink-600">
            <dt>Productos</dt>
            <dd className="tabular-nums">{formatCurrency(order.totalPrice)}</dd>
          </div>
          <div className="flex justify-between text-ink-600">
            <dt>{isDelivery ? 'Envío a domicilio' : 'Retiro en el local'}</dt>
            <dd className={cn('tabular-nums', shippingCost === 0 && 'text-leaf-600')}>
              {shippingCost > 0 ? formatCurrency(shippingCost) : isDelivery ? 'Gratis' : 'Sin cargo'}
            </dd>
          </div>
          <div className="flex items-center justify-between border-t border-ink-100 pt-2">
            <dt className="text-base font-semibold text-ink-800">Total</dt>
            <dd className="text-xl font-bold text-ink-800 tabular-nums">{formatCurrency(orderTotal(order))}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

/** Resultado del pago con Mercado Pago y botón para pagar / reintentar. */
function PaymentBanner({ order, syncing, redirecting, onPay }: { order: Order; syncing: boolean; redirecting: boolean; onPay: () => void }) {
  const status = order.paymentStatus ?? 'PENDING';
  const payButton = canPayOnline(order) && (
    <button onClick={onPay} disabled={redirecting || syncing} className="btn-primary mt-3 h-11 px-5 text-sm">
      {redirecting ? <Spinner className="size-4" /> : <Wallet className="size-4" />}
      {status === 'REJECTED' || status === 'CANCELLED' ? 'Reintentar el pago' : 'Pagar con Mercado Pago'}
    </button>
  );

  if (syncing && status !== 'APPROVED') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-ink-200 bg-ink-50 p-4 sm:p-5">
        <Spinner className="size-5" />
        <p className="text-ink-700">Estamos confirmando tu pago con Mercado Pago…</p>
      </div>
    );
  }
  if (status === 'APPROVED') {
    return (
      <div className="flex gap-3 rounded-xl border border-leaf-500/30 bg-[#f4f9ea] p-4 animate-fade-in sm:gap-4 sm:p-5">
        <CheckCircle2 className="size-8 shrink-0 text-leaf-600" />
        <div>
          <p className="text-lg font-semibold text-ink-800">¡Pago aprobado, gracias por tu compra!</p>
          <p className="mt-1 text-ink-600">Ya estamos preparando tu pedido. Te vamos a contactar para coordinar la entrega o el retiro.</p>
        </div>
      </div>
    );
  }
  if (status === 'IN_PROCESS') {
    return (
      <div className="flex gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 sm:gap-4 sm:p-5">
        <Clock className="size-8 shrink-0 text-sky-600" />
        <div>
          <p className="text-lg font-semibold text-ink-800">Tu pago está en revisión</p>
          <p className="mt-1 text-ink-600">Mercado Pago lo está verificando. Te avisamos apenas se acredite; no hace falta que pagues de nuevo.</p>
        </div>
      </div>
    );
  }
  if (status === 'REJECTED' || status === 'CANCELLED') {
    return (
      <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:gap-4 sm:p-5">
        <AlertTriangle className="size-8 shrink-0 text-red-600" />
        <div>
          <p className="text-lg font-semibold text-ink-800">{status === 'REJECTED' ? 'El pago fue rechazado' : 'El pago se canceló'}</p>
          <p className="mt-1 text-ink-600">Tu pedido sigue reservado. Podés intentar de nuevo con otro medio de pago dentro de Mercado Pago.</p>
          {payButton}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:gap-4 sm:p-5">
      <Wallet className="size-8 shrink-0 text-amber-600" />
      <div>
        <p className="text-lg font-semibold text-ink-800">Tu pedido está reservado: falta el pago</p>
        <p className="mt-1 text-ink-600">Completá el pago con Mercado Pago para que empecemos a prepararlo. Si no se paga a tiempo, el pedido se cancela automáticamente.</p>
        {payButton}
      </div>
    </div>
  );
}
