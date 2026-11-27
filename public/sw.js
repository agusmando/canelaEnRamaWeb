/* Service worker mínimo de Canela en Rama.
 * - Cache-first solo para assets estáticos propios con hash (/_astro no aplica: Vite usa /assets).
 * - Network-first para el resto: la tienda siempre muestra datos frescos (precios, stock).
 * - Nunca se cachean llamadas a la API ni respuestas no GET.
 */
const VERSION = 'v1';
const STATIC_CACHE = `cer-static-${VERSION}`;
const PAGE_CACHE = `cer-pages-${VERSION}`;
const MAX_PAGES = 20;

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.endsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isStaticAsset = (url) =>
  url.origin === self.location.origin && (url.pathname.startsWith('/assets/') || /\.(png|jpe?g|webp|avif|svg|ico|woff2?)$/.test(url.pathname));

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // La API y cualquier otro origen siempre van a la red.
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api')) return;

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(request, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // Navegaciones y datos: network-first con fallback a la última copia en caché.
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok && request.mode === 'navigate') {
          const copy = res.clone();
          caches.open(PAGE_CACHE).then(async (c) => {
            await c.put(request, copy);
            const keys = await c.keys();
            await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_PAGES)).map((k) => c.delete(k)));
          });
        }
        return res;
      })
      .catch(() =>
        caches.match(request).then((hit) => hit || (request.mode === 'navigate' ? caches.match('/') : Response.error())),
      ),
  );
});
