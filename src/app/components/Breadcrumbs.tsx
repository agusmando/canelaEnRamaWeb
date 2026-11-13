import { Fragment } from 'react';
import { Link } from 'react-router';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../lib/utils';

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Ruta de navegación" className={cn('flex flex-wrap items-center gap-1.5 py-5 text-sm text-ink-500', className)}>
      <Link to="/" aria-label="Inicio" className="rounded-md p-1 text-ink-600 transition-colors hover:bg-brand-50 hover:text-brand-500">
        <Home className="size-4" />
      </Link>
      {items.map((c, i) => (
        <Fragment key={i}>
          <ChevronRight className="size-3.5 text-ink-300" aria-hidden />
          {c.to ? (
            <Link to={c.to} className="rounded-md px-1 py-0.5 transition-colors hover:bg-brand-50 hover:text-brand-500">
              {c.label}
            </Link>
          ) : (
            <span aria-current="page" className="line-clamp-1 px-1 font-medium text-ink-800">
              {c.label}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
