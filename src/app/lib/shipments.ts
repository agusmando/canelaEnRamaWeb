import type { ShipmentMethod, ShipmentStatus } from '../api/types';

export const SHIPMENT_STATUS: Record<ShipmentStatus, { label: string; className: string; dot: string }> = {
  PENDING: { label: 'Pendiente', className: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500' },
  PREPARING: { label: 'En preparación', className: 'bg-sky-50 text-sky-700 ring-sky-200', dot: 'bg-sky-500' },
  READY_FOR_PICKUP: { label: 'Listo para retirar', className: 'bg-violet-50 text-violet-700 ring-violet-200', dot: 'bg-violet-500' },
  SHIPPED: { label: 'Despachado', className: 'bg-violet-50 text-violet-700 ring-violet-200', dot: 'bg-violet-500' },
  OUT_FOR_DELIVERY: { label: 'En reparto', className: 'bg-indigo-50 text-indigo-700 ring-indigo-200', dot: 'bg-indigo-500' },
  FAILED_ATTEMPT: { label: 'Intento fallido', className: 'bg-orange-50 text-orange-700 ring-orange-200', dot: 'bg-orange-500' },
  DELIVERED: { label: 'Entregado', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  RETURNED: { label: 'Devuelto', className: 'bg-ink-50 text-ink-600 ring-ink-200', dot: 'bg-ink-400' },
  CANCELLED: { label: 'Cancelado', className: 'bg-ink-50 text-ink-600 ring-ink-200', dot: 'bg-ink-400' },
};

export const SHIPMENT_METHOD: Record<ShipmentMethod, string> = {
  DELIVERY: 'Envío a domicilio',
  PICKUP: 'Retiro en el local',
};

export const shipmentStatusLabel = (s: string) => SHIPMENT_STATUS[s as ShipmentStatus]?.label ?? s;

/** Normaliza lo que escribe el usuario: sin espacios y en mayúsculas ("cer-7x4k" → "CER-7X4K"). */
export const normalizeTrackingCode = (code: string) => code.replace(/\s+/g, '').toUpperCase();

/** "Av. San Martín 1234, 2° B" */
export const addressLine = (a: { street: string; number: string; apartment?: string | null }) =>
  `${a.street} ${a.number}`.trim() + (a.apartment ? `, ${a.apartment}` : '');

/** "Barrio Bombal, Godoy Cruz, Mendoza" */
export const addressArea = (a: { city?: string | null; zone: string; province?: string | null }) =>
  [a.city, a.zone, a.province].filter(Boolean).join(', ');

/** "Llega en ~60 min" / "Llega en ~2 h" */
export function etaLabel(minutes: number | null | undefined) {
  if (!minutes || minutes <= 0) return null;
  if (minutes < 90) return `Llega en ~${Math.round(minutes)} min`;
  const h = Math.round((minutes / 60) * 2) / 2;
  return `Llega en ~${String(h).replace('.', ',')} h`;
}
