import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { CalendarClock, Check, Copy, ExternalLink, MapPin, PackageSearch, Store, Truck } from 'lucide-react';
import type { PublicTracking, Shipment, ShipmentEvent, ShipmentStatus } from '../api/types';
import { SHIPMENT_METHOD, SHIPMENT_STATUS } from '../lib/shipments';
import { cn, formatDate, formatDateTime } from '../lib/utils';

export function ShipmentStatusBadge({ status, className }: { status: ShipmentStatus; className?: string }) {
  const s = SHIPMENT_STATUS[status] ?? { label: status, className: 'bg-ink-50 text-ink-600 ring-ink-200' };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', s.className, className)}>{s.label}</span>
  );
}

/** Chip compacto para listados (p. ej. "Mis pedidos"). */
export function ShipmentChip({ status }: { status: ShipmentStatus }) {
  const s = SHIPMENT_STATUS[status];
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-ink-50 px-2 py-0.5 text-xs text-ink-600 ring-1 ring-ink-200 ring-inset">
      <Truck className="size-3" aria-hidden />
      <span className="sr-only">Envío: </span>
      {s?.label ?? status}
    </span>
  );
}

export function CopyButton({ value, label = 'Copiar código' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Código copiado');
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error('No se pudo copiar. Seleccioná el código y copialo a mano.');
    }
  };
  return (
    <button type="button" onClick={copy} aria-label={label} title={label} className="btn-icon size-9 border border-ink-200 bg-white">
      {copied ? <Check className="size-4 text-leaf-600" strokeWidth={3} /> : <Copy className="size-4" />}
    </button>
  );
}

