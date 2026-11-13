import { useEffect, useState } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Texto a mostrar en vez del número (p. ej. "300 g"). */
  display?: string;
  /** Sufijo del campo editable (p. ej. "g"). Si se pasa, el número se puede escribir. */
  unit?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
  label?: string;
  /** Muestra un tacho en vez del "−" cuando está en el mínimo (carrito). */
  onRemove?: () => void;
}

export function QtyStepper({
  value,
  onChange,
  min = 1,
  max = Infinity,
  step = 1,
  display,
  unit,
  size = 'md',
  disabled,
  label = 'Cantidad',
  onRemove,
}: Props) {
  const sm = size === 'sm';
  const btn = cn(
    'flex items-center justify-center rounded-full text-ink-700 transition-all hover:bg-white hover:text-brand-500 hover:shadow-sm active:scale-90 disabled:pointer-events-none disabled:opacity-30',
    sm ? 'size-7' : 'size-10',
  );
  const atMin = value - step < min;
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n / step) * step || min));

  return (
    <div
      role="group"
      aria-label={label}
      className={cn('inline-flex items-center gap-1 rounded-full bg-ink-100 p-1', disabled && 'opacity-60')}
    >
      {onRemove && atMin ? (
        <button type="button" className={cn(btn, 'hover:text-brand-600')} aria-label="Quitar" disabled={disabled} onClick={onRemove}>
          <Trash2 className={sm ? 'size-3.5' : 'size-4'} />
        </button>
      ) : (
        <button type="button" className={btn} aria-label="Restar" disabled={disabled || atMin} onClick={() => onChange(Math.max(min, value - step))}>
          <Minus className={sm ? 'size-3.5' : 'size-4'} strokeWidth={2.5} />
        </button>
      )}
      {unit ? (
        <EditableValue value={value} unit={unit} sm={sm} disabled={disabled} onCommit={(n) => onChange(clamp(n))} label={label} />
      ) : (
        <span className={cn('min-w-8 px-1 text-center font-semibold text-ink-800 tabular-nums', sm ? 'text-sm' : 'text-base')} aria-live="polite">
          {display ?? value}
        </span>
      )}
      <button type="button" className={btn} aria-label="Sumar" disabled={disabled || value + step > max} onClick={() => onChange(Math.min(max, value + step))}>
        <Plus className={sm ? 'size-3.5' : 'size-4'} strokeWidth={2.5} />
      </button>
    </div>
  );
}

function EditableValue({
  value,
  unit,
  sm,
  disabled,
  label,
  onCommit,
}: {
  value: number;
  unit: string;
  sm: boolean;
  disabled?: boolean;
  label: string;
  onCommit: (n: number) => void;
}) {
  const [text, setText] = useState(String(value));
  useEffect(() => {
    setText(String(value));
  }, [value]);
  const commit = () => {
    const n = Number(text.replace(/\D/g, ''));
    if (n > 0) onCommit(n);
    else setText(String(value));
  };
  return (
    <label className={cn('flex items-baseline justify-center gap-0.5 font-semibold text-ink-800 tabular-nums', sm ? 'text-sm' : 'text-base')}>
      <span className="sr-only">{label}</span>
      <input
        inputMode="numeric"
        value={text}
        disabled={disabled}
        onChange={(e) => setText(e.target.value.replace(/\D/g, '').slice(0, 6))}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget.blur(), e.preventDefault())}
        className="w-[5ch] bg-transparent text-right focus:outline-none"
        style={{ width: `${Math.max(2, text.length) + 0.5}ch` }}
      />
      <span className="pr-1 text-ink-500">{unit}</span>
    </label>
  );
}
