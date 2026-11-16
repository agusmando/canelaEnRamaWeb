import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { AlertTriangle, ArrowLeft, ArrowRight, Banknote, Clock, CircleCheck, CreditCard, ImageOff, Landmark, Lock, MapPin, ShieldCheck, ShoppingBag, Store, Trash2, Truck, Wallet, X, type LucideIcon } from 'lucide-react';
import {
  useCartQuery,
  useCheckoutMutation,
  useCreatePaymentPreferenceMutation,
  useMyAddressQuery,
  usePaymentConfigQuery,
  useShippingConfigQuery,
  useShippingQuoteQuery,
  useUpdateCartMutation,
} from '../api/shopApi';
import type { CartItem, PaymentType, ShipmentMethod, ShippingConfig, ShippingQuote, UserAddress } from '../api/types';
import { getErrorMessage } from '../api/client';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { QtyStepper } from '../components/QtyStepper';
import { EmptyState, ErrorState, PageLoader, Spinner } from '../components/States';
import { AddressModal } from '../components/AddressForm';
import { useAppSelector, useCartKey } from '../store';
import { PAYMENT_OPTIONS } from '../lib/orders';
import { SHIPMENT_METHOD, addressArea, addressLine, etaLabel } from '../lib/shipments';
import { packLabel, stockUnit } from '../lib/shop';
import { cn, formatCurrency, formatNumber } from '../lib/utils';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { cld } from '../lib/cloudinary';

const PAYMENT_ICONS: Record<PaymentType, LucideIcon> = {
  MERCADOPAGO: Wallet,
  TRANSFER: Landmark,
  CASH: Banknote,
  DEBIT: CreditCard,
  CREDIT: CreditCard,
};

const METHOD_KEY = 'checkout.shippingMethod';

function readMethod(): ShipmentMethod {
  try {
    return sessionStorage.getItem(METHOD_KEY) === 'DELIVERY' ? 'DELIVERY' : 'PICKUP';
  } catch {
    return 'PICKUP';
  }
}

function storeMethod(m: ShipmentMethod) {
  try {
    sessionStorage.setItem(METHOD_KEY, m);
  } catch {
    /* sin storage: solo dura mientras está la página abierta */
  }
}

