import { useRef, type KeyboardEvent } from 'react';
import { Star } from 'lucide-react';
import { cn } from '../lib/utils';

const STAR_COLOR = 'fill-[#fbbc04] text-[#fbbc04]';

/** Estrellas de solo lectura (admite medias: 4.5 → 4 llenas y media). El tamaño se toma de `font-size`. */
export function Stars({ value, className, label }: { value: number; className?: string; label?: string }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <span
      className={cn('inline-flex shrink-0 items-center gap-[0.1em] leading-none', className)}
      role="img"
      aria-label={label ?? `${formatRating(v)} de 5 estrellas`}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.max(0, Math.min(1, v - i));
        return (
          <span key={i} className="relative inline-block size-[1em]" aria-hidden>
            <Star className="absolute inset-0 size-[1em] fill-ink-200 text-ink-200" />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={cn('size-[1em]', STAR_COLOR)} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

/** "4,8" */
export const formatRating = (n: number) => (Number(n) || 0).toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const LABELS = ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'];

/**
 * Selector de puntaje accesible: grupo de radios (flechas para moverse, como un radio nativo).
 */
export function StarInput({
  value,
  onChange,
  name = 'rating',
  labelledBy,
  invalid,
}: {
  value: number;
  onChange: (n: number) => void;
  name?: string;
  labelledBy?: string;
  invalid?: boolean;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const focusable = value || 1;

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, n: number) => {
    let next = n;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = Math.min(5, n + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = Math.max(1, n - 1);
    else if (e.key === 'Home') next = 1;
    else if (e.key === 'End') next = 5;
    else return;
    e.preventDefault();
    onChange(next);
    refs.current[next - 1]?.focus();
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div role="radiogroup" aria-labelledby={labelledBy} aria-invalid={invalid || undefined} className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            ref={(el) => {
              refs.current[n - 1] = el;
            }}
            type="button"
            role="radio"
            name={name}
            aria-checked={value === n}
            aria-label={`${n} estrella${n > 1 ? 's' : ''} · ${LABELS[n]}`}
            tabIndex={n === focusable ? 0 : -1}
            onClick={() => onChange(n)}
            onKeyDown={(e) => onKey(e, n)}
            className="rounded-md p-0.5 transition-transform hover:scale-110 motion-reduce:transition-none"
          >
            <Star className={cn('size-8', n <= value ? STAR_COLOR : 'fill-transparent text-ink-300')} strokeWidth={1.5} />
          </button>
        ))}
      </div>
      <span className="text-sm text-ink-500" aria-live="polite">
        {value ? LABELS[value] : 'Elegí un puntaje'}
      </span>
    </div>
  );
}
