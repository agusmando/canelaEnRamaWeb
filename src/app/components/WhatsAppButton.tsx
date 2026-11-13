import { useLocation } from 'react-router';
import { whatsappLink } from '../lib/contact';

/** Botón flotante de WhatsApp para consultas rápidas. */
export function WhatsAppButton() {
  const { pathname } = useLocation();
  // En el carrito y el login no compite con las acciones principales.
  if (pathname === '/carrito' || pathname === '/login' || pathname === '/registro') return null;
  return (
    <a
      href={whatsappLink('Hola! Tengo una consulta sobre la tienda online.')}
      target="_blank"
      rel="noreferrer"
      aria-label="Escribinos por WhatsApp"
      title="Escribinos por WhatsApp"
      className="group fixed right-4 bottom-4 z-30 flex items-center gap-2 rounded-full bg-[#25d366] p-3.5 text-white shadow-[0_8px_24px_-6px_rgb(37_211_102/0.6)] transition-all hover:scale-105 hover:bg-[#1ebe5b] active:scale-95 sm:right-6 sm:bottom-6"
    >
      <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden>
        <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.42 9.42 0 0 1-1.44-5.02c0-5.2 4.24-9.44 9.45-9.44a9.38 9.38 0 0 1 6.68 2.77 9.38 9.38 0 0 1 2.76 6.68c0 5.21-4.24 9.44-9.45 9.44m8.04-17.48A11.3 11.3 0 0 0 12.05.7C5.78.7.68 5.8.67 12.06c0 2 .52 3.96 1.52 5.68L.57 23.7l6.1-1.6a11.33 11.33 0 0 0 5.37 1.37h.01c6.27 0 11.37-5.1 11.38-11.37a11.3 11.3 0 0 0-3.33-8.05" />
      </svg>
      <span className="hidden max-w-0 overflow-hidden text-sm font-medium whitespace-nowrap transition-all duration-300 group-hover:max-w-40 sm:inline">
        ¿Te ayudamos?
      </span>
    </a>
  );
}