export default function Cart() {
  useDocumentTitle('Carrito', { noindex: true });
  const key = useCartKey();
  const authStatus = useAppSelector((s) => s.auth.status);
  const user = useAppSelector((s) => s.auth.user);
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
  // Líneas con un cambio de cantidad sin confirmar: el resumen se marca como desactualizado.
  const [busyLines, setBusyLines] = useState<Record<string, boolean>>({});
  const setLineBusy = useCallback((id: string, busy: boolean) => {
    setBusyLines((prev) => (!!prev[id] === busy ? prev : { ...prev, [id]: busy }));
  }, []);
  const syncing = Object.values(busyLines).some(Boolean);

  // ---- Entrega: retiro en el local o envío a domicilio
  const authed = authStatus === 'authenticated';
  const [shippingMethod, setShippingMethodState] = useState<ShipmentMethod>(readMethod);
  const setShippingMethod = (m: ShipmentMethod) => {
    setShippingMethodState(m);
    storeMethod(m);
  };
  const delivery = shippingMethod === 'DELIVERY';
  const [addressOpen, setAddressOpen] = useState(false);
  const closeAddress = useCallback(() => setAddressOpen(false), []);
  const { data: shippingConfig } = useShippingConfigQuery();
  const addressQuery = useMyAddressQuery(undefined, { skip: !authed || !delivery });
  const address = addressQuery.data;
  const productsTotal = cart?.summary.total ?? 0;
  const quoteQuery = useShippingQuoteQuery(productsTotal, { skip: !authed || !delivery || !address || !cart?.items.length });
  // `currentData`: solo la cotización del total actual (no la del total anterior).
  const quote = quoteQuery.currentData;
  const quoting = quoteQuery.isFetching;
  const shippingCost = !delivery ? 0 : quote?.available && !quoting ? Number(quote.price) || 0 : null;
  const deliveryReady = !delivery || (!!address && !!quote?.available && !quoting);

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
      const order = await checkout({ paymentType: payment, shippingMethod }).unwrap();
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
      if (delivery && address) quoteQuery.refetch();
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
                  onBusyChange={setLineBusy}
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
            <DeliveryCard
              method={shippingMethod}
              onMethod={setShippingMethod}
              config={shippingConfig}
              authed={authed}
              address={address}
              addressLoading={addressQuery.isLoading}
              addressError={addressQuery.error ? getErrorMessage(addressQuery.error) : null}
              quote={quote}
              quoting={quoting}
              quoteError={quoteQuery.error && !quoting ? getErrorMessage(quoteQuery.error) : null}
              onRetryQuote={() => quoteQuery.refetch()}
              onEditAddress={() => setAddressOpen(true)}
            />

            <div className="rounded-xl border border-ink-200 p-4 min-[375px]:p-5 sm:p-8">
              <h2 className="text-2xl font-semibold text-ink-800">Forma de pago</h2>
              <p className="mt-1 text-sm text-ink-500">Las ofertas y descuentos se aplican automáticamente.</p>
              {/* 2 columnas solo con ancho completo (tablet); en la columna lateral de 400px el texto no entra */}
              <div role="radiogroup" aria-label="Forma de pago" className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
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
                        o.value === 'MERCADOPAGO' && 'sm:col-span-2 lg:col-span-1',
                      )}
                    >
                      <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', selected ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-500')}>
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1 leading-tight break-words">{o.label}</span>
                      {selected && <CircleCheck className="size-4 shrink-0 text-brand-500" />}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-ink-500">{PAYMENT_OPTIONS.find((o) => o.value === payment)?.hint}</p>
            </div>

            <div className="rounded-xl border border-ink-200 p-4 min-[375px]:p-5 sm:p-8">
              <h2 className="text-2xl font-semibold text-ink-800">Resumen de la orden</h2>
              <dl className={cn('mt-6 space-y-4 text-[17px] transition-opacity', syncing && 'opacity-50')} aria-busy={syncing}>
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
                <div className="flex justify-between gap-4 text-ink-400">
                  <dt>Envío</dt>
                  <dd className={cn('tabular-nums', shippingCost === 0 && 'text-leaf-600')}>
                    {!delivery ? 'Sin cargo' : shippingCost === null ? (quoting ? <Spinner className="size-4" /> : '—') : shippingCost === 0 ? 'Gratis' : formatCurrency(shippingCost)}
                  </dd>
                </div>
                <div className="flex items-center justify-between border-t border-ink-200 pt-5">
                  <dt className="font-semibold text-ink-800">Total</dt>
                  <dd className="text-right">
                    <span className="block text-2xl font-bold text-ink-800 tabular-nums">{formatCurrency(productsTotal + (shippingCost ?? 0))}</span>
                    {shippingCost === null && <span className="block text-xs text-ink-500">+ envío</span>}
                  </dd>
                </div>
              </dl>
              <p aria-live="polite" className={cn('mt-2 flex items-center justify-end gap-1.5 text-xs text-ink-500', !syncing && 'invisible')}>
                <Spinner className="size-3.5" /> Actualizando precios…
              </p>

              {authStatus === 'authenticated' ? (
                <button onClick={finish} disabled={placing || redirecting || isFetching || syncing || !deliveryReady} className="btn-primary mt-6 h-13 w-full rounded-xl text-base sm:text-[17px]">
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
                {delivery
                  ? 'Te avisamos por WhatsApp cuando tu pedido salga para tu domicilio.'
                  : 'Te avisamos por WhatsApp cuando tu pedido esté listo para retirar.'}
              </p>
            </div>
          </aside>
        </div>
      )}
      {authed && <AddressModal open={addressOpen} onClose={closeAddress} defaultName={user?.name?.trim() ?? ''} />}
    </div>
  );
}

function OptionCard({
  selected,
  onSelect,
  icon: Icon,
  title,
  detail,
  aside,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: LucideIcon;
  title: string;
  detail?: string;
  aside?: string;
}) {
  return (
    <button
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-xl border px-3 py-3 text-left text-sm transition-all active:scale-[0.98]',
        selected ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500' : 'border-ink-200 text-ink-700 hover:border-ink-400',
      )}
    >
      <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', selected ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-500')}>
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className={cn('block', selected && 'font-medium')}>{title}</span>
        {detail && <span className="mt-0.5 block text-xs text-ink-500">{detail}</span>}
      </span>
      {aside && <span className={cn('shrink-0 text-xs font-medium', selected ? 'text-brand-700' : 'text-ink-500')}>{aside}</span>}
      {selected && <CircleCheck className="size-4 shrink-0 text-brand-500" />}
    </button>
  );
}

