import { useEffect, useState, type ReactNode } from 'react';
import { Star } from 'lucide-react';
import { useGoogleReviewsQuery } from '../api/shopApi';
import { CONTACT } from '../lib/contact';
import { cn, formatNumber } from '../lib/utils';
import { GoogleIcon } from './GoogleButton';
import { formatRating } from './Stars';

/**
 * Reseñas reales de Google junto al login/registro (`GET /google-review`:
 * puntaje del local + reseñas destacadas en el dashboard). No hay datos
 * inventados: si todavía no hay reseñas se muestra solo el link a Google.
 */
const ROTATE_MS = 7000;

interface ShellReview {
  id: number;
  text: string;
  author: string;
  when: string;
  rating: number;
  photo: string | null;
}

function Stars({ className, value = 5 }: { className?: string; value?: number }) {
  return (
    <span className={className} aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={i < Math.round(value) ? 'inline size-[1em] fill-[#fbbc04] text-[#fbbc04]' : 'inline size-[1em] fill-ink-200 text-ink-200'} />
      ))}
    </span>
  );
}

function ReviewCard({ review, className }: { review: ShellReview; className?: string }) {
  return (
    <figure className={className}>
      <div className="flex items-center justify-between">
        <Stars className="text-2xl" value={review.rating} />
        <GoogleIcon className="size-6" />
      </div>
      <blockquote className="mt-4 line-clamp-6 text-[15px] leading-relaxed text-ink-800">{review.text}</blockquote>
      <figcaption className="mt-4 flex items-center gap-3">
        {review.photo ? (
          <img src={review.photo} alt="" width={36} height={36} referrerPolicy="no-referrer" className="size-9 rounded-full object-cover" />
        ) : (
          <span className="flex size-9 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-600">{review.author[0]}</span>
        )}
        <span>
          <span className="block text-sm font-semibold text-ink-800">{review.author}</span>
          {review.when && <span className="block text-xs text-ink-500">{review.when}</span>}
        </span>
      </figcaption>
    </figure>
  );
}

/** Tarjeta de fondo (desenfocada) con el inicio de otra reseña real. */
function GhostCard({ review, side }: { review: ShellReview; side: 'left' | 'right' }) {
  return (
    <div
      aria-hidden
      className={cn(
        'absolute top-8 h-48 w-56 overflow-hidden rounded-2xl bg-white p-5 opacity-70 shadow-lift blur-[2px]',
        side === 'left' ? 'left-0' : 'right-0',
      )}
    >
      <div className="flex items-center justify-between">
        <Stars className="text-lg" value={review.rating} />
        <GoogleIcon className="size-5" />
      </div>
      <p className="mt-3 line-clamp-5 text-xs leading-relaxed text-ink-600">{review.text}</p>
    </div>
  );
}

function useShellReviews() {
  const { data, isLoading } = useGoogleReviewsQuery();
  const place = data?.place;
  const reviews: ShellReview[] = (data?.reviews ?? [])
    .filter((r) => r.text?.trim() && r.rating >= 4)
    .map((r) => ({
      id: r.id,
      text: r.text!.trim(),
      author: r.authorName,
      when: r.relativeTime ?? '',
      rating: r.rating,
      photo: r.authorPhotoUrl,
    }));
  return {
    isLoading,
    rating: place?.rating && place.userRatingCount ? { score: place.rating, total: place.userRatingCount } : null,
    reviews,
  };
}

/** Índice de la reseña principal; rota sola (pausa con hover/foco y con movimiento reducido). */
function useRotation(count: number, paused: boolean) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (count < 2 || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => window.clearInterval(t);
  }, [count, paused]);
  return count ? index % count : 0;
}

export function AuthShell({ children }: { children: ReactNode }) {
  const { isLoading, rating, reviews } = useShellReviews();
  const [paused, setPaused] = useState(false);
  const [offset, setOffset] = useState(0);
  const index = useRotation(reviews.length, paused);
  const n = reviews.length;
  const current = n ? (((index + offset) % n) + n) % n : 0;
  const main = reviews[current];
  // Las tarjetas de fondo muestran otras reseñas (si hay suficientes)
  const left = n > 1 ? reviews[(current + 1) % n] : undefined;
  const right = n > 2 ? reviews[(current + 2) % n] : undefined;
  return (
    <div className="container-page py-10 sm:py-14">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-0">
        <div className="lg:border-r lg:border-ink-200 lg:pr-16">{children}</div>

        <aside
          aria-label="Reseñas de clientes en Google"
          className="hidden flex-col items-center lg:flex lg:pl-16"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          {rating ? (
            <>
              <p className="text-[32px] font-semibold text-ink-800">{formatRating(rating.score)} Estrellas</p>
              <Stars className="mt-1 text-[40px] tracking-wider" value={rating.score} />
              <p className="mt-2 text-lg text-ink-600">
                Basado en{' '}
                <a href={CONTACT.mapsUrl} target="_blank" rel="noreferrer" className="font-semibold text-ink-800 underline underline-offset-2">
                  {formatNumber(rating.total)} reseñas
                </a>
              </p>
            </>
          ) : isLoading ? (
            <div aria-hidden className="flex flex-col items-center gap-3">
              <div className="skeleton h-9 w-56" />
              <div className="skeleton h-10 w-64" />
              <div className="skeleton h-6 w-48" />
            </div>
          ) : null}

          <a
            href={CONTACT.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className={cn('flex items-center gap-3 rounded-lg hover:opacity-80', rating || isLoading ? 'mt-8' : 'mt-0')}
          >
            <span className="flex size-12 items-center justify-center rounded-lg border border-ink-200 bg-white shadow-card">
              <GoogleIcon className="size-8" />
            </span>
            <span className="text-2xl font-semibold text-ink-800">{reviews.length || rating ? 'Google Reviews' : 'Mirá nuestras reseñas en Google'}</span>
          </a>

          {isLoading ? (
            <div aria-hidden className="skeleton mt-12 h-64 w-[300px] rounded-2xl" />
          ) : main ? (
            <div className="relative mt-12 flex w-full max-w-xl flex-col items-center">
              <div className="relative flex w-full justify-center">
                {left && <GhostCard review={left} side="left" />}
                {right && <GhostCard review={right} side="right" />}
                <ReviewCard
                  key={main.id}
                  review={main}
                  className="relative w-[300px] rounded-2xl border border-ink-100 bg-white p-6 shadow-[0_20px_50px_-12px_rgb(0_0_0/0.25)] animate-fade-in"
                />
              </div>
              {reviews.length > 1 && (
                <div className="mt-6 flex gap-2">
                  {reviews.map((r, i) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setOffset(i - index)}
                      aria-label={`Ver reseña ${i + 1} de ${reviews.length}`}
                      aria-current={i === current}
                      className={cn('h-2 rounded-full transition-all', i === current ? 'w-6 bg-brand-500' : 'w-2 bg-ink-300 hover:bg-ink-400')}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
