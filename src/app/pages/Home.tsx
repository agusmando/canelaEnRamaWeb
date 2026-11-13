import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, CreditCard, Leaf, Store, Truck, WheatOff, Nut, Percent, type LucideIcon } from 'lucide-react';
import { useBannersQuery, useCatalogQuery, useCategoriesQuery } from '../api/shopApi';
import type { Banner, BannerSize, Product } from '../api/types';
import { BannerLink, BannerPicture, bannerColors } from '../components/Banner';
import { GoogleReviewsSection } from '../components/GoogleReviews';
import { ProductGrid } from '../components/ProductCard';
import { SectionHeader } from '../components/SectionHeader';
import { CategoryIcon } from '../components/CategoryIcon';
import { ErrorState } from '../components/States';
import { RecentlyViewed } from '../components/RecentlyViewed';
import { cardPrice, hasOffer, inStock, productImages, slugify, webVariants } from '../lib/shop';
import { getErrorMessage } from '../api/client';
import { cn } from '../lib/utils';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import recFrutos from '@/assets/rec-frutos-secos.jpg';
import recSinTacc from '@/assets/rec-sin-tacc.jpg';
import recEspecias from '@/assets/rec-especias.jpg';
import recDesayuno from '@/assets/rec-desayuno.jpg';

/** Un producto "vendible": tiene variante web con precio. Primero los que tienen foto y stock. */
function rankForShowcase(products: Product[]) {
  const score = (p: Product) => (productImages(p).length ? 2 : 0) + (webVariants(p).some(inStock) ? 1 : 0);
  return products.filter((p) => cardPrice(p)).sort((a, b) => score(b) - score(a) || b.id - a.id);
}


