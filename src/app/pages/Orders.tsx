import { useState } from 'react';
import { Link } from 'react-router';
import { ChevronLeft, ChevronRight, ChevronRight as Chevron, Package } from 'lucide-react';
import { useMyOrdersQuery } from '../api/shopApi';
import type { Order } from '../api/types';
import { getErrorMessage } from '../api/client';
import { EmptyState, ErrorState } from '../components/States';
import { ShipmentChip } from '../components/ShipmentTracking';
import { ORDER_STATUS, PAYMENT_STATUS, canPayOnline, orderNumber, orderTotal, paymentLabel } from '../lib/orders';
import { SHIPMENT_METHOD } from '../lib/shipments';
import { cn, formatCurrency, formatDateTime } from '../lib/utils';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function StatusBadge({ status }: { status: Order['status'] }) {
  const s = ORDER_STATUS[status] ?? { label: status, className: 'bg-ink-50 text-ink-600 ring-ink-200' };
  return <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', s.className)}>{s.label}</span>;
}

export function OrderRow({ order }: { order: Order }) {
  const thumbs = (order.orderItems ?? []).map((i) => i.productVariant?.images?.[0]?.secure_url).filter(Boolean).slice(0, 3) as string[];
  const count = order.orderItems?.length ?? order.totalItems;
  const saved = (order.orderItems ?? []).reduce(
    (n, i) => n + (i.status === 'CANCELLED' || i.status === 'RETURNED' ? 0 : i.discountAppliedSnapshot || 0),
    0,
  );
  return (
    <li>
      <Link to={`/mi-cuenta/pedidos/${order.id}`} className="group flex items-center gap-3 rounded-xl border border-ink-200 p-3.5 transition-colors sm:gap-4 sm:p-4 hover:border-ink-300 hover:bg-ink-50/50">
        <div className="hidden -space-x-3 sm:flex">
          {thumbs.length ? (
            thumbs.map((t) => <img key={t} src={t} alt="" className="size-12 rounded-full border-2 border-white object-cover" />)
          ) : (
            <span className="flex size-12 items-center justify-center rounded-full bg-brand-100 text-brand-500">
              <Package className="size-5" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ink-800">Pedido {orderNumber(order.id)}</span>
            <StatusBadge status={order.status} />
            {order.shipment && <ShipmentChip status={order.shipment.status} />}
            {order.paymentType === 'MERCADOPAGO' && order.paymentStatus && order.status !== 'CANCELLED' && (canPayOnline(order) || order.paymentStatus === 'IN_PROCESS') && (
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${PAYMENT_STATUS[order.paymentStatus].className}`}>
                {PAYMENT_STATUS[order.paymentStatus].label}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-ink-500">
            {formatDateTime(order.createdAt)} · {count} producto{count === 1 ? '' : 's'} · {paymentLabel(order.paymentType)}
            {order.shippingMethod === 'DELIVERY' && <> · {SHIPMENT_METHOD.DELIVERY}</>}
          </p>
        </div>
        <span className="flex shrink-0 flex-col items-end text-right">
          <span className="text-base font-semibold whitespace-nowrap text-ink-800 tabular-nums sm:text-lg">{formatCurrency(orderTotal(order))}</span>
          {saved > 0 && <span className="text-xs font-medium text-leaf-600">Ahorraste {formatCurrency(saved)}</span>}
        </span>
        <Chevron className="size-5 shrink-0 text-ink-400 group-hover:text-brand-500" />
      </Link>
    </li>
  );
}

export default function Orders() {
  useDocumentTitle('Mis pedidos');
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, error, refetch } = useMyOrdersQuery({ page });

  return (
    <section>
      <h1 className="mb-6 text-2xl font-semibold text-ink-800">Mis pedidos</h1>
      {error ? (
        <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
      ) : isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-24" />
          ))}
        </div>
      ) : !data?.content.length ? (
        <EmptyState
          icon={<Package className="size-7" />}
          title="Todavía no hiciste pedidos"
          action={
            <Link to="/productos" className="btn-primary h-11 px-6">
              Ver productos
            </Link>
          }
        />
      ) : (
        <>
          <ul className={cn('space-y-3', isFetching && 'opacity-70')}>
            {data.content.map((o) => (
              <OrderRow key={o.id} order={o} />
            ))}
          </ul>
          {data.pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4 text-sm">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary size-9 rounded-full p-0" aria-label="Página anterior">
                <ChevronLeft className="size-4" />
              </button>
              <span>
                Página {page} de {data.pagination.totalPages}
              </span>
              <button disabled={page >= data.pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="btn-secondary size-9 rounded-full p-0" aria-label="Página siguiente">
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
