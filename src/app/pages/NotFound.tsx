import { Link } from 'react-router';
import { Compass } from 'lucide-react';
import { EmptyState } from '../components/States';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('Página no encontrada');
  return (
    <div className="container-page py-10">
      <EmptyState
        icon={<Compass className="size-7" />}
        title="No encontramos esta página"
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/" className="btn-outline h-11 px-5">
              Ir al inicio
            </Link>
            <Link to="/productos" className="btn-primary h-11 px-5">
              Ver productos
            </Link>
          </div>
        }
      >
        Puede que el enlace esté roto o que la página se haya movido.
      </EmptyState>
    </div>
  );
}
