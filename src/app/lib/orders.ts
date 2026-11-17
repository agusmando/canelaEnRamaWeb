import type { Measure, Order, OrderItem, OrderItemStatus, OrderStatus, PaymentStatus, PaymentType } from '../api/types';
import { packLabel, stockUnit, toPriceUnits } from './shop';
import { formatNumber } from './utils';

export const ORDER_STATUS: Record<OrderStatus, { label: string; className: string; hint: string }> = {
  PENDING: { label: 'Pendiente', className: 'bg-amber-50 text-amber-700 ring-amber-200', hint: 'Recibimos tu pedido y estamos esperando la confirmación del pago.' },
  PROCESSING: { label: 'En preparación', className: 'bg-sky-50 text-sky-700 ring-sky-200', hint: 'Estamos preparando tu pedido.' },
  SHIPPED: { label: 'En camino', className: 'bg-violet-50 text-violet-700 ring-violet-200', hint: 'Tu pedido salió del local.' },
  DELIVERED: { label: 'Entregado', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200', hint: '¡Que lo disfrutes!' },
  CANCELLED: { label: 'Cancelado', className: 'bg-ink-50 text-ink-600 ring-ink-200', hint: 'El pedido fue cancelado y el stock repuesto.' },
};

/** En retiro por el local, "despachado" significa listo para retirar. */
const PICKUP_STATUS: Partial<typeof ORDER_STATUS> = {
  SHIPPED: { label: 'Listo para retirar', className: 'bg-violet-50 text-violet-700 ring-violet-200', hint: 'Ya podés pasar a retirarlo por el local.' },
  DELIVERED: { label: 'Retirado', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200', hint: '¡Que lo disfrutes!' },
};

/** Etiqueta del estado según cómo se entrega el pedido (pedidos viejos: retiro). */
export const orderStatusInfo = (status: OrderStatus, method?: string | null) =>
  ((method ?? 'PICKUP') === 'PICKUP' && PICKUP_STATUS[status]) || ORDER_STATUS[status];

export const orderMethod = (o: Pick<Order, 'shippingMethod' | 'shipment'>) => o.shippingMethod ?? o.shipment?.method ?? 'PICKUP';

export const ORDER_STEPS: OrderStatus[] = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export const ITEM_STATUS: Record<OrderItemStatus, string> = {
  FULFILLED: '',
  AWAITING_STOCK: 'Esperando stock',
  PARTIALLY_RETURNED: 'Cantidad ajustada',
  CANCELLED: 'Cancelado',
  RETURNED: 'Devuelto',
};

export const PAYMENT_OPTIONS: { value: PaymentType; label: string; hint: string }[] = [
  { value: 'MERCADOPAGO', label: 'Mercado Pago', hint: 'Pagás online con tarjeta de débito o crédito, dinero en cuenta o cuotas. Te llevamos a Mercado Pago al confirmar.' },
  { value: 'TRANSFER', label: 'Transferencia', hint: 'Te pasamos el CBU/alias al confirmar.' },
  { value: 'CASH', label: 'Efectivo', hint: 'Pagás al retirar o al recibir.' },
];

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pago pendiente', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  IN_PROCESS: { label: 'Pago en revisión', className: 'bg-sky-50 text-sky-700 ring-sky-200' },
  APPROVED: { label: 'Pagado', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  REJECTED: { label: 'Pago rechazado', className: 'bg-red-50 text-red-700 ring-red-200' },
  CANCELLED: { label: 'Pago cancelado', className: 'bg-ink-50 text-ink-600 ring-ink-200' },
  REFUNDED: { label: 'Pago devuelto', className: 'bg-ink-50 text-ink-600 ring-ink-200' },
  CHARGED_BACK: { label: 'Contracargo', className: 'bg-red-50 text-red-700 ring-red-200' },
};

/** Pedido de Mercado Pago que todavía se puede pagar (o reintentar). */
export const canPayOnline = (o: Pick<Order, 'paymentType' | 'status' | 'paymentStatus'>) =>
  o.paymentType === 'MERCADOPAGO' && o.status === 'PENDING' && !['APPROVED', 'IN_PROCESS'].includes(o.paymentStatus ?? 'PENDING');

// Pedidos viejos pueden tener DEBIT/CREDIT: ya no se ofrecen, pero se siguen mostrando.
const LEGACY_PAYMENT_LABEL: Record<string, string> = { DEBIT: 'Débito', CREDIT: 'Crédito' };
export const paymentLabel = (p: string) => PAYMENT_OPTIONS.find((o) => o.value === p)?.label ?? LEGACY_PAYMENT_LABEL[p] ?? p;

/** "2 × 500g" o "300 g". */
export function describeQty(qty: number, bulk: number | null | undefined, m?: Measure | string | null) {
  return bulk ? `${formatNumber(qty)} × ${packLabel(bulk, m)}` : `${formatNumber(qty)} ${stockUnit(m)}`;
}

export function itemTotal(it: OrderItem) {
  if (it.status === 'CANCELLED' || it.status === 'RETURNED') return 0;
  const units = it.selectedBulkOption ? it.quantity * it.selectedBulkOption : it.quantity;
  const priceUnits = toPriceUnits(units, it.productVariant?.contentMeasure);
  return Math.max(0, it.unitPriceSnapshot * priceUnits - (it.discountAppliedSnapshot || 0));
}

export const orderNumber = (id: number) => `#${String(id).padStart(5, '0')}`;

/** Lo que paga el cliente: `totalPrice` es solo productos, el envío va aparte. */
export const orderTotal = (o: Pick<Order, 'totalPrice' | 'shippingCost'>) => (Number(o.totalPrice) || 0) + (Number(o.shippingCost) || 0);
