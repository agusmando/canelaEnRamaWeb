import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { usePublicGoogleReviews } from '../data/googleReviews';
import type { GoogleReview } from '../api/types';
import { CONTACT } from '../lib/contact';
import { cn, formatNumber } from '../lib/utils';
import { GoogleIcon } from './GoogleButton';
import { SectionHeader } from './SectionHeader';
import { Stars, formatRating } from './Stars';

const MAX_REVIEWS = 3;
const CLAMP_CHARS = 180;

/** "Lo que dicen nuestros clientes": puntaje del local + reseñas destacadas de Google. Se oculta si no hay reseñas. */
export function GoogleReviewsSection() {
  const { data } = usePublicGoogleReviews();
  const reviews = (data?.reviews ?? [])
    .filter((r) => r.text?.trim())
    .sort((a, b) => b.rating - a.rating)
    .slice(0, MAX_REVIEWS);
  if (!reviews.length) return null;
  const place = data?.place;
  const mapsUrl = CONTACT.mapsUrl;

  return (
    <section aria-label="Lo que dicen nuestros clientes" className="container-page pt-12 sm:pt-14">
      <SectionHeader
        title="Lo que dicen nuestros clientes"
        extra={
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-brand-500 transition-colors hover:bg-brand-50"
          >
            Ver todas en Google <ExternalLink className="size-4" />
          </a>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-ink-50 px-5 py-4">
        <span className="flex size-10 items-center justify-center rounded-lg border border-ink-200 bg-white shadow-card">
          <GoogleIcon className="size-6" />
        </span>
        <div>
          <p className="text-sm font-medium text-ink-600">Reseñas de Google</p>
          {place?.rating ? (
            <p className="flex flex-wrap items-center gap-2">
              <span className="text-2xl font-semibold text-ink-800 tabular-nums">{formatRating(place.rating)}</span>
              <Stars value={place.rating} className="text-lg" />
              {!!place.userRatingCount && <span className="text-sm text-ink-500">({formatNumber(place.userRatingCount)} opiniones)</span>}
            </p>
          ) : null}
        </div>
      </div>

      <ul className="grid gap-4 sm:grid-cols-3">
        {reviews.map((r) => (
          <li key={r.id}>
            <GoogleReviewCard review={r} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function GoogleReviewCard({ review, className }: { review: GoogleReview; className?: string }) {
  const [expanded, setExpanded] = useState(false);
  const text = review.text?.trim() ?? '';
  const long = text.length > CLAMP_CHARS;

  return (
    <figure className={cn('flex h-full flex-col rounded-xl border border-ink-200 bg-white p-4 shadow-card', className)}>
      <div className="flex items-center justify-between gap-3">
        <Stars value={review.rating} className="text-base" />
        <GoogleIcon className="size-4" />
      </div>
      <blockquote className={cn('mt-2.5 text-sm leading-relaxed whitespace-pre-line text-ink-700', long && !expanded && 'line-clamp-4')}>{text}</blockquote>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((x) => !x)}
          aria-expanded={expanded}
          className="mt-1 self-start rounded text-xs font-medium text-brand-500 hover:underline"
        >
          {expanded ? 'Ver menos' : 'Ver más'}
        </button>
      )}
      {review.relativeTime && <figcaption className="mt-auto pt-3 text-xs text-ink-400">{review.relativeTime}</figcaption>}
    </figure>
  );
}
