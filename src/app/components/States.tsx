import type { ReactNode } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('size-5 animate-spin', className)} aria-hidden />;
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-brand-500" role="status" aria-label="Cargando">
      <Spinner className="size-8" />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  children,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-4 py-12 text-center sm:px-6 sm:py-16', className)}>
      {icon && <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-brand-100 text-brand-500">{icon}</div>}
      <h2 className="text-xl font-semibold text-balance text-ink-800">{title}</h2>
      {children && <div className="mt-2 max-w-md text-ink-500">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon={<AlertCircle className="size-7" />}
      title="Algo salió mal"
      action={
        onRetry && (
          <button className="btn-outline px-5 py-2" onClick={onRetry}>
            Reintentar
          </button>
        )
      }
    >
      {message}
    </EmptyState>
  );
}
