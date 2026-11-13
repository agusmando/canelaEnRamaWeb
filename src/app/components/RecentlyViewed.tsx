import { useMemo } from 'react';
import { History } from 'lucide-react';
import { useCatalogQuery } from '../api/shopApi';
import { useAppSelector } from '../store';
import { cardPrice } from '../lib/shop';
import { ProductGrid } from './ProductCard';
import { SectionHeader } from './SectionHeader';

/** Últimos productos que miró el visitante (guardados en el navegador). */
export function RecentlyViewed({ exclude, className = 'container-page mt-16' }: { exclude?: number; className?: string }) {
  const recent = useAppSelector((s) => s.prefs.recent);
  const { data: catalog } = useCatalogQuery();
  const products = useMemo(() => {
    const byId = new Map((catalog ?? []).map((p) => [p.id, p]));
    return recent
      .filter((id) => id !== exclude)
      .map((id) => byId.get(id))
      .filter((p): p is NonNullable<typeof p> => !!p && !!cardPrice(p))
      .slice(0, 4);
  }, [catalog, recent, exclude]);

  if (!products.length) return null;
  return (
    <section className={className} aria-label="Vistos recientemente">
      <SectionHeader title="Vistos recientemente" icon={<History className="size-5" />} />
      <ProductGrid products={products} />
    </section>
  );
}
