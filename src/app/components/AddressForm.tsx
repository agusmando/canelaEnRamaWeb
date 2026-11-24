import { useEffect, useId, useState, type ReactNode } from 'react';
import { MapPin, X } from 'lucide-react';
import { useMyAddressQuery, useSaveAddressMutation, useShippingConfigQuery } from '../api/shopApi';
import type { UserAddress, UserAddressInput } from '../api/types';
import { getErrorMessage } from '../api/client';
import { FormError } from './Field';
import { Spinner } from './States';
import { cn } from '../lib/utils';
import { ActionButton } from './ActionButton';
import { showError, showSuccess } from '../lib/notifications';

type Values = Required<UserAddressInput>;
type Key = keyof Values;

const EMPTY: Values = { recipientName: '', phone: '', street: '', number: '', apartment: '', zone: '', city: '', postalCode: '', notes: '' };

const fromAddress = (a: UserAddress | null | undefined, fallbackName = ''): Values =>
  a
    ? {
        recipientName: a.recipientName ?? '',
        phone: a.phone ?? '',
        street: a.street ?? '',
        number: a.number ?? '',
        apartment: a.apartment ?? '',
        zone: a.zone ?? '',
        city: a.city ?? '',
        postalCode: a.postalCode ?? '',
        notes: a.notes ?? '',
      }
    : { ...EMPTY, recipientName: fallbackName };

const REQUIRED: { key: Key; message: string }[] = [
  { key: 'recipientName', message: 'Indicá quién recibe el pedido.' },
  { key: 'phone', message: 'Ingresá un teléfono de contacto.' },
  { key: 'street', message: 'Ingresá la calle.' },
  { key: 'number', message: 'Ingresá la altura.' },
  { key: 'zone', message: 'Elegí el departamento.' },
];

/** Opcionales vacíos no se mandan; los obligatorios van sin espacios de más. */
function toInput(v: Values): UserAddressInput {
  const out: Record<string, string> = {};
  (Object.keys(v) as Key[]).forEach((k) => {
    const val = v[k].trim();
    if (val || REQUIRED.some((r) => r.key === k)) out[k] = val;
  });
  return out as unknown as UserAddressInput;
}

interface Props {
  /** Nombre sugerido para "Quién recibe" si todavía no hay domicilio. */
  defaultName?: string;
  submitLabel?: string;
  onSaved?: (a: UserAddress) => void;
  onCancel?: () => void;
  /** Foco en el primer campo al montarse (modal). */
  autoFocus?: boolean;
}

