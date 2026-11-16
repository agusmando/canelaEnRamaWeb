import { Link, useLocation, useNavigate } from 'react-router';
import { ArrowLeft, Store, Truck } from 'lucide-react';
import { useShippingConfigQuery } from '../api/shopApi';
import { AddressForm } from '../components/AddressForm';
import { useAppSelector } from '../store';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/** "Mi domicilio": dirección de entrega para los envíos a domicilio. */
export default function Address() {
  useDocumentTitle('Mi domicilio');
  const user = useAppSelector((s) => s.auth.user)!;
  const { data: config } = useShippingConfigQuery();
  const navigate = useNavigate();
  // Si se llegó desde el carrito, al guardar se vuelve ahí.
  const from = (useLocation().state as { from?: string } | null)?.from;

  return (
    <section className="space-y-6">
      {from && (
        <Link to={from} className="btn-ghost -ml-2 h-9 px-2 text-sm text-ink-600">
          <ArrowLeft className="size-4" /> Volver
        </Link>
      )}
      <div className="rounded-xl border border-ink-200 p-4 sm:p-6">
        <h1 className="text-2xl font-semibold text-ink-800">Mi domicilio</h1>
        <p className="mt-1 mb-6 flex items-start gap-2 text-sm text-ink-500">
          <Truck className="mt-0.5 size-4 shrink-0 text-brand-500" />
          Lo usamos para calcular el costo y llevarte los pedidos con envío a domicilio.
        </p>
        <AddressForm defaultName={user.name?.trim() ?? ''} onSaved={() => from && navigate(from)} />
      </div>
      {config?.pickup && (
        <p className="flex items-start gap-2 rounded-lg bg-ink-50 p-3 text-sm text-ink-600">
          <Store className="mt-0.5 size-4 shrink-0 text-leaf-600" />
          <span>
            ¿Preferís retirar? Podés pasar sin cargo por {config.pickup.name} ({config.pickup.address}).
          </span>
        </p>
      )}
    </section>
  );
}
