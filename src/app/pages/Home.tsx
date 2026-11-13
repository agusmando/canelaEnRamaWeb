import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, CreditCard, Leaf, Store, Truck, WheatOff, Nut, Percent } from 'lucide-react';
import { useCatalogQuery, useCategoriesQuery } from '../api/shopApi';
import type { Product } from '../api/types';
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

function Hero() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = SLIDES.length;
  const go = (d: number) => setI((x) => (x + d + n) % n);

  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setInterval(() => setI((x) => (x + 1) % n), 6500);
    return () => window.clearInterval(t);
  }, [paused, n]);

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
      <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${i * 100}%)` }}>
        {SLIDES.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              role="group"
              aria-roledescription="diapositiva"
              aria-label={`${idx + 1} de ${n}`}
              aria-hidden={idx !== i}
              className={cn('relative w-full shrink-0 bg-gradient-to-r', s.bg)}
            >
              <div className="container-page flex min-h-[300px] items-center py-12 sm:min-h-[360px] sm:px-20">
                <div className="relative z-10 max-w-xl">
                  <p className="text-sm font-semibold tracking-wider text-brand-500 uppercase">{s.eyebrow}</p>
                  <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-tight text-ink-800 sm:text-5xl">{s.title}</h1>
                  <p className="mt-4 max-w-md text-ink-600 sm:text-lg">{s.text}</p>
                  <Link to={s.cta.to} tabIndex={idx === i ? 0 : -1} className="btn-primary mt-7 h-12 px-6 text-base">
                    {s.cta.label} <ArrowRight className="size-4" />
                  </Link>
                </div>
                <Icon className="pointer-events-none absolute right-[6%] hidden size-64 text-brand-500/10 md:block lg:size-80" strokeWidth={1} aria-hidden />
              </div>
            </div>
          );
        })}
      </div>

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
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            aria-label={`Ir a la diapositiva ${idx + 1}`}
            aria-current={idx === i}
            className={cn('h-2 rounded-full transition-all', idx === i ? 'w-6 bg-brand-500' : 'w-2 bg-ink-300 hover:bg-ink-400')}
          />
        ))}
      </div>
    </section>
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

const RECS = [
  { img: recFrutos, to: '/productos?categoria=frutos-secos', label: 'Elevá tus snacks con nuestros frutos secos', span: 'md:col-span-1' },
  { img: recSinTacc, to: '/productos?categoria=sin-tacc', label: 'Descubrí nuestros productos libres de gluten', span: 'md:col-span-2' },
  { img: recEspecias, to: '/productos?categoria=especias', label: 'Realzá tus recetas con nuestras especias únicas', span: 'md:col-span-2' },
  { img: recDesayuno, to: '/productos?categoria=cereales', label: 'Armá y amá tu desayuno', span: 'md:col-span-1' },
];

function Recommendations() {
  return (
    <section aria-labelledby="recs">
      <SectionHeader title="Nuestras recomendaciones" link={{ to: '/productos', label: 'Ver todas' }} />
      {/* Proporciones del diseño: tile cuadrado + tile ancho (≈ 1 : 2.84), alternados. */}
      <div className="space-y-3 sm:space-y-4">
        {[RECS.slice(0, 2), RECS.slice(2, 4)].map((row, k) => (
          <div key={k} className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            {row.map((r) => {
              const square = r.span === 'md:col-span-1';
              return (
                <Link
                  key={r.to}
                  to={r.to}
                  aria-label={r.label}
                  className={cn(
                    'group relative block overflow-hidden rounded-xl',
                    square ? 'aspect-[16/9] sm:aspect-square sm:w-[26%] sm:shrink-0' : 'aspect-[2.9/1] sm:aspect-auto sm:flex-1',
                  )}
                >
                  <img src={r.img} alt="" className="absolute inset-0 size-full object-cover object-left-bottom transition-transform duration-700 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-ink-900/0 transition-colors group-hover:bg-ink-900/10" />
                </Link>
              );
            })}
          </div>
        ))}
      </div>
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
