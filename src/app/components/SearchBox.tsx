import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ArrowRight, ImageOff, Search, SearchX, X } from 'lucide-react';
import { useCatalogQuery, useCategoriesQuery } from '../api/shopApi';
import { cardPrice, LOCAL_LABEL, localKind, localSearchText, normalize, productImages, searchScore, searchWords, stem, slugify } from '../lib/shop';
import { cn, formatCurrency } from '../lib/utils';
import { cld } from '../lib/cloudinary';

/** Resalta en `text` el comienzo de cada palabra que coincide con lo buscado (sin distinguir mayúsculas ni tildes). */
function Highlight({ text, term }: { text: string; term: string }) {
  const words = searchWords(term);
  const chars = [...text];
  const norm = chars.map((c) => normalize(c)).join('');
  // Cada carácter tiene que normalizar a uno solo para ubicar las posiciones
  if (!words.length || norm.length !== chars.length) return <>{text}</>;
  const marked = new Array<boolean>(chars.length).fill(false);
  for (const m of norm.matchAll(/[a-z0-9]+/g)) {
    const token = m[0];
    let len = 0;
    for (const w of words) {
      if (token.startsWith(w)) len = Math.max(len, w.length);
      else if (stem(token).startsWith(stem(w))) len = Math.max(len, Math.min(stem(w).length, token.length));
    }
    for (let i = 0; i < len; i++) marked[m.index! + i] = true;
  }
  const parts: { text: string; mark: boolean }[] = [];
  chars.forEach((c, i) => {
    const last = parts[parts.length - 1];
    if (last && last.mark === marked[i]) last.text += c;
    else parts.push({ text: c, mark: marked[i] });
  });
  return (
    <>
      {parts.map((p, i) =>
        p.mark ? (
          <mark key={i} className="rounded-sm bg-brand-100 px-px font-semibold text-brand-700">
            {p.text}
          </mark>
        ) : (
          p.text
        ),
      )}
    </>
  );
}

const isTyping = (el: Element | null) =>
  !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || (el as HTMLElement).isContentEditable);

