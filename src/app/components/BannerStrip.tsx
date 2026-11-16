import { useEffect, useState } from 'react';
import { useBannersQuery } from '../api/shopApi';
import { cn } from '../lib/utils';
import { BannerLink, BannerPicture } from './Banner';

/**
 * Tira de banners (`CATALOG_STRIP`, 1600×300 / mobile 800×300) para /productos y /ofertas.
 * Sin banners no renderiza nada; con varios rota sola (pausa al pasar el mouse o enfocar).
 */
export function BannerStrip({ className }: { className?: string }) {
  const { data } = useBannersQuery('CATALOG_STRIP');
  const banners = (data ?? []).filter((b) => b.desktopImageUrl || b.mobileImageUrl);
  const n = banners.length;
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setI((x) => (x < n ? x : 0));
  }, [n]);

  useEffect(() => {
    if (n < 2 || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setInterval(() => setI((x) => (x + 1) % n), 6000);
    return () => window.clearInterval(t);
  }, [paused, n]);

  if (!n) return null;

  return (
    <section
      aria-label="Promociones"
      aria-roledescription={n > 1 ? 'carrusel' : undefined}
      className={cn('relative overflow-hidden rounded-xl bg-ink-100', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="flex transition-transform duration-700 ease-out motion-reduce:transition-none" style={{ transform: `translateX(-${i * 100}%)` }}>
        {banners.map((b, idx) => (
          <div
            key={b.id}
            role={n > 1 ? 'group' : undefined}
            aria-roledescription={n > 1 ? 'diapositiva' : undefined}
            aria-label={n > 1 ? `${idx + 1} de ${n}` : undefined}
            aria-hidden={idx !== i}
            className="aspect-[8/3] w-full shrink-0 sm:aspect-[16/3]"
          >
            <BannerLink href={b.linkUrl} label={b.headline || b.name} tabIndex={idx === i ? 0 : -1} className="block size-full">
              <BannerPicture banner={b} width={1600} height={300} mobileWidth={800} mobileHeight={300} sizes="(min-width: 1200px) 1152px, 100vw" />
            </BannerLink>
          </div>
        ))}
      </div>
      {n > 1 && (
        <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-white/70 px-2 py-1 backdrop-blur">
          {banners.map((b, idx) => (
            <button
              key={b.id}
              onClick={() => setI(idx)}
              aria-label={`Ver promoción ${idx + 1}`}
              aria-current={idx === i}
              className={cn('h-1.5 rounded-full transition-all', idx === i ? 'w-5 bg-brand-500' : 'w-1.5 bg-ink-400 hover:bg-ink-500')}
            />
          ))}
        </div>
      )}
    </section>
  );
}
