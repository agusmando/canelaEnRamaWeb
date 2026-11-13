import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useFavorite } from '../store';
import { cn } from '../lib/utils';

/** Corazón para agregar / quitar de favoritos. */
export function FavoriteButton({ productId, name, className, size = 'md' }: { productId: number; name?: string; className?: string; size?: 'sm' | 'md' }) {
  const [isFav, toggle] = useFavorite(productId);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
        if (!isFav) toast.success('Guardado en favoritos', { description: name, duration: 1800 });
      }}
      aria-pressed={isFav}
      aria-label={isFav ? `Quitar ${name ?? 'producto'} de favoritos` : `Guardar ${name ?? 'producto'} en favoritos`}
      title={isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      className={cn(
        'group/fav inline-flex shrink-0 items-center justify-center rounded-full transition-all active:scale-90',
        size === 'sm' ? 'size-8' : 'size-11',
        isFav ? 'text-brand-500' : 'text-ink-500 hover:text-brand-500',
        className,
      )}
    >
      <Heart
        key={String(isFav)}
        className={cn(size === 'sm' ? 'size-4' : 'size-5', isFav && 'animate-pop fill-current')}
        strokeWidth={2}
      />
    </button>
  );
}