/** Línea de tiempo del envío, del evento más nuevo al más viejo. */
export function ShipmentTimeline({ events }: { events: ShipmentEvent[] }) {
  const sorted = [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() || b.id - a.id);
  if (!sorted.length) return <p className="text-sm text-ink-500">Todavía no hay movimientos.</p>;
  return (
    <ol className="relative" aria-label="Historial del envío">
      {sorted.map((e, idx) => {
        const s = SHIPMENT_STATUS[e.status];
        const latest = idx === 0;
        return (
          <li key={e.id} className="relative flex gap-4 pb-6 last:pb-0">
            {idx < sorted.length - 1 && <span aria-hidden className="absolute top-4 bottom-0 left-[7px] w-0.5 bg-ink-200" />}
            <span
              aria-hidden
              className={cn(
                'relative z-10 mt-1 size-4 shrink-0 rounded-full ring-4',
                latest ? cn(s?.dot ?? 'bg-brand-500', 'ring-brand-100') : 'bg-ink-300 ring-white',
              )}
            />
            <div className="min-w-0">
              <p className={cn('font-medium', latest ? 'text-ink-800' : 'text-ink-600')}>{s?.label ?? e.status}</p>
              {e.description && <p className="mt-0.5 text-sm text-ink-600">{e.description}</p>}
              <p className="mt-0.5 text-xs text-ink-500">
                <time dateTime={e.createdAt}>{formatDateTime(e.createdAt)}</time>
                {e.location && <> · {e.location}</>}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

type TrackingData = PublicTracking | Shipment;

/**
 * Detalle del envío: estado, método, transporte, fecha estimada, código y eventos.
 * Con un `Shipment` (dueño del pedido) también muestra la dirección de entrega.
 */
export function ShipmentDetails({ data, title = 'Seguimiento del envío', headingLevel = 2 }: { data: TrackingData; title?: string; headingLevel?: 1 | 2 }) {
  const H = headingLevel === 1 ? 'h1' : 'h2';
  const isPickup = data.method === 'PICKUP';
  const finished = data.status === 'DELIVERED' || data.status === 'RETURNED' || data.status === 'CANCELLED';
  const full = 'address' in data ? data : null;
  const address = full && !isPickup ? [full.address, full.city, full.province, full.postalCode].filter(Boolean).join(', ') : null;

  return (
    <section aria-label={title} className="rounded-xl border border-ink-200">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 p-4 sm:p-5">
        <H className="flex items-center gap-2 text-lg font-semibold text-ink-800">
          {isPickup ? <Store className="size-5 text-brand-500" /> : <Truck className="size-5 text-brand-500" />} {title}
        </H>
        <ShipmentStatusBadge status={data.status} className="text-sm" />
      </div>

      <div className="grid gap-6 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <dl className="space-y-4 text-sm">
          <Info label="Método">{SHIPMENT_METHOD[data.method] ?? data.method}</Info>
          <Info label="Código de seguimiento">
            <span className="inline-flex max-w-full items-center gap-2">
              <code className="min-w-0 rounded bg-ink-50 px-2 py-1 font-mono text-[15px] font-semibold tracking-wide break-all text-ink-800">{data.trackingCode}</code>
              <CopyButton value={data.trackingCode} />
            </span>
          </Info>
          {(data.carrier || data.carrierTrackingCode) && (
            <Info label="Transporte">
              {data.carrier ?? 'Transporte'}
              {data.carrierTrackingCode && (
                <>
                  {' · '}
                  {data.carrierTrackingUrl ? (
                    <a
                      href={data.carrierTrackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-brand-500 hover:underline"
                    >
                      {data.carrierTrackingCode} <ExternalLink className="size-3.5" />
                      <span className="sr-only">(se abre en otra pestaña)</span>
                    </a>
                  ) : (
                    <span className="font-mono">{data.carrierTrackingCode}</span>
                  )}
                </>
              )}
              {!data.carrierTrackingCode && data.carrierTrackingUrl && (
                <a href={data.carrierTrackingUrl} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-1 font-medium text-brand-500 hover:underline">
                  Seguir en el transporte <ExternalLink className="size-3.5" />
                </a>
              )}
            </Info>
          )}
          {data.deliveredAt && data.status === 'DELIVERED' ? (
            <Info label={isPickup ? 'Retirado el' : 'Entregado el'} icon={<CalendarClock className="size-4 text-leaf-600" />}>
              {formatDate(data.deliveredAt)}
            </Info>
          ) : (
            data.estimatedDeliveryAt &&
            !finished && (
              <Info label={isPickup ? 'Listo para retirar (estimado)' : 'Entrega estimada'} icon={<CalendarClock className="size-4 text-brand-500" />}>
                {formatDate(data.estimatedDeliveryAt)}
              </Info>
            )
          )}
          {address ? (
            <Info label="Dirección de entrega" icon={<MapPin className="size-4 text-brand-500" />}>
              {full?.recipientName && <span className="block">{full.recipientName}</span>}
              {address}
            </Info>
          ) : (
            !isPickup &&
            data.city && (
              <Info label="Destino" icon={<MapPin className="size-4 text-brand-500" />}>
                {data.city}
              </Info>
            )
          )}
        </dl>

        <div>
          <h3 className="mb-4 text-sm font-semibold tracking-wide text-ink-500 uppercase">Movimientos</h3>
          <ShipmentTimeline events={data.events ?? []} />
        </div>
      </div>
    </section>
  );
}

function Info({ label, icon, children }: { label: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-ink-500">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 break-words text-ink-800">{children}</dd>
    </div>
  );
}

/** Llamado a la acción hacia /seguimiento. */
export function TrackShipmentCta({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col items-start gap-4 rounded-xl bg-brand-50 p-6 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-brand-500 shadow-card">
          <PackageSearch className="size-5" />
        </span>
        <div>
          <p className="text-lg font-semibold text-ink-800">Seguí tu envío</p>
          <p className="text-ink-600">Ingresá el código de seguimiento que te enviamos y mirá en qué etapa está tu pedido.</p>
        </div>
      </div>
      <Link to="/seguimiento" className="btn-primary h-11 shrink-0 px-5">
        Seguir mi envío
      </Link>
    </div>
  );
}
