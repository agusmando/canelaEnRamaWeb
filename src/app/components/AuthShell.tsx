import type { ReactNode } from 'react';
import { Star } from 'lucide-react';
import { CONTACT } from '../lib/contact';
import { GoogleIcon } from './GoogleButton';

/**
 * Reseñas que se muestran junto al login (tomadas del diseño).
 * Reemplazar por reseñas reales de Google del local.
 */
const RATING = { score: 4.9, total: 63 };
const REVIEWS = [
  {
    text: 'Excelente atención! Gran variedad de productos. El pan integral casero es delicioso y con muchas semillas, es por encargue y super fresco! Lo recomiendo.',
    author: 'Lucas Dominguez',
    when: 'Hace 3 años',
  },
];

function Stars({ className }: { className?: string }) {
  return (
    <span className={className} aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className="inline size-[1em] fill-[#fbbc04] text-[#fbbc04]" />
      ))}
    </span>
  );
}

function ReviewCard({ review, className }: { review: (typeof REVIEWS)[number]; className?: string }) {
  return (
    <figure className={className}>
      <div className="flex items-center justify-between">
        <Stars className="text-2xl" />
        <GoogleIcon className="size-6" />
      </div>
      <blockquote className="mt-4 text-[15px] leading-relaxed text-ink-800">{review.text}</blockquote>
      <figcaption className="mt-4 flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-600">{review.author[0]}</span>
        <span>
          <span className="block text-sm font-semibold text-ink-800">{review.author}</span>
          <span className="block text-xs text-ink-500">{review.when}</span>
        </span>
      </figcaption>
    </figure>
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  const review = REVIEWS[0];
  return (
    <div className="container-page py-10 sm:py-14">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-0">
        <div className="lg:border-r lg:border-ink-200 lg:pr-16">{children}</div>

        <aside aria-label="Reseñas de clientes" className="hidden flex-col items-center lg:flex lg:pl-16">
          <p className="text-[32px] font-semibold text-ink-800">{RATING.score} Estrellas</p>
          <Stars className="mt-1 text-[40px] tracking-wider" />
          <p className="mt-2 text-lg text-ink-600">
            Basado en{' '}
            <a href={CONTACT.mapsUrl} target="_blank" rel="noreferrer" className="font-semibold text-ink-800 underline underline-offset-2">
              {RATING.total} reviews
            </a>
          </p>
          <div className="mt-8 flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-lg border border-ink-200 bg-white shadow-card">
              <GoogleIcon className="size-8" />
            </span>
            <span className="text-2xl font-semibold text-ink-800">Google Reviews</span>
          </div>

          <div className="relative mt-12 flex w-full max-w-xl justify-center">
            <div aria-hidden className="absolute top-8 left-0 h-48 w-56 rounded-2xl bg-white p-5 opacity-70 shadow-lift blur-[2px]">
              <Stars className="text-lg" />
              <div className="mt-4 space-y-2">
                <div className="h-2.5 w-full rounded bg-ink-200" />
                <div className="h-2.5 w-5/6 rounded bg-ink-200" />
                <div className="h-2.5 w-4/6 rounded bg-ink-200" />
              </div>
            </div>
            <div aria-hidden className="absolute top-8 right-0 h-48 w-56 rounded-2xl bg-white p-5 opacity-70 shadow-lift blur-[2px]">
              <div className="flex justify-end">
                <GoogleIcon className="size-5" />
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-2.5 w-full rounded bg-ink-200" />
                <div className="h-2.5 w-4/6 rounded bg-ink-200" />
              </div>
            </div>
            <ReviewCard review={review} className="relative w-[300px] rounded-2xl border border-ink-100 bg-white p-6 shadow-[0_20px_50px_-12px_rgb(0_0_0/0.25)]" />
          </div>
        </aside>
      </div>
    </div>
  );
}
