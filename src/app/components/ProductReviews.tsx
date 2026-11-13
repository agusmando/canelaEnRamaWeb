import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { toast } from 'sonner';
import { BadgeCheck, MessageSquareText, Pencil, PenLine, Store, Trash2, X } from 'lucide-react';
import {
  useCreateReviewMutation,
  useDeleteReviewMutation,
  useReviewEligibilityQuery,
  useReviewSummaryQuery,
  useReviewsQuery,
  useUpdateReviewMutation,
} from '../api/shopApi';
import type { Id, Product, ProductVariant, Review, ReviewEligibility, ReviewStatus } from '../api/types';
import { getErrorMessage } from '../api/client';
import { useAppSelector } from '../store';
import { cn, formatDate, formatNumber } from '../lib/utils';
import { SectionHeader } from './SectionHeader';
import { Spinner } from './States';
import { StarInput, Stars, formatRating } from './Stars';

export const REVIEWS_ANCHOR = 'opiniones';
const PER_PAGE = 5;
const MAX_COMMENT = 1000;
const MAX_TITLE = 100;
const THANKS = '¡Gracias! Tu opinión se publicará cuando la revisemos.';

const opinions = (n: number) => `${formatNumber(n)} ${n === 1 ? 'opinión' : 'opiniones'}`;

function scrollToReviews(e?: React.MouseEvent) {
  const el = document.getElementById(REVIEWS_ANCHOR);
  if (!el) return;
  e?.preventDefault();
  el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}

// ---------------------------------------------------------------- Resumen junto al título

/** Estrellas + promedio + "(N opiniones)" que lleva a la sección de opiniones. */
export function RatingSummaryLink({ productId, className }: { productId: Id; className?: string }) {
  const { data } = useReviewSummaryQuery(productId);
  if (!data) return <div className={cn('h-5', className)} aria-hidden />;
  if (!data.count) {
    return (
      <a href={`#${REVIEWS_ANCHOR}`} onClick={scrollToReviews} className={cn('inline-flex items-center gap-2 text-sm text-ink-500 hover:text-brand-500', className)}>
        <Stars value={0} className="text-base" label="Sin opiniones" /> Sin opiniones todavía
      </a>
    );
  }
  return (
    <a
      href={`#${REVIEWS_ANCHOR}`}
      onClick={scrollToReviews}
      className={cn('group inline-flex flex-wrap items-center gap-2 text-sm', className)}
      aria-label={`${formatRating(data.average)} de 5 estrellas, ${opinions(data.count)}. Ver opiniones`}
    >
      <Stars value={data.average} className="text-base" />
      <span className="font-semibold text-ink-800 tabular-nums">{formatRating(data.average)}</span>
      <span className="text-ink-500 group-hover:text-brand-500 group-hover:underline">({opinions(data.count)})</span>
    </a>
  );
}

// ---------------------------------------------------------------- Sección de opiniones

type FormState = { mode: 'create' } | { mode: 'edit'; review: Review; variantName: string } | null;

