import { Link } from 'react-router';
import { ArrowRight, Mail, ShieldCheck } from 'lucide-react';
import { useMyOrdersQuery } from '../api/shopApi';
import { useAppSelector } from '../store';
import { OrderRow } from './Orders';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function Profile() {
  useDocumentTitle('Mi cuenta', { noindex: true });
  const user = useAppSelector((s) => s.auth.user)!;
  const { data, isLoading } = useMyOrdersQuery({ page: 1, perPage: 3 });

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-ink-200 p-4 sm:p-6">
        <h1 className="text-2xl font-semibold text-ink-800">Mis datos</h1>
        <dl className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-ink-500">Nombre</dt>
            <dd className="mt-1 break-words text-ink-800">{user.name?.trim() || '—'}</dd>
          </div>
          <div>
            <dt className="text-sm text-ink-500">Email</dt>
            <dd className="mt-1 flex items-center gap-2 text-ink-800">
              <Mail className="size-4 shrink-0 text-ink-400" /> <span className="min-w-0 break-all">{user.email ?? '—'}</span>
            </dd>
          </div>
        </dl>
        <p className="mt-5 flex items-start gap-2 rounded-lg bg-ink-50 p-3 text-sm text-ink-600">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-leaf-600" />
          Para cambiar tu contraseña usá “¿Olvidaste tu contraseña?” en el ingreso. Si entrás con Google, tu cuenta se gestiona desde Google.
        </p>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
          <h2 className="text-xl font-semibold text-ink-800">Últimos pedidos</h2>
          <Link to="/mi-cuenta/pedidos" className="inline-flex items-center gap-1 text-sm font-medium text-brand-500 hover:underline">
            Ver todos <ArrowRight className="size-4" />
          </Link>
        </div>
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="skeleton h-24" />
            ))}
          </div>
        ) : data?.content.length ? (
          <ul className="space-y-3">
            {data.content.map((o) => (
              <OrderRow key={o.id} order={o} />
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-ink-300 p-6 text-center sm:p-8 text-ink-500">
            Todavía no hiciste pedidos.{' '}
            <Link to="/productos" className="font-medium text-brand-500 hover:underline">
              Empezá a comprar
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
