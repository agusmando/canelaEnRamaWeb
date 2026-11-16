import { Link } from 'react-router';
import { Facebook, Instagram, MapPin, Phone } from 'lucide-react';
import { useCategoriesQuery, useTagsQuery } from '../api/shopApi';
import { CONTACT, whatsappLink } from '../lib/contact';
import { slugify } from '../lib/shop';
import { Logo } from './Logo';

export function Footer() {
  const { data: categories = [] } = useCategoriesQuery();
  const { data: tags = [] } = useTagsQuery();

  return (
    <footer className="mt-16 bg-ink-800 text-white/80">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-6 pt-12 pb-24 sm:grid-cols-2 sm:px-8 sm:pb-12 lg:grid-cols-[1.3fr_1.4fr_auto_1fr_auto] lg:gap-12">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo variant="white" className="h-14" />
          <p className="mt-6 max-w-sm text-sm leading-relaxed">
            Canela en Rama – almacén natural {new Date().getFullYear()}. Todos los derechos reservados.
          </p>
          <p className="mt-5 max-w-sm text-sm leading-relaxed">
            Bienvenidos a nuestra tienda online. Frutos secos, harinas, especias, productos sin TACC y mucho más, a granel
            y fraccionados con la calidad de siempre.
          </p>
          <a href={CONTACT.mapsUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-start gap-3 font-semibold text-white hover:underline sm:items-center">
            <MapPin className="size-5 shrink-0" />
            {CONTACT.address}
          </a>
        </div>

        <div>
          <h2 className="mb-4 font-semibold tracking-wide text-white uppercase">Categorías</h2>
          <ul className="columns-2 gap-6 text-sm sm:columns-3">
            {categories.map((c) => (
              <li key={c.id} className="mb-2.5 break-inside-avoid">
                <Link to={`/productos?categoria=${slugify(c.name)}`} className="inline-block py-0.5 break-words hover:text-white hover:underline">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-4 font-semibold tracking-wide text-white uppercase">Tienda</h2>
          <ul className="space-y-2.5 text-sm">
            {[
              ['/productos', 'Todos los productos'],
              ['/ofertas', 'Ofertas'],
              ['/favoritos', 'Favoritos'],
              ['/mi-cuenta/pedidos', 'Mis pedidos'],
              ['/envios', 'Envíos y retiro'],
              ['/seguimiento', 'Seguí tu envío'],
            ].map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="inline-block py-0.5 whitespace-nowrap hover:text-white hover:underline">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-4 font-semibold tracking-wide text-white uppercase">Etiquetas</h2>
          <ul className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <li key={t.id}>
                <Link to={`/productos?etiqueta=${slugify(t.name)}`} className="chip border-white/60 text-sm hover:border-white hover:bg-white/10 hover:text-white">
                  {t.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-4 font-semibold tracking-wide text-white uppercase">Contacto</h2>
          <a href={whatsappLink()} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 text-sm whitespace-nowrap hover:text-white">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10">
              <Phone className="size-4" />
            </span>
            {CONTACT.phone}
          </a>
          <div className="mt-4 flex gap-2">
            <a href={CONTACT.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="flex size-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-brand-500 hover:text-white">
              <Instagram className="size-[18px]" />
            </a>
            <a href={CONTACT.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="flex size-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-brand-500 hover:text-white">
              <Facebook className="size-[18px]" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
