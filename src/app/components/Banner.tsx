import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router';
import type { Banner } from '../api/types';
import { isExternalUrl, isInternalPath } from '../lib/banners';
import { cn } from '../lib/utils';
import { cld, cldSrcSet } from '../lib/cloudinary';

const DESKTOP_WIDTHS = [640, 960, 1280, 1600, 1920, 2560];
const MOBILE_WIDTHS = [400, 640, 800, 1080, 1200];
/** Candidatos del srcset: hasta 1.5× el tamaño nominal del banner (Cloudinary nunca agranda: `c_limit`). */
const upTo = (widths: number[], max: number) => {
  const list = widths.filter((w) => w <= max * 1.5);
  return list.length ? list : [max];
};

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
  sizes = '100vw',
  className,
}: {
  banner: Pick<Banner, 'name' | 'desktopImageUrl' | 'mobileImageUrl'>;
  width: number;
  height: number;
  mobileWidth?: number;
  mobileHeight?: number;
  /** Solo la primera imagen del hero se carga de inmediato. */
  eager?: boolean;
  /** Ancho en que se muestra (atributo `sizes`) en escritorio; en mobile siempre ocupa el ancho de la pantalla. */
  sizes?: string;
  className?: string;
}) {
  const desktop = banner.desktopImageUrl ?? banner.mobileImageUrl;
  if (!desktop) return null;
  const mobile = banner.mobileImageUrl;
  return (
    <picture>
      {mobile && mobile !== desktop && (
        <source
          media="(max-width: 639px)"
          srcSet={cldSrcSet(mobile, upTo(MOBILE_WIDTHS, mobileWidth ?? width)) ?? mobile}
          sizes="100vw"
          width={mobileWidth ?? width}
          height={mobileHeight ?? height}
        />
      )}
      <img
        src={cld(desktop, { w: width })}
        srcSet={cldSrcSet(desktop, upTo(DESKTOP_WIDTHS, width))}
        sizes={`(max-width: 639px) 100vw, ${sizes}`}
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

/** Blanco o tinta según la luminancia del fondo (soporta #hex, #rgba y rgb()/rgba()). */
function contrastColor(bg: string): string | undefined {
  const value = bg.trim();
  let r = 0;
  let g = 0;
  let b = 0;
  const hex = value.match(/^#([0-9a-f]{3,8})$/i)?.[1];
  if (hex) {
    const h = hex.length <= 4 ? hex.split('').map((c) => c + c).join('') : hex.slice(0, 6);
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
  } else {
    const parts = value.match(/^rgba?\(([^)]+)\)/i)?.[1]?.split(',').slice(0, 3);
    if (!parts) return undefined;
    [r, g, b] = parts.map((v) => Number(v.trim()) || 0);
  }
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#1c1917' : '#ffffff';
}

/**
 * Colores opcionales definidos en el admin. Si hay fondo propio y no eligieron
 * color de texto, se calcula uno legible automáticamente.
 */
export const bannerColors = (b: Pick<Banner, 'backgroundColor' | 'textColor'>): CSSProperties => {
  const style: CSSProperties = {};
  if (b.backgroundColor) style.backgroundColor = b.backgroundColor;
  const fg = b.textColor ?? (b.backgroundColor ? contrastColor(b.backgroundColor) : undefined);
  if (fg) style.color = fg;
  return style;
};