/** `multiVariant`: el producto tiene más de una presentación a la venta (habilita el filtro por presentación). */
export function ProductReviews({ product, variant, multiVariant }: { product: Product; variant?: ProductVariant; multiVariant: boolean }) {
  const multi = multiVariant;
  const [scope, setScope] = useState<'all' | 'variant'>('all');
  const [rating, setRating] = useState<number | undefined>();
  const [pages, setPages] = useState(1);
  const [form, setForm] = useState<FormState>(null);

  const productVariantId = scope === 'variant' && variant ? variant.id : undefined;
  useEffect(() => {
    setPages(1);
  }, [productVariantId, rating]);

  const { data: summary, isLoading: loadingSummary } = useReviewSummaryQuery(product.id);
  const query = { productId: product.id, productVariantId, rating, perPage: PER_PAGE };
  const { data: first, isFetching: fetchingFirst, error: listError, refetch } = useReviewsQuery({ ...query, page: 1 });
  const totalPages = first?.pagination.totalPages ?? 1;
  const total = first?.pagination.totalAmount ?? 0;
  const variantStats = variant ? summary?.byVariant.find((b) => b.productVariantId === variant.id) : undefined;

  return (
    <section id={REVIEWS_ANCHOR} aria-labelledby="opiniones-title" className="container-page mt-16 scroll-mt-40">
      <div id="opiniones-title">
        <SectionHeader title="Opiniones de clientes" />
      </div>

      <div className="grid gap-10 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-14">
        <div className="space-y-6">
          {loadingSummary ? (
            <div className="skeleton h-56 rounded-xl" />
          ) : (
            <SummaryPanel
              average={summary?.average ?? 0}
              count={summary?.count ?? 0}
              distribution={summary?.distribution}
              rating={rating}
              onRating={(r) => setRating((cur) => (cur === r ? undefined : r))}
            />
          )}
          <WriteReviewPanel productId={product.id} onWrite={() => setForm({ mode: 'create' })} onEdit={(review, variantName) => setForm({ mode: 'edit', review, variantName })} />
        </div>

        <div className="min-w-0 space-y-5">
          {form && (
            <ReviewForm
              key={form.mode === 'edit' ? `edit-${form.review.id}` : 'create'}
              productId={product.id}
              state={form}
              preferredVariantId={variant?.id}
              onClose={() => setForm(null)}
            />
          )}

          {(multi && variant) || rating ? (
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar opiniones">
              {multi && variant && (
                <>
                  <FilterChip active={scope === 'all'} onClick={() => setScope('all')}>
                    Todas las presentaciones
                  </FilterChip>
                  <FilterChip active={scope === 'variant'} onClick={() => setScope('variant')}>
                    Solo {variant.name}
                    {variantStats && variantStats.count > 0 && (
                      <span className="ml-1.5 inline-flex items-center gap-0.5 text-xs opacity-80">
                        · {formatRating(variantStats.average)} ★ ({formatNumber(variantStats.count)})
                      </span>
                    )}
                  </FilterChip>
                </>
              )}
              {rating && (
                <button
                  type="button"
                  onClick={() => setRating(undefined)}
                  className="inline-flex items-center gap-1 rounded-full bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
                  aria-label={`Quitar filtro de ${rating} estrellas`}
                >
                  {rating} ★ <X className="size-3.5" />
                </button>
              )}
            </div>
          ) : null}

          {listError ? (
            <div className="rounded-xl bg-ink-50 p-5 text-sm text-ink-600">
              No pudimos cargar las opiniones.{' '}
              <button type="button" onClick={refetch} className="font-medium text-brand-500 hover:underline">
                Reintentar
              </button>
            </div>
          ) : !first && fetchingFirst ? (
            <ReviewSkeletons />
          ) : total === 0 ? (
            <div className="flex flex-col items-center rounded-xl bg-ink-50 px-6 py-10 text-center">
              <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-white text-brand-500 shadow-card">
                <MessageSquareText className="size-6" />
              </span>
              <p className="font-medium text-ink-800">
                {rating || productVariantId ? 'No hay opiniones con este filtro' : 'Todavía no hay opiniones de este producto'}
              </p>
              <p className="mt-1 text-sm text-ink-500">
                {rating || productVariantId ? 'Probá con otro filtro.' : 'Si ya lo compraste, contanos qué te pareció.'}
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-ink-500" aria-live="polite">
                {opinions(total)}
                {rating ? ` con ${rating} estrella${rating > 1 ? 's' : ''}` : ''}
                {productVariantId && variant ? ` · ${variant.name}` : ''}
              </p>
              <ul className={cn('divide-y divide-ink-100 border-y border-ink-100', fetchingFirst && 'opacity-70')}>
                {Array.from({ length: pages }, (_, k) => (
                  <ReviewPage key={k} args={{ ...query, page: k + 1 }} />
                ))}
              </ul>
              {pages < totalPages && (
                <div className="flex justify-center">
                  <button type="button" onClick={() => setPages((p) => p + 1)} className="btn-outline h-11 rounded-full px-8">
                    Ver más opiniones
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1.5 text-sm transition-colors',
        active ? 'border-brand-500 bg-brand-50 font-medium text-brand-600' : 'border-ink-200 text-ink-700 hover:border-ink-300 hover:bg-ink-50',
      )}
    >
      {children}
    </button>
  );
}

function SummaryPanel({
  average,
  count,
  distribution,
  rating,
  onRating,
}: {
  average: number;
  count: number;
  distribution?: Record<1 | 2 | 3 | 4 | 5, number>;
  rating?: number;
  onRating: (r: number) => void;
}) {
  return (
    <div className="rounded-xl border border-ink-200 p-5">
      <div className="flex items-center gap-4">
        <span className="text-5xl font-semibold text-ink-800 tabular-nums">{count ? formatRating(average) : '–'}</span>
        <div>
          <Stars value={average} className="text-xl" />
          <p className="mt-1 text-sm text-ink-500">{count ? opinions(count) : 'Sin opiniones todavía'}</p>
        </div>
      </div>
      {count > 0 && (
        <ul className="mt-5 space-y-1.5" aria-label="Distribución de puntajes">
          {([5, 4, 3, 2, 1] as const).map((r) => {
            const n = distribution?.[r] ?? 0;
            const pct = count ? Math.round((n / count) * 100) : 0;
            return (
              <li key={r}>
                <button
                  type="button"
                  onClick={() => onRating(r)}
                  disabled={!n}
                  aria-pressed={rating === r}
                  aria-label={`${r} estrella${r > 1 ? 's' : ''}: ${opinions(n)}. ${rating === r ? 'Quitar filtro' : 'Filtrar'}`}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-1.5 py-1 text-sm transition-colors disabled:cursor-default disabled:opacity-60',
                    rating === r ? 'bg-brand-50' : 'enabled:hover:bg-ink-50',
                  )}
                >
                  <span className="w-8 shrink-0 text-left text-ink-700 tabular-nums">{r} ★</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
                    <span className="block h-full rounded-full bg-[#fbbc04]" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="w-8 shrink-0 text-right text-ink-500 tabular-nums">{formatNumber(n)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ReviewPage({ args }: { args: Parameters<typeof useReviewsQuery>[0] }) {
  const { data, isLoading } = useReviewsQuery(args);
  if (isLoading) {
    return (
      <li className="py-5">
        <ReviewSkeletons count={2} />
      </li>
    );
  }
  return (
    <>
      {data?.content.map((r) => (
        <ReviewItem key={r.id} review={r} />
      ))}
    </>
  );
}

function ReviewItem({ review: r }: { review: Review }) {
  return (
    <li className="py-5">
      <article aria-label={`Opinión de ${r.authorName}`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Stars value={r.rating} className="text-base" />
          {r.title && <h3 className="font-semibold text-ink-800">{r.title}</h3>}
        </div>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-500">
          <span className="font-medium text-ink-700">{r.authorName}</span>
          <span aria-hidden>·</span>
          <time dateTime={r.createdAt}>{formatDate(r.createdAt)}</time>
          {r.productVariant?.name && (
            <>
              <span aria-hidden>·</span>
              <span>{r.productVariant.name}</span>
            </>
          )}
          {r.verifiedPurchase && (
            <span className="inline-flex items-center gap-1 rounded-full bg-leaf-500/15 px-2 py-0.5 font-medium text-leaf-600">
              <BadgeCheck className="size-3.5" /> Compra verificada
            </span>
          )}
        </p>
        {r.comment && <p className="mt-2.5 leading-relaxed whitespace-pre-line text-ink-700">{r.comment}</p>}
        {r.reply && (
          <div className="mt-3 rounded-lg border-l-4 border-brand-300 bg-brand-50 px-4 py-3">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-ink-800">
              <Store className="size-4 text-brand-500" /> Respuesta de Canela en Rama
            </p>
            <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-ink-700">{r.reply}</p>
          </div>
        )}
      </article>
    </li>
  );
}

function ReviewSkeletons({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-5" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="space-y-2">
          <div className="skeleton h-4 w-32" />
          <div className="skeleton h-3 w-48" />
          <div className="skeleton h-12 w-full" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- Escribir / mis opiniones

const STATUS: Record<ReviewStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pendiente de aprobación', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  APPROVED: { label: 'Publicada', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  REJECTED: { label: 'Rechazada', className: 'bg-ink-50 text-ink-600 ring-ink-200' },
};

function WriteReviewPanel({
  productId,
  onWrite,
  onEdit,
}: {
  productId: Id;
  onWrite: () => void;
  onEdit: (review: Review, variantName: string) => void;
}) {
  const status = useAppSelector((s) => s.auth.status);
  const location = useLocation();
  const { data: eligible, isLoading, error } = useReviewEligibilityQuery(productId, { skip: status !== 'authenticated' });

  if (status === 'checking') return null;

  if (status !== 'authenticated') {
    return (
      <div className="rounded-xl bg-ink-50 p-5">
        <p className="font-medium text-ink-800">¿Compraste este producto?</p>
        <p className="mt-1 text-sm text-ink-600">Ingresá a tu cuenta para dejar tu opinión.</p>
        <Link to="/login" state={{ from: location.pathname }} className="btn-outline mt-4 h-10 px-4 text-sm">
          <PenLine className="size-4" /> Ingresar para opinar
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-ink-50 p-5 text-sm text-ink-500">
        <Spinner className="size-4" /> Cargando…
      </div>
    );
  }
  if (error) return null;

  const list = eligible ?? [];
  const pending = list.filter((e) => !e.review);
  const mine = list.filter((e): e is ReviewEligibility & { review: Review } => !!e.review);

  if (!list.length) {
    return (
      <div className="rounded-xl bg-ink-50 p-5 text-sm text-ink-600">
        <p className="font-medium text-ink-800">Escribir una opinión</p>
        <p className="mt-1">Podés opinar sobre los productos que compraste una vez entregado tu pedido.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div className="rounded-xl bg-brand-50 p-5">
          <p className="font-medium text-ink-800">¿Qué te pareció?</p>
          <p className="mt-1 text-sm text-ink-600">Tu opinión ayuda a otros clientes a elegir.</p>
          <button type="button" onClick={onWrite} className="btn-primary mt-4 h-10 px-4 text-sm">
            <PenLine className="size-4" /> Escribir una opinión
          </button>
        </div>
      )}
      {mine.length > 0 && (
        <div className="rounded-xl border border-ink-200 p-5">
          <p className="font-medium text-ink-800">{mine.length === 1 ? 'Tu opinión' : 'Tus opiniones'}</p>
          <ul className="mt-3 space-y-4">
            {mine.map((e) => (
              <MyReview key={e.review.id} productId={productId} entry={e} onEdit={() => onEdit(e.review, e.variantName)} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function MyReview({ productId, entry, onEdit }: { productId: Id; entry: ReviewEligibility & { review: Review }; onEdit: () => void }) {
  const r = entry.review;
  const s = STATUS[r.status] ?? STATUS.PENDING;
  const [remove, { isLoading: removing }] = useDeleteReviewMutation();
  const doRemove = async () => {
    if (!window.confirm('¿Seguro que querés eliminar tu opinión?')) return;
    try {
      await remove({ id: r.id, productId }).unwrap();
      toast.success('Eliminamos tu opinión.');
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };
  return (
    <li className="text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Stars value={r.rating} className="text-sm" />
        <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', s.className)}>{s.label}</span>
      </div>
      <p className="mt-1 text-xs text-ink-500">{entry.variantName}</p>
      {r.title && <p className="mt-1 font-medium text-ink-800">{r.title}</p>}
      {r.comment && <p className="mt-0.5 line-clamp-3 text-ink-600">{r.comment}</p>}
      {r.status === 'REJECTED' && r.rejectionReason && <p className="mt-1 text-xs text-brand-600">Motivo: {r.rejectionReason}</p>}
      <div className="mt-2 flex gap-1">
        <button type="button" onClick={onEdit} className="btn-ghost h-8 px-2 text-xs">
          <Pencil className="size-3.5" /> Editar
        </button>
        <button type="button" onClick={doRemove} disabled={removing} className="btn-ghost h-8 px-2 text-xs text-brand-600 hover:bg-brand-50 hover:text-brand-700">
          {removing ? <Spinner className="size-3.5" /> : <Trash2 className="size-3.5" />} Eliminar
        </button>
      </div>
    </li>
  );
}

function ReviewForm({
  productId,
  state,
  preferredVariantId,
  onClose,
}: {
  productId: Id;
  state: NonNullable<FormState>;
  preferredVariantId?: Id;
  onClose: () => void;
}) {
  const uid = useId();
  const editing = state.mode === 'edit' ? state.review : null;
  const { data: eligible = [] } = useReviewEligibilityQuery(productId);
  const options = eligible.filter((e) => !e.review);
  const [variantId, setVariantId] = useState<Id | ''>(() =>
    editing ? editing.productVariantId : (options.find((o) => o.productVariantId === preferredVariantId) ?? options[0])?.productVariantId ?? '',
  );
  const [rating, setRating] = useState(editing?.rating ?? 0);
  const [title, setTitle] = useState(editing?.title ?? '');
  const [comment, setComment] = useState(editing?.comment ?? '');
  const [error, setError] = useState<string | null>(null);
  const [create, { isLoading: creating }] = useCreateReviewMutation();
  const [update, { isLoading: updating }] = useUpdateReviewMutation();
  const busy = creating || updating;
  const ref = useRef<HTMLFormElement>(null);

  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    ref.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
    heading.current?.focus({ preventScroll: true });
  }, []);

  // Las opciones llegan después de montar el formulario: elegir la primera disponible.
  useEffect(() => {
    if (!editing && variantId === '' && options[0]) setVariantId(options[0].productVariantId);
  }, [editing, variantId, options]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!rating) return setError('Elegí un puntaje de 1 a 5 estrellas.');
    if (!editing && !variantId) return setError('Elegí la presentación que compraste.');
    const t = title.trim();
    const c = comment.trim();
    try {
      if (editing) await update({ id: editing.id, rating, title: t || null, comment: c || null }).unwrap();
      else await create({ productVariantId: Number(variantId), rating, ...(t ? { title: t } : {}), ...(c ? { comment: c } : {}) }).unwrap();
      toast.success(THANKS);
      onClose();
    } catch (err) {
      const status = (err as { status?: number }).status;
      setError(
        status === 403
          ? 'Solo podés opinar sobre productos que compraste y ya recibiste.'
          : status === 409
            ? 'Ya dejaste una opinión para esta presentación. Podés editarla desde “Tu opinión”.'
            : getErrorMessage(err),
      );
    }
  };

  return (
    <form ref={ref} onSubmit={submit} noValidate aria-labelledby={`${uid}-h`} className="scroll-mt-40 rounded-xl border border-ink-200 p-5 shadow-card sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <h3 id={`${uid}-h`} ref={heading} tabIndex={-1} className="text-lg font-semibold text-ink-800 focus:outline-none">
          {editing ? 'Editar tu opinión' : 'Escribir una opinión'}
        </h3>
        <button type="button" onClick={onClose} aria-label="Cerrar formulario" className="btn-icon -mt-1 -mr-2 size-9">
          <X className="size-5" />
        </button>
      </div>
      {editing && <p className="mt-1 text-sm text-ink-500">Al editarla vuelve a revisión antes de publicarse.</p>}

      <div className="mt-5 space-y-5">
        {editing ? (
          <p className="text-sm text-ink-600">
            Presentación: <strong className="font-medium text-ink-800">{state.mode === 'edit' ? state.variantName : ''}</strong>
          </p>
        ) : (
          <div>
            <label htmlFor={`${uid}-v`} className="mb-1.5 block text-sm font-medium text-ink-800">
              Presentación que compraste
            </label>
            <select
              id={`${uid}-v`}
              value={variantId}
              onChange={(e) => setVariantId(Number(e.target.value))}
              className="field h-11"
              disabled={options.length < 2}
            >
              {options.map((o) => (
                <option key={o.productVariantId} value={o.productVariantId}>
                  {o.variantName}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <p id={`${uid}-r`} className="mb-1.5 text-sm font-medium text-ink-800">
            Puntaje <span className="text-brand-500">*</span>
          </p>
          <StarInput value={rating} onChange={setRating} labelledBy={`${uid}-r`} invalid={!!error && !rating} name={`${uid}-rating`} />
        </div>

        <div>
          <label htmlFor={`${uid}-t`} className="mb-1.5 block text-sm font-medium text-ink-800">
            Título <span className="font-normal text-ink-400">(opcional)</span>
          </label>
          <input
            id={`${uid}-t`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={MAX_TITLE}
            placeholder="Ej.: Muy frescas y ricas"
            className="field h-11"
          />
        </div>

        <div>
          <label htmlFor={`${uid}-c`} className="mb-1.5 block text-sm font-medium text-ink-800">
            Tu opinión <span className="font-normal text-ink-400">(opcional)</span>
          </label>
          <textarea
            id={`${uid}-c`}
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT))}
            maxLength={MAX_COMMENT}
            rows={4}
            aria-describedby={`${uid}-cc`}
            placeholder="Contanos qué te pareció: sabor, calidad, cómo lo usaste…"
            className="field resize-y"
          />
          <p id={`${uid}-cc`} className="mt-1 text-right text-xs text-ink-400 tabular-nums">
            {comment.length}/{MAX_COMMENT}
          </p>
        </div>

        {error && (
          <p role="alert" className="rounded-md border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">
            {error}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost h-11 px-5">
            Cancelar
          </button>
          <button type="submit" disabled={busy} className="btn-primary h-11 px-6">
            {busy && <Spinner className="size-4" />} {editing ? 'Guardar cambios' : 'Enviar opinión'}
          </button>
        </div>
        <p className="text-xs text-ink-400">Revisamos cada opinión antes de publicarla. Se muestra tu nombre y la inicial de tu apellido.</p>
      </div>
    </form>
  );
}