/** Buscador del header con sugerencias instantáneas sobre el catálogo. */
export function SearchBox({ className, onDone, shortcut = false }: { className?: string; onDone?: () => void; shortcut?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: catalog } = useCatalogQuery();
  const { data: categories } = useCategoriesQuery();
  const inputRef = useRef<HTMLInputElement>(null);
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

  // Atajo "/" para enfocar el buscador (solo escritorio)
  useEffect(() => {
    if (!shortcut) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || isTyping(document.activeElement)) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shortcut]);

  const term = q.trim();
  const searching = normalize(term).length >= 2;

  const results = useMemo(() => {
    if (normalize(q.trim()).length < 2 || !catalog) return [];
    const words = searchWords(q);
    if (!words.length) return [];
    const rank = (partial: boolean) =>
      catalog
        .map((p) => ({
          p,
          score: searchScore(
            normalize(p.name),
            normalize(
              `${p.Category?.name ?? ''} ${localKind(p) === 'all' ? '' : (p.Brand?.name ?? '')} ${(p.Tags ?? []).map((t) => t.name).join(' ')}${localSearchText(p)}`,
            ),
            words,
            partial,
          ),
        }))
        .filter((x): x is { p: (typeof catalog)[number]; score: number } => x.score !== null);
    let found = rank(false);
    if (!found.length && words.length >= 3) found = rank(true);
    return found
      .sort((a, b) => a.score - b.score || a.p.name.localeCompare(b.p.name, 'es'))
      .slice(0, 6)
      .map((x) => x.p);
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
    if (e.key === 'Escape') {
      if (!open && q) setQ('');
      setOpen(false);
      return;
    }
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

  const clear = () => {
    setQ('');
    setActive(-1);
    setOpen(true);
    inputRef.current?.focus();
  };

  const showResults = open && searching && !!catalog;
  const showCategories = open && !term && (categories?.length ?? 0) > 0;

  return (
    <div ref={boxRef} className={cn('relative', className)}>
      <form role="search" onSubmit={submit} className="group relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-ink-400 transition-colors group-focus-within:text-brand-500"
        />
        <input
          ref={inputRef}
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          spellCheck={false}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Buscá productos, marcas o categorías"
          aria-label="Buscar productos"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showResults && results.length > 0}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          className={cn(
            'h-11 w-full rounded-full border border-ink-200 bg-ink-50 pl-11 text-base text-ink-800 transition-[background-color,border-color,box-shadow] md:text-[15px]',
            'placeholder:text-ink-400 hover:border-ink-300 hover:bg-white',
            'focus:border-brand-400 focus:bg-white focus:shadow-[0_0_0_4px_rgb(204_59_29/0.12)] focus:outline-none',
            '[&::-webkit-search-cancel-button]:hidden',
            q ? 'pr-11' : shortcut ? 'pr-12' : 'pr-4',
          )}
        />
        {q ? (
          <button
            type="button"
            onClick={clear}
            aria-label="Borrar búsqueda"
            className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
          >
            <X className="size-4" />
          </button>
        ) : (
          shortcut && (
            <kbd
              aria-hidden
              className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 rounded-md border border-ink-200 bg-white px-1.5 font-sans text-xs text-ink-400 transition-opacity group-focus-within:opacity-0"
            >
              /
            </kbd>
          )
        )}
      </form>

      {(showResults || showCategories) && (
        <div
          className="absolute inset-x-0 top-full z-50 mt-2 max-h-[min(70vh,28rem)] overflow-y-auto overscroll-contain rounded-2xl border border-ink-200 bg-white py-1.5 shadow-lift animate-fade-in"
        >
          {showCategories ? (
            <div className="px-4 py-3">
              <p className="text-xs font-semibold tracking-wide text-ink-400 uppercase">Explorá por categoría</p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {categories!.slice(0, 8).map((c) => (
                  <Link
                    key={c.id}
                    to={`/productos?categoria=${slugify(c.name)}`}
                    onClick={() => {
                      setOpen(false);
                      onDone?.();
                    }}
                    className="rounded-full border border-ink-200 px-3 py-1.5 text-sm text-ink-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-6 text-center">
              <SearchX className="size-7 text-ink-300" />
              <p className="mt-2 text-sm text-ink-700">
                No encontramos productos para <span className="font-semibold break-all">“{term}”</span>
              </p>
              <p className="mt-1 text-xs text-ink-500">Probá con otra palabra o revisá la ortografía.</p>
            </div>
          ) : (
            <>
              <p className="px-4 pt-1.5 pb-1 text-xs font-semibold tracking-wide text-ink-400 uppercase">Productos</p>
              <ul id={listId} role="listbox" aria-label="Sugerencias">
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
                        className={cn('mx-1.5 flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors', i === active && 'bg-brand-50')}
                      >
                        <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ink-100 text-ink-300">
                          {img ? <img src={cld(img, { w: 96, h: 96 })} alt="" width={44} height={44} loading="lazy" decoding="async" className="size-full object-cover" /> : <ImageOff className="size-5" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-ink-800">
                            <Highlight text={p.name} term={term} />
                          </span>
                          <span className="block truncate text-xs text-ink-500">
                            {[p.Category?.name, localKind(p) === 'all' ? LOCAL_LABEL : p.Brand?.name].filter(Boolean).join(' · ')}
                          </span>
                        </span>
                        {info && (
                          <span className="shrink-0 text-right text-sm font-semibold text-ink-800 tabular-nums">
                            {formatCurrency(info.price)}
                            <span className="block text-xs font-normal text-ink-500">x {info.unitLabel}</span>
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          {showResults && (
            <button
              type="button"
              onClick={() => submit(undefined, true)}
              className="mt-1 flex w-full items-center gap-2 border-t border-ink-100 px-4 pt-3 pb-2 text-left text-sm font-medium text-brand-500 hover:text-brand-600"
            >
              <Search className="size-4 shrink-0" />
              <span className="min-w-0 truncate">Ver todos los resultados para “{term}”</span>
              <ArrowRight className="ml-auto size-4 shrink-0" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
