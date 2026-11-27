import { createRoot } from 'react-dom/client';
import App from './app/App';
import './styles/index.css';

// PWA: service worker solo en producción (en dev estorbaría con el HMR y el proxy de /api).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* PWA opcional: si falla, la tienda funciona igual */
    });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