export default function Home() {
  useDocumentTitle();
  const { data: catalog, isLoading, error, refetch } = useCatalogQuery();

  const { promo, promoTitle, featured } = useMemo(() => {
    const ranked = rankForShowcase(catalog ?? []);
    const offers = ranked.filter(hasOffer);
    const promo = (offers.length >= 4 ? offers : ranked).slice(0, 4);
    const rest = ranked.filter((p) => !promo.includes(p));
    // Con pocos productos, no dejar la sección vacía.
    const featured = (rest.length >= 4 ? rest : ranked).slice(0, 8);
    return { promo, promoTitle: offers.length >= 4 ? 'Ofertas de la semana' : 'Novedades', featured };
  }, [catalog]);

  return (
    <>
      <Hero />

      <div className="container-page space-y-16 py-12 sm:space-y-20 sm:py-14">
        {error ? (
          <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
        ) : (
          <section aria-labelledby="promo">
            <SectionHeader title={promoTitle} link={{ to: promoTitle.startsWith('Ofertas') ? '/ofertas' : '/productos?orden=nuevos', label: 'Ver más' }} />
            <ProductGrid products={promo} loading={isLoading} count={4} />
          </section>
        )}

        <RecentlyViewed className="" />

        <CategoryStrip />

        <Recommendations />
      </div>

      <Benefits />

      <GoogleReviewsSection />

      <div className="container-page py-12 sm:py-14">
        <section aria-labelledby="destacados">
          <SectionHeader title="Productos Destacados" />
          <ProductGrid products={featured} loading={isLoading} count={8} />
          {!isLoading && !error && (
            <div className="mt-8 flex justify-center">
              <Link to="/productos" className="btn-outline h-11 rounded-full px-8">
                Ver todos los productos <ArrowRight className="size-4" />
              </Link>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- Hero

const SLIDES = [
  {
    eyebrow: 'Almacén natural · Godoy Cruz',
    title: 'Lo natural, a granel y como lo necesitás',
    text: 'Frutos secos, harinas, legumbres y especias fraccionados en el momento. Elegí el peso y nosotros lo preparamos.',
    cta: { to: '/productos', label: 'Ver productos' },
    icon: Leaf,
    bg: 'from-brand-100 via-brand-50 to-white',
  },
  {
    eyebrow: 'Apto celíacos',
    title: 'Todo para tu cocina sin TACC',
    text: 'Harinas, premezclas, panificados y snacks libres de gluten, en un solo lugar.',
    cta: { to: '/productos?categoria=sin-tacc', label: 'Explorar Sin TACC' },
    icon: WheatOff,
    bg: 'from-[#eef6e0] via-[#f6faef] to-white',
  },
  {
    eyebrow: 'Ofertas',
    title: 'Llevá más, pagá menos',
    text: 'Descuentos por cantidad y promos en productos seleccionados. Se aplican solos en tu carrito.',
    cta: { to: '/ofertas', label: 'Ver ofertas' },
    icon: Percent,
    bg: 'from-[#fdf0dc] via-[#fff8ee] to-white',
  },
  {
    eyebrow: 'Snacks saludables',
    title: 'Frutos secos y mixes para cada momento',
    text: 'Almendras, nueces, castañas y nuestros mixes de la casa, frescos y al mejor precio.',
    cta: { to: '/productos?categoria=frutos-secos', label: 'Ver frutos secos' },
    icon: Nut,
    bg: 'from-[#f3e7dc] via-[#faf4ee] to-white',
  },
];

/** Una diapositiva del hero: viene de un banner del admin o del contenido por defecto (`SLIDES`). */
interface HeroSlide {
  key: string;
  eyebrow: string | null;
  title: string | null;
  text: string | null;
  cta: { to: string; label: string } | null;
  icon?: LucideIcon;
  /** Clases del degradé (contenido por defecto). */
  bg?: string;
  /** Banner del admin (colores, imagen, link). */
  banner?: Banner;
}

const FALLBACK_SLIDES: HeroSlide[] = SLIDES.map((s, idx) => ({ key: `default-${idx}`, ...s }));

function bannerToSlide(b: Banner): HeroSlide {
  return {
    key: `banner-${b.id}`,
    eyebrow: b.eyebrow,
    title: b.headline,
    text: b.text,
    cta: b.linkUrl && b.ctaLabel ? { to: b.linkUrl, label: b.ctaLabel } : null,
    banner: b,
  };
}

function Hero() {
  const { data: banners, isLoading } = useBannersQuery('HOME_HERO');
  // Si la API falla o no hay banners activos, se muestra el contenido de siempre.
  const slides = useMemo(() => (banners?.length ? banners.map(bannerToSlide) : FALLBACK_SLIDES), [banners]);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = slides.length;
  const go = (d: number) => setI((x) => (x + d + n) % n);

  useEffect(() => {
    setI((x) => (x < n ? x : 0));
  }, [n]);

  useEffect(() => {
    if (n < 2 || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setInterval(() => setI((x) => (x + 1) % n), 6500);
    return () => window.clearInterval(t);
  }, [paused, n]);

  if (isLoading) {
    return <div aria-hidden className="min-h-[300px] bg-gradient-to-r from-brand-100 via-brand-50 to-white sm:min-h-[360px]" />;
  }

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Destacados"
      className="relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="flex transition-transform duration-700 ease-out motion-reduce:transition-none" style={{ transform: `translateX(-${i * 100}%)` }}>
        {slides.map((s, idx) => (
          <div
            key={s.key}
            role="group"
            aria-roledescription="diapositiva"
            aria-label={`${idx + 1} de ${n}`}
            aria-hidden={idx !== i}
            className="relative w-full shrink-0"
          >
            {s.banner?.desktopImageUrl || s.banner?.mobileImageUrl ? (
              <ImageSlide slide={s} banner={s.banner} active={idx === i} eager={idx === 0} />
            ) : (
              <GradientSlide slide={s} active={idx === i} />
            )}
          </div>
        ))}
      </div>

      {n > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            aria-label="Anterior"
            className="btn-icon absolute top-1/2 left-3 hidden size-11 -translate-y-1/2 bg-white/80 shadow-card backdrop-blur hover:bg-white hover:text-brand-500 sm:inline-flex lg:left-8"
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Siguiente"
            className="btn-icon absolute top-1/2 right-3 hidden size-11 -translate-y-1/2 bg-white/80 shadow-card backdrop-blur hover:bg-white hover:text-brand-500 sm:inline-flex lg:right-8"
          >
            <ChevronRight className="size-6" />
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((s, idx) => (
              <button
                key={s.key}
                onClick={() => setI(idx)}
                aria-label={`Ir a la diapositiva ${idx + 1}`}
                aria-current={idx === i}
                className={cn('h-2 rounded-full transition-all', idx === i ? 'w-6 bg-brand-500' : 'w-2 bg-ink-300 hover:bg-ink-400')}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/** Diapositiva sin imagen: degradé + texto (colores del banner si los tiene). */
function GradientSlide({ slide: s, active }: { slide: HeroSlide; active: boolean }) {
  const Icon = s.icon ?? Leaf;
  const colors = s.banner ? bannerColors(s.banner) : {};
  const custom = !!s.banner?.textColor;
  const cta = s.cta ?? (s.banner?.linkUrl ? { to: s.banner.linkUrl, label: 'Ver más' } : null);
  return (
    <div className={cn('h-full bg-gradient-to-r', s.bg ?? 'from-brand-100 via-brand-50 to-white')} style={colors}>
      <div className="container-page relative flex h-full min-h-[300px] items-center py-12 sm:min-h-[360px] sm:px-20">
        <div className="relative z-10 max-w-xl">
          {s.eyebrow && <p className={cn('text-sm font-semibold tracking-wider uppercase', custom ? 'opacity-80' : 'text-brand-500')}>{s.eyebrow}</p>}
          {s.title && (
            <h1 className={cn('mt-3 text-3xl leading-tight font-semibold tracking-tight sm:text-5xl', !custom && 'text-ink-800')}>{s.title}</h1>
          )}
          {s.text && <p className={cn('mt-4 max-w-md sm:text-lg', custom ? 'opacity-90' : 'text-ink-600')}>{s.text}</p>}
          {cta && (
            <BannerLink href={cta.to} tabIndex={active ? 0 : -1} className="btn-primary mt-7 h-12 px-6 text-base">
              {cta.label} <ArrowRight className="size-4" />
            </BannerLink>
          )}
        </div>
        <Icon
          className={cn('pointer-events-none absolute right-[6%] hidden size-64 md:block lg:size-80', custom ? 'opacity-10' : 'text-brand-500/10')}
          strokeWidth={1}
          aria-hidden
        />
      </div>
    </div>
  );
}

/** Diapositiva con imagen (1920×600 / mobile 800×800) y texto opcional superpuesto. */
function ImageSlide({ slide: s, banner, active, eager }: { slide: HeroSlide; banner: Banner; active: boolean; eager: boolean }) {
  const hasText = !!(s.eyebrow || s.title || s.text || s.cta);
  const image = (
    <BannerPicture banner={banner} width={1920} height={600} mobileWidth={800} mobileHeight={800} eager={eager} />
  );
  return (
    <div className="relative aspect-square w-full overflow-hidden bg-ink-100 sm:aspect-[2.4/1] lg:aspect-[3.2/1]" style={bannerColors(banner)}>
      {/* Sin CTA: toda la imagen es el link. */}
      {!s.cta && banner.linkUrl ? (
        <BannerLink href={banner.linkUrl} tabIndex={active ? 0 : -1} label={s.title || banner.name} className="absolute inset-0 block">
          {image}
        </BannerLink>
      ) : (
        <div className="absolute inset-0">{image}</div>
      )}
      {hasText && (
        <div
          className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/55 via-black/15 to-transparent sm:items-center sm:bg-gradient-to-r sm:from-black/50 sm:via-black/20"
          style={{ color: banner.textColor ?? '#fff' }}
        >
          <div className="container-page pb-12 sm:px-20 sm:pb-0">
            <div className="max-w-xl">
              {s.eyebrow && <p className="text-sm font-semibold tracking-wider uppercase opacity-90">{s.eyebrow}</p>}
              {s.title && <h1 className="mt-2 text-3xl leading-tight font-semibold tracking-tight sm:mt-3 sm:text-5xl">{s.title}</h1>}
              {s.text && <p className="mt-3 line-clamp-3 max-w-md opacity-90 sm:mt-4 sm:text-lg">{s.text}</p>}
              {s.cta && (
                <BannerLink href={s.cta.to} tabIndex={active ? 0 : -1} className="btn-primary pointer-events-auto mt-5 h-12 px-6 text-base sm:mt-7">
                  {s.cta.label} <ArrowRight className="size-4" />
                </BannerLink>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Categorías

function CategoryStrip() {
  const { data: categories, isLoading } = useCategoriesQuery();
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (d: number) => ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.8, behavior: 'smooth' });

  return (
    <section aria-labelledby="cats">
      <SectionHeader
        title="Buscá por categorías"
        extra={
          <div className="flex gap-3">
            <button onClick={() => scroll(-1)} aria-label="Categorías anteriores" className="btn-icon size-9 border border-ink-200 hover:border-brand-300 hover:text-brand-500">
              <ArrowLeft className="size-4" />
            </button>
            <button onClick={() => scroll(1)} aria-label="Más categorías" className="btn-icon size-9 border border-ink-200 hover:border-brand-300 hover:text-brand-500">
              <ArrowRight className="size-4" />
            </button>
          </div>
        }
      />
      <div ref={ref} className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:gap-[26px] sm:px-0">
        {isLoading
          ? Array.from({ length: 7 }, (_, i) => <div key={i} className="skeleton h-[110px] w-[110px] shrink-0 sm:h-[124px] sm:w-[124px]" />)
          : categories?.map((c) => (
              <Link
                key={c.id}
                to={`/productos?categoria=${slugify(c.name)}`}
                className="group flex h-[110px] w-[110px] shrink-0 snap-start flex-col items-center justify-center gap-3 rounded-lg bg-brand-100 px-2 text-center transition-all hover:-translate-y-0.5 hover:bg-brand-200/70 hover:shadow-card sm:h-[124px] sm:w-[124px]"
              >
                <CategoryIcon name={c.name} className="size-10 text-brand-500 transition-transform group-hover:scale-110 sm:size-12" />
                <span className="line-clamp-2 text-sm leading-tight text-ink-700">{c.name}</span>
              </Link>
            ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- Recomendaciones

interface RecTile {
  key: string;
  img: string;
  mobileImg?: string | null;
  to: string | null;
  label: string;
  alt: string;
  size: BannerSize;
}

const RECS: RecTile[] = [
  { key: 'frutos', img: recFrutos, to: '/productos?categoria=frutos-secos', label: 'Elevá tus snacks con nuestros frutos secos', alt: '', size: 'SQUARE' },
  { key: 'sin-tacc', img: recSinTacc, to: '/productos?categoria=sin-tacc', label: 'Descubrí nuestros productos libres de gluten', alt: '', size: 'WIDE' },
  { key: 'especias', img: recEspecias, to: '/productos?categoria=especias', label: 'Realzá tus recetas con nuestras especias únicas', alt: '', size: 'WIDE' },
  { key: 'desayuno', img: recDesayuno, to: '/productos?categoria=cereales', label: 'Armá y amá tu desayuno', alt: '', size: 'SQUARE' },
];

const bannerToTile = (b: Banner): RecTile | null => {
  const img = b.desktopImageUrl ?? b.mobileImageUrl;
  if (!img) return null;
  return { key: `banner-${b.id}`, img, mobileImg: b.mobileImageUrl, to: b.linkUrl, label: b.headline || b.name, alt: b.name, size: b.size ?? 'WIDE' };
};

/** Agrupa de a dos por fila (el diseño alterna cuadrado + ancho); el último puede quedar solo. */
const toRows = <T,>(items: T[]) => Array.from({ length: Math.ceil(items.length / 2) }, (_, k) => items.slice(k * 2, k * 2 + 2));

/** Clases de cada tile según su tamaño y el de su compañero de fila. */
function tileClass(tile: RecTile, row: RecTile[]) {
  if (row.length === 1) return tile.size === 'SQUARE' ? 'aspect-[16/9] sm:aspect-[3/1]' : 'aspect-[2.9/1]';
  const mixed = row[0].size !== row[1].size;
  if (mixed) return tile.size === 'SQUARE' ? 'aspect-[16/9] sm:aspect-square sm:w-[26%] sm:shrink-0' : 'aspect-[2.9/1] sm:aspect-auto sm:flex-1';
  // Dos del mismo tamaño: comparten la fila a partes iguales.
  return tile.size === 'SQUARE' ? 'aspect-[16/9] sm:aspect-[4/3] sm:flex-1' : 'aspect-[2.9/1] sm:aspect-[2.4/1] sm:flex-1';
}

function Recommendations() {
  const { data: banners, isLoading } = useBannersQuery('HOME_RECOMMENDATION');
  const tiles = useMemo(() => {
    const fromApi = (banners ?? []).map(bannerToTile).filter((t): t is RecTile => !!t);
    return fromApi.length ? fromApi : RECS;
  }, [banners]);

  return (
    <section aria-labelledby="recs">
      <SectionHeader title="Nuestras recomendaciones" link={{ to: '/productos', label: 'Ver todas' }} />
      {isLoading ? (
        <div className="space-y-3 sm:space-y-4" aria-hidden>
          {[0, 1].map((k) => (
            <div key={k} className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <div className={cn('skeleton aspect-[16/9] rounded-xl sm:aspect-square sm:w-[26%]', k && 'sm:order-2')} />
              <div className="skeleton aspect-[2.9/1] rounded-xl sm:aspect-auto sm:flex-1" />
            </div>
          ))}
        </div>
      ) : (
        /* Proporciones del diseño: tile cuadrado + tile ancho (≈ 1 : 2.84), alternados. */
        <div className="space-y-3 sm:space-y-4">
          {toRows(tiles).map((row, k) => (
            <div key={k} className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              {row.map((r) => (
                <BannerLink
                  key={r.key}
                  href={r.to}
                  label={r.label}
                  className={cn('group relative block overflow-hidden rounded-xl bg-ink-100', tileClass(r, row))}
                >
                  <picture>
                    {r.mobileImg && r.mobileImg !== r.img && <source media="(max-width: 639px)" srcSet={r.mobileImg} />}
                    <img
                      src={r.img}
                      alt={r.alt}
                      width={r.size === 'SQUARE' ? 600 : 1200}
                      height={r.size === 'SQUARE' ? 600 : 420}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 size-full object-cover object-left-bottom transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none"
                    />
                  </picture>
                  <span className="absolute inset-0 bg-ink-900/0 transition-colors group-hover:bg-ink-900/10" />
                </BannerLink>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
// ---------------------------------------------------------------- Beneficios

const BENEFITS = [
  { icon: Truck, title: 'Envíos en Mendoza', text: 'Llevamos tu pedido a domicilio en el Gran Mendoza.' },
  { icon: Store, title: 'Retiro en el local', text: 'Colombia 1268, Godoy Cruz. Sin costo.' },
  { icon: Leaf, title: 'Calidad natural', text: 'Productos frescos, fraccionados en el día.' },
  { icon: CreditCard, title: 'Pagá como quieras', text: 'Mercado Pago, transferencia, efectivo o tarjeta.' },
];

function Benefits() {
  return (
    <section aria-label="Beneficios" className="bg-ink-50">
      <div className="container-page grid grid-cols-1 gap-8 py-12 sm:grid-cols-2 sm:py-14 lg:grid-cols-4">
        {BENEFITS.map((b) => (
          <div key={b.title} className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-brand-500 shadow-card">
              <b.icon className="size-6" strokeWidth={1.5} />
            </span>
            <div>
              <h3 className="font-semibold text-ink-800">{b.title}</h3>
              <p className="mt-1 text-sm text-ink-500">{b.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
