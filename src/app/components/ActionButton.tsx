import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/utils';
import { Spinner } from './States';

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingLabel?: ReactNode;
  children: ReactNode;
}

export function ActionButton({ loading = false, loadingLabel, children, className, disabled, type = 'button', ...props }: ActionButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(className, loading && '!cursor-wait !border-ink-700 !bg-ink-700 !text-white !shadow-none !opacity-100')}
    >
      {loading ? (
        <>
          <Spinner className="size-4" />
          {loadingLabel ?? children}
        </>
      ) : children}
    </button>
  );
}
