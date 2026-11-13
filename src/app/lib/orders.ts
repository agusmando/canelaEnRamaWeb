import type { Measure, OrderItem, OrderItemStatus, OrderStatus, PaymentType } from '../api/types';
import { packLabel, stockUnit, toPriceUnits } from './shop';
import { formatNumber } from './utils';

export const ORDER_STATUS: Record<OrderStatus, { label: string; className: string; hint: string }> = {
  PENDING: { label: 'Pendiente', className: 'bg-amber-50 text-amber-700 ring-amber-200', hint: 'Recibimos tu pedido y estamos esperando la confirmación del pago.' },
  PROCESSING: { label: 'En preparación', className: 'bg-sky-50 text-sky-700 ring-sky-200', hint: 'Estamos preparando tu pedido.' },
  SHIPPED: { label: 'En camino', className: 'bg-violet-50 text-violet-700 ring-violet-200', hint: 'Tu pedido salió del local.' },
  DELIVERED: { label: 'Entregado', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200', hint: '¡Que lo disfrutes!' },
  CANCELLED: { label: 'Cancelado', className: 'bg-ink-50 text-ink-600 ring-ink-200', hint: 'El pedido fue cancelado y el stock repuesto.' },
};

export const ORDER_STEPS: OrderStatus[] = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export const ITEM_STATUS: Record<OrderItemStatus, string> = {
  FULFILLED: '',
  AWAITING_STOCK: 'Esperando stock',
  PARTIALLY_RETURNED: 'Cantidad ajustada',
  CANCELLED: 'Cancelado',
  RETURNED: 'Devuelto',
};

export const PAYMENT_OPTIONS: { value: PaymentType; label: string; hint: string }[] = [
  { value: 'MERCADOPAGO', label: 'Mercado Pago', hint: 'Te enviamos el link de pago.' },
  { value: 'TRANSFER', label: 'Transferencia', hint: 'Te pasamos el CBU/alias al confirmar.' },
  { value: 'CASH', label: 'Efectivo', hint: 'Pagás al retirar o al recibir.' },
  { value: 'DEBIT', label: 'Débito', hint: 'Con tarjeta al retirar o al recibir.' },
  { value: 'CREDIT', label: 'Crédito', hint: 'Con tarjeta al retirar o al recibir.' },
];

export const paymentLabel = (p: string) => PAYMENT_OPTIONS.find((o) => o.value === p)?.label ?? p;

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
