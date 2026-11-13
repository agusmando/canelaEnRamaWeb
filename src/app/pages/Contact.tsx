import { Clock, Facebook, Instagram, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { CONTACT, whatsappLink } from '../lib/contact';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function Contact() {
  useDocumentTitle('Contacto');
  const items = [
    { icon: MapPin, title: 'Visitanos', text: CONTACT.address, href: CONTACT.mapsUrl, cta: 'Cómo llegar' },
    { icon: MessageCircle, title: 'WhatsApp', text: CONTACT.phone, href: whatsappLink('Hola Canela en Rama! Quería hacer una consulta.'), cta: 'Escribinos' },
    { icon: Instagram, title: 'Instagram', text: 'Novedades, recetas y promos', href: CONTACT.instagram, cta: 'Seguinos' },
    { icon: Facebook, title: 'Facebook', text: 'Sumate a la comunidad', href: CONTACT.facebook, cta: 'Visitar' },
  ];
  return (
    <div className="container-page">
      <Breadcrumbs items={[{ label: 'Contacto' }]} />
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <h1 className="text-4xl font-semibold text-ink-800">Contacto</h1>
          <p className="mt-4 max-w-lg text-lg text-ink-600">
            ¿Tenés dudas sobre un producto, un pedido o querés encargar algo especial? Estamos para ayudarte.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {items.map((i) => (
              <li key={i.title}>
                <a href={i.href} target="_blank" rel="noreferrer" className="group flex h-full flex-col rounded-xl border border-ink-200 p-5 transition-colors hover:border-brand-300 hover:bg-brand-50/40">
                  <span className="flex size-11 items-center justify-center rounded-full bg-brand-100 text-brand-500">
                    <i.icon className="size-5" />
                  </span>
                  <span className="mt-4 font-semibold text-ink-800">{i.title}</span>
                  <span className="mt-1 text-sm text-ink-500">{i.text}</span>
                  <span className="mt-3 text-sm font-medium text-brand-500 group-hover:underline">{i.cta} →</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-6 flex items-center gap-2 text-sm text-ink-500">
            <Clock className="size-4" /> Respondemos mensajes de lunes a sábado en horario comercial.
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm text-ink-500">
            <Phone className="size-4" /> {CONTACT.phone}
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border border-ink-200">
          <iframe title="Mapa de Canela en Rama" src={CONTACT.mapsEmbed} className="h-[360px] w-full lg:h-full lg:min-h-[460px]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </div>
      </div>
    </div>
  );
}
