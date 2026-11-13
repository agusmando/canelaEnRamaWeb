import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router';
import type { Banner } from '../api/types';
import { isExternalUrl, isInternalPath } from '../lib/banners';
import { cn } from '../lib/utils';

/**
 * Envuelve el contenido de un banner con su link:
 * ruta interna → `<Link>`, URL absoluta → `<a target=_blank>`, sin link → `<div>`.
 */
export function BannerLink({
  href,
  className,
  style,
  children,
  tabIndex,
  label,
}: {
  href: string | null | undefined;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  tabIndex?: number;
  /** Nombre accesible cuando el contenido es solo una imagen. */
  label?: string;
}) {
  const url = href?.trim();
  if (url && isExternalUrl(url)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={className} style={style} tabIndex={tabIndex} aria-label={label}>
        {children}
      </a>
    );
  }
  if (url && isInternalPath(url)) {
    return (
      <Link to={url} className={className} style={style} tabIndex={tabIndex} aria-label={label}>
        {children}
      </Link>
    );
  }
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

/**
 * Imagen responsive del banner: la versión mobile por debajo de 640px (si no hay, la de escritorio).
 * `width`/`height` reservan el espacio (evitan saltos de layout); el contenedor define el recorte.
 */
export function BannerPicture({
  banner,
  width,
  height,
  mobileWidth,
  mobileHeight,
  eager,
  className,
}: {
  banner: Pick<Banner, 'name' | 'desktopImageUrl' | 'mobileImageUrl'>;
  width: number;
  height: number;
  mobileWidth?: number;
  mobileHeight?: number;
  /** Solo la primera imagen del hero se carga de inmediato. */
  eager?: boolean;
  className?: string;
}) {
  const desktop = banner.desktopImageUrl ?? banner.mobileImageUrl;
  if (!desktop) return null;
  const mobile = banner.mobileImageUrl;
  return (
    <picture>
      {mobile && mobile !== desktop && (
        <source media="(max-width: 639px)" srcSet={mobile} width={mobileWidth ?? width} height={mobileHeight ?? height} />
      )}
      <img
        src={desktop}
        alt={banner.name}
        width={width}
        height={height}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        {...(eager ? { fetchpriority: 'high' } : {})}
        className={cn('size-full object-cover', className)}
      />
    </picture>
  );
}

/** Colores opcionales definidos en el admin. */
export const bannerColors = (b: Pick<Banner, 'backgroundColor' | 'textColor'>): CSSProperties => ({
  ...(b.backgroundColor ? { backgroundColor: b.backgroundColor } : {}),
  ...(b.textColor ? { color: b.textColor } : {}),
});
