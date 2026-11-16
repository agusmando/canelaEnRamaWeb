import { useEffect } from 'react';
import { Outlet, useLocation, useNavigationType } from 'react-router';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { CartDrawer } from '../components/CartDrawer';
import { WhatsAppButton } from '../components/WhatsAppButton';

export function StoreLayout() {
  const { pathname, search } = useLocation();
  const navType = useNavigationType();
  // Arriba de todo al cambiar de página, y también al navegar con un link a la misma página
  // con otros filtros (p. ej. elegir una categoría desde el menú estando en /productos).
  // Los filtros del catálogo usan `replace`, así que tildar un checkbox no mueve la página.
  const pushKey = navType === 'PUSH' ? search : '';
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname, pushKey]);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#contenido" className="sr-only z-50 rounded bg-brand-500 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Saltar al contenido
      </a>
      <AnnouncementBar />
      <Header />
      <main id="contenido" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <WhatsAppButton />
    </div>
  );
}
