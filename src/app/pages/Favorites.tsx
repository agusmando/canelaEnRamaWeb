import { useMemo } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useAddToCartMutation, useCatalogQuery } from '../api/shopApi';
import { getErrorMessage } from '../api/client';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ProductGrid } from '../components/ProductCard';
import { EmptyState, ErrorState, Spinner } from '../components/States';
import { RecentlyViewed } from '../components/RecentlyViewed';
import { useAppDispatch, useAppSelector } from '../store';
import { setDrawerOpen } from '../store/cartSlice';
import { removeFavorite } from '../store/prefsSlice';
import { quickAddLine } from '../lib/shop';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/** Lista de deseos (guardada en el navegador). */
export default function Favorites() {
  useDocumentTitle('Favoritos');
  const ids = useAppSelector((s) => s.prefs.favorites);
  const { data: catalog, isLoading, error, refetch } = useCatalogQuery();
  const dispatch = useAppDispatch();
  const [add, { isLoading: adding }] = useAddToCartMutation();

  const products = useMemo(() => {
    const byId = new Map((catalog ?? []).map((p) => [p.id, p]));
    return ids.map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => !!p);
  }, [catalog, ids]);

  // Productos que ya no existen en el catálogo: se limpian de la lista.
  const missing = catalog ? ids.filter((id) => !catalog.some((p) => p.id === id)) : [];

  const quick = products.map(quickAddLine).filter((l): l is NonNullable<typeof l> => !!l);

  const addAll = async () => {
    try {
      await add(quick.map(({ label: _l, ...item }) => item)).unwrap();
      dispatch(setDrawerOpen(true));
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <div className="container-page">
      <Breadcrumbs items={[{ label: 'Favoritos' }]} />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-semibold text-ink-800">
            <span className="flex size-11 items-center justify-center rounded-full bg-brand-100 text-brand-500">
              <Heart className="size-5 fill-current" />
            </span>
            Mis favoritos
          </h1>
          {products.length > 0 && (
            <p className="mt-2 text-ink-500">
              {products.length} producto{products.length === 1 ? '' : 's'} guardado{products.length === 1 ? '' : 's'} en este dispositivo.
            </p>
          )}
        </div>
        {quick.length > 0 && (
          <button onClick={addAll} disabled={adding} className="btn-primary h-11 px-5">
            {adding ? <Spinner className="size-4" /> : <ShoppingCart className="size-4" />}
            Agregar {quick.length === products.length ? 'todos' : `${quick.length} disponibles`} al carrito
          </button>
        )}
      </div>

      {error ? (
        <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
      ) : !isLoading && products.length === 0 ? (
        <EmptyState
          icon={<Heart className="size-7" />}
          title="Todavía no guardaste favoritos"
          action={
            <Link to="/productos" className="btn-primary h-12 px-7">
              Explorar productos
            </Link>
          }
        >
          Tocá el corazón de cualquier producto para guardarlo y encontrarlo rápido la próxima vez.
        </EmptyState>
      ) : (
        <ProductGrid products={products} loading={isLoading} count={4} />
      )}

      {missing.length > 0 && (
        <button
          onClick={() => missing.forEach((id) => dispatch(removeFavorite(id)))}
          className="btn-ghost mt-6 px-3 py-2 text-sm text-ink-500"
        >
          <Trash2 className="size-4" /> Quitar {missing.length} producto{missing.length === 1 ? '' : 's'} que ya no está{missing.length === 1 ? '' : 'n'} disponible{missing.length === 1 ? '' : 's'}
        </button>
      )}

      <RecentlyViewed />
    </div>
  );
}
