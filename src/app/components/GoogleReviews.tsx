import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useGoogleReviewsQuery } from '../api/shopApi';
import type { GoogleReview } from '../api/types';
import { CONTACT } from '../lib/contact';
import { cn, formatNumber } from '../lib/utils';
import { GoogleIcon } from './GoogleButton';
import { SectionHeader } from './SectionHeader';
import { Stars, formatRating } from './Stars';

const MAX_REVIEWS = 6;
const CLAMP_CHARS = 220;

/** "Lo que dicen nuestros clientes": puntaje del local + reseñas destacadas de Google. Se oculta si no hay reseñas. */
export function GoogleReviewsSection() {
  const { data } = useGoogleReviewsQuery();
  const reviews = (data?.reviews ?? []).filter((r) => r.text?.trim()).slice(0, MAX_REVIEWS);
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

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
  const author = review.authorUrl ? (
    <a href={review.authorUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
      {review.authorName}
    </a>
  ) : (
    review.authorName
  );

  return (
    <figure className={cn('flex h-full flex-col rounded-xl border border-ink-200 bg-white p-5 shadow-card', className)}>
      <div className="flex items-center justify-between gap-3">
        <Stars value={review.rating} className="text-lg" />
        <GoogleIcon className="size-5" />
      </div>
      <blockquote className={cn('mt-3 text-[15px] leading-relaxed whitespace-pre-line text-ink-700', long && !expanded && 'line-clamp-5')}>{text}</blockquote>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((x) => !x)}
          aria-expanded={expanded}
          className="mt-1 self-start rounded text-sm font-medium text-brand-500 hover:underline"
        >
          {expanded ? 'Ver menos' : 'Ver más'}
        </button>
      )}
      <figcaption className="mt-auto flex items-center gap-3 pt-4">
        <Avatar name={review.authorName} src={review.authorPhotoUrl} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-ink-800">{author}</span>
          {review.relativeTime && <span className="block text-xs text-ink-500">{review.relativeTime}</span>}
        </span>
      </figcaption>
    </figure>
  );
}

function Avatar({ name, src }: { name: string; src: string | null }) {
  const [broken, setBroken] = useState(false);
  if (src && !broken) {
    return (
      <img
        src={src}
        alt=""
        width={36}
        height={36}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className="size-9 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-600">
      {name.trim()[0]?.toUpperCase() ?? '?'}
    </span>
  );
}
