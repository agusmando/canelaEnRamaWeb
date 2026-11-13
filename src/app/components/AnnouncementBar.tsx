import { useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { useBannersQuery } from '../api/shopApi';
import { BannerLink, bannerColors } from './Banner';

const DISMISS_KEY = 'cer_announcement_dismissed';

function readDismissed(): string | null {
  try {
    return sessionStorage.getItem(DISMISS_KEY);
  } catch {
    return null;
  }
}

/**
 * Barra de anuncio (`ANNOUNCEMENT_BAR`) arriba del header: muestra el primer banner activo.
 * Se puede cerrar por la sesión (se recuerda qué versión se cerró: si cambia, vuelve a aparecer).
 */
export function AnnouncementBar() {
  const { data } = useBannersQuery('ANNOUNCEMENT_BAR');
  const banner = data?.find((b) => b.text?.trim() || b.headline?.trim());
  const [dismissed, setDismissed] = useState(readDismissed);

  if (!banner) return null;
  const version = `${banner.id}:${banner.updatedAt}`;
  if (dismissed === version) return null;

  const dismiss = () => {
    setDismissed(version);
    try {
      sessionStorage.setItem(DISMISS_KEY, version);
    } catch {
      /* sessionStorage no disponible: se oculta solo hasta recargar */
    }
  };

  const text = banner.text?.trim() || banner.headline!.trim();
  return (
    <div role="region" aria-label="Anuncio" className="bg-brand-500 text-white" style={bannerColors(banner)}>
      <div className="mx-auto flex max-w-[1440px] items-center gap-2 py-1.5 pr-1.5 pl-4 sm:pl-10">
        <p className="min-w-0 flex-1 text-center text-xs sm:text-sm">
          {banner.linkUrl ? (
            <BannerLink href={banner.linkUrl} className="inline-flex items-center gap-1.5 rounded font-medium hover:underline">
              {text}
              {banner.ctaLabel && <span className="underline underline-offset-2">{banner.ctaLabel}</span>}
              <ArrowRight className="size-3.5 shrink-0" aria-hidden />
            </BannerLink>
          ) : (
            text
          )}
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar anuncio"
          className="flex size-7 shrink-0 items-center justify-center rounded-full opacity-80 transition hover:bg-black/10 hover:opacity-100"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