/** Tarjeta "Entrega": retiro sin cargo o envío a domicilio con cotización. */
function DeliveryCard({
  method,
  onMethod,
  config,
  authed,
  address,
  addressLoading,
  addressError,
  quote,
  quoting,
  quoteError,
  onRetryQuote,
  onEditAddress,
}: {
  method: ShipmentMethod;
  onMethod: (m: ShipmentMethod) => void;
  config: ShippingConfig | undefined;
  authed: boolean;
  address: UserAddress | null | undefined;
  addressLoading: boolean;
  addressError: string | null;
  quote: ShippingQuote | undefined;
  quoting: boolean;
  quoteError: string | null;
  onRetryQuote: () => void;
  onEditAddress: () => void;
}) {
  const delivery = method === 'DELIVERY';
  const noCoverage = !!config && config.zones.length === 0 && !config.providers.uber;

  return (
    <div className="rounded-xl border border-ink-200 p-4 min-[375px]:p-5 sm:p-8">
      <h2 className="text-2xl font-semibold text-ink-800">Entrega</h2>
      <div role="radiogroup" aria-label="Forma de entrega" className="mt-5 grid grid-cols-1 gap-2">
        <OptionCard
          selected={!delivery}
          onSelect={() => onMethod('PICKUP')}
          icon={Store}
          title={SHIPMENT_METHOD.PICKUP}
          detail={config?.pickup.address}
          aside="Sin cargo"
        />
        <OptionCard selected={delivery} onSelect={() => onMethod('DELIVERY')} icon={Truck} title={SHIPMENT_METHOD.DELIVERY} detail="Te lo llevamos a tu casa" />
      </div>

      {delivery && (
        <div className="mt-4 text-sm" aria-live="polite">
          {!authed ? (
            <p className="flex items-start gap-2 rounded-lg bg-ink-50 p-3 text-ink-600">
              <Lock className="mt-0.5 size-4 shrink-0 text-ink-400" />
              <span>
                Iniciá sesión para cargar tu domicilio y calcular el envío.
                {noCoverage && ' Por ahora no estamos haciendo envíos: podés retirar tu pedido en el local.'}
              </span>
            </p>
          ) : addressLoading ? (
            <p className="flex items-center gap-2 text-ink-500">
              <Spinner className="size-4" /> Buscando tu domicilio…
            </p>
          ) : addressError ? (
            <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
              No pudimos cargar tu domicilio: {addressError}
            </p>
          ) : !address ? (
            <div className="rounded-lg border border-dashed border-ink-300 p-4">
              <p className="flex items-start gap-2 text-ink-700">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand-500" />
                Cargá tu domicilio para calcular el costo del envío.
              </p>
              {noCoverage && <p className="mt-2 text-ink-500">Por ahora no estamos haciendo envíos: podés retirar tu pedido en el local.</p>}
              <button type="button" onClick={onEditAddress} className="btn-outline mt-3 h-10 w-full px-4 text-sm sm:w-auto">
                <MapPin className="size-4" /> Cargar mi domicilio
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg bg-ink-50 p-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand-500" />
                <div className="min-w-0 flex-1 text-ink-700">
                  <p className="font-medium break-words text-ink-800">{addressLine(address)}</p>
                  <p className="break-words">{addressArea(address)}</p>
                  <p className="break-words text-ink-500">
                    Recibe {address.recipientName} · {address.phone}
                  </p>
                </div>
                <button type="button" onClick={onEditAddress} className="btn-ghost -my-1 -mr-1 h-9 shrink-0 px-2.5 text-sm text-brand-500 hover:bg-brand-50 hover:text-brand-600" aria-label="Cambiar domicilio">
                  Cambiar
                </button>
              </div>
              {quoting && !quote ? (
                <p className="flex items-center gap-2 text-ink-500">
                  <Spinner className="size-4" /> Calculando el envío…
                </p>
              ) : quoteError ? (
                <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
                  <span>No pudimos calcular el envío. {quoteError}</span>
                  <button type="button" onClick={onRetryQuote} className="btn-ghost h-8 px-2 text-sm text-amber-900 hover:bg-amber-100">
                    Reintentar
                  </button>
                </div>
              ) : quote && !quote.available ? (
                <p role="alert" className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  {quote.reason || 'Por ahora no podemos enviar a tu domicilio. Podés retirar tu pedido en el local.'}
                </p>
              ) : quote ? (
                <p className={cn('flex flex-wrap items-center justify-between gap-x-4 gap-y-1 transition-opacity', quoting && 'opacity-50')}>
                  <span className="font-medium text-ink-800">
                    Envío: <span className={cn('tabular-nums', Number(quote.price) === 0 && 'text-leaf-600')}>{Number(quote.price) === 0 ? 'Gratis' : formatCurrency(quote.price)}</span>
                  </span>
                  {etaLabel(quote.etaMinutes) && (
                    <span className="inline-flex items-center gap-1 text-ink-500">
                      <Clock className="size-3.5" /> {etaLabel(quote.etaMinutes)}
                    </span>
                  )}
                </p>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Espera tras el último clic antes de mandar la cantidad (varios clics = 1 request). */
const QTY_DEBOUNCE_MS = 450;

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

function offerHintText(hint: NonNullable<CartItem['quote']['offerHint']>) {
  const n = hint.missing;
  const amount =
    hint.unit === 'pack'
      ? `${formatNumber(n)} ${plural(n, 'paquete', 'paquetes')}`
      : hint.unit === 'unit'
        ? `${formatNumber(n)} ${plural(n, 'unidad', 'unidades')}`
        : n < 1
          ? `${formatNumber(Math.round(n * 1000))} g`
          : `${formatNumber(n)} kg`;
  return `Sumá ${amount} más y aprovechá ${hint.label}`;
}

function CartLine({
  item,
  onQty,
  onRemove,
  onBusyChange,
}: {
  item: CartItem;
  onQty: (q: number) => Promise<void>;
  onRemove: () => void;
  onBusyChange: (id: string, busy: boolean) => void;
}) {
  const v = item.productVariant;
  const lineId = `${item.productVariantId}-${item.selectedBulkOption}`;
  const img = v.images?.[0]?.secure_url;
  const productName = v.product?.name ?? v.name;
  const loose = !item.selectedBulkOption;
  const weight = v.contentMeasure === 'KG' || v.contentMeasure === 'G';
  const step = loose && weight ? 50 : 1;
  const stock = Number(v.currentStock) || 0;
  const productId = v.product?.id ?? v.productId;

  // Cantidad elegida que todavía no confirmó el servidor (se muestra al instante).
  const [draft, setDraft] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const latest = useRef<number | null>(null);
  const onQtyRef = useRef(onQty);
  onQtyRef.current = onQty;

  const busy = draft !== null || saving;
  useEffect(() => onBusyChange(lineId, busy), [lineId, busy, onBusyChange]);

  const send = useCallback(async (q: number) => {
    timer.current = undefined;
    setSaving(true);
    try {
      await onQtyRef.current(q);
    } finally {
      // Si mientras tanto se eligió otra cantidad, esa sigue pendiente.
      if (latest.current === q) {
        latest.current = null;
        setDraft(null);
      }
      setSaving(false);
    }
  }, []);

  const change = (q: number) => {
    latest.current = q;
    setDraft(q);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => send(q), QTY_DEBOUNCE_MS);
  };

  // Al salir de la página no se pierde el último cambio.
  useEffect(
    () => () => {
      if (timer.current !== undefined && latest.current !== null) {
        window.clearTimeout(timer.current);
        onQtyRef.current(latest.current);
      }
      onBusyChange(lineId, false);
    },
    [lineId, onBusyChange],
  );

  const qty = draft ?? item.quantity;
  const max = loose ? Math.max(stock, qty) : Math.max(Math.floor(stock / item.selectedBulkOption), qty);
  const hint = !busy ? item.quote.offerHint : null;

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
        {img ? <img src={cld(img, { w: 200, h: 200 })} alt="" width={100} height={100} loading="lazy" decoding="async" className="size-full object-cover" /> : <ImageOff className="size-7" />}
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
              <span className="text-ink-800">{loose ? `${formatNumber(qty)} ${stockUnit(v.contentMeasure)}` : packLabel(item.selectedBulkOption, v.contentMeasure)}</span>
            </span>
          </p>
          {!busy && item.quote.offerType && item.quote.discount > 0 && (
            <p className="mt-1 text-sm font-medium text-leaf-600">Oferta {item.quote.offerType} aplicada</p>
          )}
          {hint && <p className="mt-1 text-sm font-medium text-brand-600">{offerHintText(hint)}</p>}
          {(!item.available || !item.enoughStock) && !busy && (
            <p className="mt-1 text-sm text-amber-700">{item.available ? `Stock disponible: ${formatNumber(stock)} ${stockUnit(v.contentMeasure)}` : 'Sin stock'}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:flex-col sm:flex-nowrap sm:items-end sm:gap-2">
          <p
            aria-busy={busy}
            className={cn('flex items-center gap-2 text-xl font-medium whitespace-nowrap text-ink-800 tabular-nums transition-opacity sm:text-[22px]', busy && 'opacity-40')}
          >
            {busy && <Spinner className="size-4 text-ink-400" />}
            {item.quote.discount > 0 && <span className="text-sm font-normal text-ink-400 line-through">{formatCurrency(item.quote.total + item.quote.discount)}</span>}
            {formatCurrency(item.quote.total)}
          </p>
          <QtyStepper size="sm" value={qty} min={step} step={step} max={max} unit={loose && weight ? 'g' : undefined} onChange={change} onRemove={onRemove} />
        </div>
      </div>
    </li>
  );
}
