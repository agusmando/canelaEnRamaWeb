import { Link } from 'react-router';
import { CalendarClock, CreditCard, MapPin, MessageCircle, PackageCheck, Store, Truck } from 'lucide-react';
import { useShippingConfigQuery } from '../api/shopApi';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { TrackShipmentCta } from '../components/ShipmentTracking';
import { CONTACT, whatsappLink } from '../lib/contact';
import { etaLabel } from '../lib/shipments';
import { formatCurrency } from '../lib/utils';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const STEPS = [
  { icon: PackageCheck, title: 'Hacé tu pedido', text: 'Elegí productos, presentaciones y cantidades. Los descuentos se aplican solos en el carrito.' },
  { icon: MessageCircle, title: 'Te contactamos', text: 'Confirmamos stock, forma de pago y coordinamos el envío o retiro por WhatsApp.' },
  { icon: Truck, title: 'Recibí o retirá', text: 'Seguí el estado desde “Mis pedidos”: pendiente, en preparación, en camino y entregado.' },
];

export default function Shipping() {
  useDocumentTitle('Envíos', {
    description: 'Envíos a domicilio en el Gran Mendoza y retiro sin costo en nuestro local de Godoy Cruz. Zonas, costos y tiempos de entrega.',
  });
  const { data: config } = useShippingConfigQuery();
  const zones = config?.zones ?? [];
  return (
    <div className="container-page">
      <Breadcrumbs items={[{ label: 'Envíos' }]} />
      <h1 className="text-3xl font-semibold text-ink-800 sm:text-4xl">Envíos y retiros</h1>
      <p className="mt-4 max-w-2xl text-ink-600 sm:text-lg">Llevamos tu pedido a domicilio en el Gran Mendoza o lo podés retirar sin cargo por nuestro local.</p>

      <ol className="mt-10 grid gap-5 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="rounded-xl border border-ink-200 p-5 sm:p-6">
            <span className="flex size-11 items-center justify-center rounded-full bg-brand-500 text-white">
              <s.icon className="size-5" />
            </span>
            <p className="mt-4 text-sm font-medium text-brand-500">Paso {i + 1}</p>
            <h2 className="mt-1 text-lg font-semibold text-ink-800">{s.title}</h2>
            <p className="mt-2 text-ink-600">{s.text}</p>
          </li>
        ))}
      </ol>

      <TrackShipmentCta className="mt-10" />

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <section className="rounded-xl bg-brand-50 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-ink-800">
            <Truck className="size-5 text-brand-500" /> Envío a domicilio
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-ink-700">
            <li>Cubrimos Godoy Cruz, Capital, Guaymallén, Las Heras, Luján y Maipú.</li>
            <li>El costo depende de la zona y se informa al confirmar el pedido.</li>
            <li>Coordinamos día y franja horaria con vos.</li>
          </ul>
          {zones.length > 0 && (
            <ul className="mt-5 divide-y divide-brand-100 rounded-lg border border-brand-100 bg-white/60">
              {zones.map((z) => (
                <li key={z.name} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm">
                  <span className="flex min-w-0 items-center gap-2 font-medium text-ink-800">
                    <MapPin className="size-4 shrink-0 text-brand-500" />
                    <span className="truncate">{z.name}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3 text-ink-600">
                    {etaLabel(z.etaMinutes) && <span className="text-xs">{etaLabel(z.etaMinutes)}</span>}
                    <span className="font-semibold text-ink-800 tabular-nums">{Number(z.price) === 0 ? 'Gratis' : formatCurrency(z.price)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-xl bg-ink-50 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-ink-800">
            <Store className="size-5 text-brand-500" /> Retiro en el local
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-ink-700">
            <li>Sin costo, en {CONTACT.address}.</li>
            <li>Te avisamos cuando el pedido está listo para retirar.</li>
          </ul>
        </section>
        <section className="rounded-xl border border-ink-200 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-ink-800">
            <CalendarClock className="size-5 text-brand-500" /> Productos por encargo
          </h2>
          <p className="mt-3 text-ink-700">
            Algunos productos (como panificados caseros) se preparan por encargo: en la ficha del producto vas a ver los días de demora y la
            fecha estimada aparece en tu pedido.
          </p>
        </section>
        <section className="rounded-xl border border-ink-200 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-ink-800">
            <CreditCard className="size-5 text-brand-500" /> Medios de pago
          </h2>
          <p className="mt-3 text-ink-700">Mercado Pago (tarjeta de débito o crédito, dinero en cuenta o cuotas). Si retirás en el local, también podés pagar en efectivo o por transferencia al retirar.</p>
        </section>
      </div>

      <div className="mt-10 flex flex-col items-start gap-4 rounded-xl border border-ink-200 p-5 sm:flex-row sm:p-6 sm:items-center sm:justify-between">
        <p className="text-lg text-ink-800">¿Tenés una consulta sobre tu envío?</p>
        <div className="flex flex-wrap gap-3">
          <a href={whatsappLink('Hola! Tengo una consulta sobre envíos.')} target="_blank" rel="noreferrer" className="btn-outline h-11 px-5">
            <MessageCircle className="size-4" /> WhatsApp
          </a>
          <Link to="/productos" className="btn-primary h-11 px-5">
            Ir a comprar
          </Link>
        </div>
      </div>
    </div>
  );
}