/** Formulario "Mi domicilio": se precarga con el guardado y hace `PUT /shipping/address`. */
export function AddressForm({ defaultName, submitLabel = 'Guardar domicilio', onSaved, onCancel, autoFocus }: Props) {
  const { data: address, isLoading: loadingAddress } = useMyAddressQuery();
  const { data: config, isLoading: loadingConfig } = useShippingConfigQuery();
  const [save, { isLoading: saving }] = useSaveAddressMutation();
  const [values, setValues] = useState<Values>(() => fromAddress(address, defaultName));
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(address !== undefined);
  const formId = useFormId();

  // Cuando llega el domicilio guardado, se precarga una sola vez.
  useEffect(() => {
    if (prefilled || address === undefined) return;
    setValues(fromAddress(address, defaultName));
    setPrefilled(true);
  }, [address, prefilled, defaultName]);

  if (loadingAddress || loadingConfig) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const departments = config?.departments ?? [];
  // Un departamento guardado que ya no existe se sigue mostrando para no perderlo en silencio.
  const zoneOptions = values.zone && !departments.includes(values.zone) ? [values.zone, ...departments] : departments;

  const set = (k: Key) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = e.target.value;
    setValues((v) => ({ ...v, [k]: val }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const next: Partial<Record<Key, string>> = {};
    for (const r of REQUIRED) if (!values[r.key].trim()) next[r.key] = r.message;
    if (values.phone.trim() && values.phone.replace(/\D/g, '').length < 6) next.phone = 'Revisá el teléfono.';
    setErrors(next);
    const firstInvalid = REQUIRED.find((r) => next[r.key])?.key;
    if (firstInvalid) {
      document.getElementById(`${formId}-${firstInvalid}`)?.focus();
      return;
    }
    try {
      const saved = await save(toInput(values)).unwrap();
      showSuccess('Guardamos tu domicilio');
      onSaved?.(saved);
    } catch (err) {
      setFormError(getErrorMessage(err));
      showError(getErrorMessage(err));
    }
  };

  const field = (k: Key) => ({
    id: `${formId}-${k}`,
    name: k,
    value: values[k],
    onChange: set(k),
    'aria-invalid': !!errors[k] || undefined,
    'aria-describedby': errors[k] ? `${formId}-${k}-error` : undefined,
    className: cn('field h-12 text-base', errors[k] && 'border-brand-500'),
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <p className="text-xs text-ink-500">
        Los campos con <span className="text-brand-500">*</span> son obligatorios.
      </p>
      <FormError message={formError} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Row label="Quién recibe" htmlFor={`${formId}-recipientName`} error={errors.recipientName} errorId={`${formId}-recipientName-error`} required>
          <input {...field('recipientName')} autoComplete="name" autoFocus={autoFocus} placeholder="Nombre y apellido" />
        </Row>
        <Row label="Teléfono" htmlFor={`${formId}-phone`} error={errors.phone} errorId={`${formId}-phone-error`} required>
          <input {...field('phone')} type="tel" inputMode="tel" autoComplete="tel" placeholder="261 555-1234" />
        </Row>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-4 sm:grid-cols-[minmax(0,1fr)_8rem_9rem]">
        <Row label="Calle" htmlFor={`${formId}-street`} error={errors.street} errorId={`${formId}-street-error`} required>
          <input {...field('street')} autoComplete="address-line1" placeholder="Av. San Martín" />
        </Row>
        <Row label="Número" htmlFor={`${formId}-number`} error={errors.number} errorId={`${formId}-number-error`} required>
          <input {...field('number')} inputMode="numeric" placeholder="1234" />
        </Row>
        <Row label="Piso / depto" htmlFor={`${formId}-apartment`} className="col-span-2 sm:col-span-1" optional>
          <input {...field('apartment')} autoComplete="address-line2" placeholder="2° B" />
        </Row>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Row label="Departamento" htmlFor={`${formId}-zone`} error={errors.zone} errorId={`${formId}-zone-error`} required>
          <select {...field('zone')} className={cn(field('zone').className, !values.zone && 'text-ink-400')}>
            <option value="" disabled>
              Elegí tu departamento
            </option>
            {zoneOptions.map((d) => (
              <option key={d} value={d} className="text-ink-800">
                {d}
              </option>
            ))}
          </select>
        </Row>
        <Row label="Localidad / barrio" htmlFor={`${formId}-city`} optional>
          <input {...field('city')} autoComplete="address-level3" placeholder="Barrio Bombal" />
        </Row>
      </div>
      <div className="grid gap-4 sm:grid-cols-[9rem_minmax(0,1fr)]">
        <Row label="Código postal" htmlFor={`${formId}-postalCode`} optional>
          <input {...field('postalCode')} autoComplete="postal-code" inputMode="numeric" placeholder="5501" />
        </Row>
        <Row label="Indicaciones para el repartidor" htmlFor={`${formId}-notes`} optional>
          <input {...field('notes')} placeholder="Portón verde, tocar timbre" maxLength={300} />
        </Row>
      </div>
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost h-12 px-5">
            Cancelar
          </button>
        )}
        <ActionButton type="submit" loading={saving} loadingLabel="Guardando domicilio…" className="btn-primary h-12 px-6 text-base">
          {submitLabel}
        </ActionButton>
      </div>
    </form>
  );
}

const useFormId = () => useId().replace(/:/g, '');

function Row({
  label,
  htmlFor,
  error,
  errorId,
  required,
  optional,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  errorId?: string;
  required?: boolean;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      {/* Una sola línea: así los inputs de una misma fila quedan alineados */}
      <label htmlFor={htmlFor} className="mb-1.5 block truncate text-sm font-medium text-ink-700" title={label}>
        {label}
        {required && (
          <span aria-hidden className="text-brand-500">
            {' '}*
          </span>
        )}
        {optional && <span className="sr-only"> (opcional)</span>}
      </label>
      {children}
      {error && (
        <p id={errorId} className="mt-1 text-sm text-brand-600">
          {error}
        </p>
      )}
    </div>
  );
}

/** El mismo formulario en un modal (checkout): se carga el domicilio sin salir del carrito. */
export function AddressModal({ open, onClose, defaultName }: { open: boolean; onClose: () => void; defaultName?: string }) {
  const titleId = useFormId();
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', esc);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="absolute inset-0 bg-ink-900/40 animate-fade-in" onClick={onClose} />
      <div className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col rounded-t-2xl bg-white shadow-2xl animate-fade-in sm:rounded-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-4 py-3 sm:px-6 sm:py-4">
          <h2 id={titleId} className="flex items-center gap-2 text-lg font-semibold text-ink-800 sm:text-xl">
            <MapPin className="size-5 text-brand-500" /> Mi domicilio
          </h2>
          <button onClick={onClose} aria-label="Cerrar" className="btn-icon">
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-6">
          <AddressForm defaultName={defaultName} onSaved={onClose} onCancel={onClose} submitLabel="Guardar y usar" autoFocus />
        </div>
      </div>
    </div>
  );
}
