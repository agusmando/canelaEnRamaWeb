import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ImageOff, Search } from 'lucide-react';
import { useCatalogQuery } from '../api/shopApi';
import { cardPrice, normalize, productImages } from '../lib/shop';
import { cn, formatCurrency } from '../lib/utils';

/** Buscador del header con sugerencias instantáneas sobre el catálogo. */
export function SearchBox({ className, onDone }: { className?: string; onDone?: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: catalog } = useCatalogQuery();
  const [q, setQ] = useState(() => new URLSearchParams(location.search).get('q') ?? '');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  // Si se navega a otra búsqueda (o se borran los filtros), reflejarla.
  useEffect(() => {
    setQ(location.pathname === '/productos' ? new URLSearchParams(location.search).get('q') ?? '' : '');
    setOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const results = useMemo(() => {
    const term = normalize(q.trim());
    if (term.length < 2 || !catalog) return [];
    return catalog
      .filter((p) =>
        normalize(`${p.name} ${p.Category?.name ?? ''} ${p.Brand?.name ?? ''} ${(p.Tags ?? []).map((t) => t.name).join(' ')}`).includes(term),
      )
      .slice(0, 6);
  }, [q, catalog]);

  const submit = (e?: React.FormEvent, all = false) => {
    e?.preventDefault();
    if (!all && open && active >= 0 && results[active]) {
      navigate(`/producto/${results[active].id}`);
    } else {
      const term = q.trim();
      navigate(term ? `/productos?q=${encodeURIComponent(term)}` : '/productos');
    }
    setOpen(false);
    onDone?.();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || !results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={boxRef} className={cn('relative', className)}>
      <form role="search" onSubmit={submit}>
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder='Buscá "Sin TACC", "Harinas", "Snacks"…'
          aria-label="Buscar productos"
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          className="h-11 w-full rounded-full border border-transparent bg-ink-100 pr-12 pl-5 text-[15px] text-ink-800 placeholder:text-ink-400 transition-colors focus:border-brand-300 focus:bg-white focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        <button type="submit" aria-label="Buscar" className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-ink-400 hover:text-brand-500">
          <Search className="size-5" />
        </button>
      </form>

      {open && results.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-ink-200 bg-white py-1 shadow-lift animate-fade-in"
        >
          {results.map((p, i) => {
            const info = cardPrice(p);
            const img = productImages(p)[0];
            return (
              <li key={p.id} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                <Link
                  to={`/producto/${p.id}`}
                  onClick={() => {
                    setOpen(false);
                    onDone?.();
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={cn('flex items-center gap-3 px-3 py-2', i === active && 'bg-brand-50')}
                >
                  <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-ink-100 text-ink-300">
                    {img ? <img src={img} alt="" className="size-full object-cover" /> : <ImageOff className="size-5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink-800">{p.name}</span>
                    <span className="block truncate text-xs text-ink-500">{p.Category?.name}</span>
                  </span>
                  {info && (
                    <span className="shrink-0 text-sm font-semibold text-ink-800">
                      {formatCurrency(info.price)}
                      <span className="text-xs font-normal text-ink-500"> x {info.unitLabel}</span>
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
          <li>
            <button type="button" onClick={() => submit(undefined, true)} className="w-full border-t border-ink-100 px-3 py-2.5 text-left text-sm font-medium text-brand-500 hover:bg-brand-50">
              Ver todos los resultados para “{q.trim()}”
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
