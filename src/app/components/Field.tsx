import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
  error?: string;
}

/** Input con ícono a la izquierda; los de tipo password tienen botón para mostrar. */
export const Field = forwardRef<HTMLInputElement, Props>(function Field({ label, icon, error, type = 'text', className, id, ...rest }, ref) {
  const [show, setShow] = useState(false);
  const inputId = id ?? rest.name;
  const isPassword = type === 'password';
  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-2 block text-lg text-ink-800">
        {label}
      </label>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-400">{icon}</span>}
        <input
          ref={ref}
          id={inputId}
          type={isPassword && show ? 'text' : type}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn('field h-[52px] text-[17px]', icon && 'pl-12', isPassword && 'pr-12', error && 'border-brand-500')}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-ink-400 hover:text-ink-700"
          >
            {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-sm text-brand-600">
          {error}
        </p>
      )}
    </div>
  );
});

export function Divider({ children }: { children: ReactNode }) {
  return (
    <div className="my-6 flex items-center gap-4 text-sm text-ink-400">
      <span className="h-px flex-1 bg-ink-200" />
      {children}
      <span className="h-px flex-1 bg-ink-200" />
    </div>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-md border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">
      {message}
    </div>
  );
}
