import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';

export function SectionHeader({
  title,
  link,
  extra,
  icon,
  subtitle,
}: {
  title: string;
  link?: { to: string; label: string };
  extra?: ReactNode;
  icon?: ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2.5 text-2xl font-medium tracking-tight text-ink-800 sm:text-[26px]">
          {icon && <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-500">{icon}</span>}
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {extra}
      {link && (
        <Link
          to={link.to}
          className="group inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-brand-500 transition-colors hover:bg-brand-50"
        >
          {link.label} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
