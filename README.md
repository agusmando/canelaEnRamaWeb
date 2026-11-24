# Canela en Rama · Tienda online

Sitio público de Canela en Rama en React + Vite, construido a partir del diseño de Figma
(`../Canela en Rama redesign`) y consumiendo el backend documentado en
`../canelaEnRamaBack/postman/CanelaEnRama.postman_collection.json`.
Mismo stack que el panel `ecommerceDashboard`: React 18, Redux Toolkit + RTK Query, React Router 7, Tailwind 4, axios.

## Puesta en marcha

```bash
npm i
cp .env.example .env   # opcional
npm run dev            # http://localhost:5173 (puerto fijo: lo usa el callback de Google)
```

| Variable | Uso |
| --- | --- |
| `VITE_API_URL` | URL del backend **sin** `/api`. Vacía = mismo origen (en dev, proxy de Vite). |
| `VITE_API_PROXY_TARGET` | Destino del proxy en `npm run dev` (default `http://localhost:8080`). |
| `VITE_API_TIMEOUT` | Timeout por request en ms. |
| `VITE_WHATSAPP`, `VITE_INSTAGRAM_URL`, `VITE_FACEBOOK_URL` | Datos de contacto del sitio. |

## Login con Google (SuperTokens ThirdParty)

1. El front pide `GET /auth/authorisationurl?thirdPartyId=google&redirectURIOnProviderDashboard=<origen>/auth/callback/google`,
   guarda `state` + `pkceCodeVerifier` en sessionStorage y redirige a Google.
2. Google vuelve a `/auth/callback/google`; el front valida `state` y llama `POST /auth/signinup`.
   El backend crea/actualiza el `User` (nombre y avatar de Google).

Requisitos de configuración:
- En Google Cloud Console, agregar `http://localhost:5173/auth/callback/google` (y el dominio de producción) como *Authorized redirect URI*.
- En el backend, `WEBSITE_DOMAIN` debe ser el dominio de esta tienda (los emails de recuperación de contraseña apuntan a `<WEBSITE_DOMAIN>/auth/reset-password`).
- En producción, `CORS_ORIGINS` del backend debe incluir el dominio de la tienda.

## SEO y Cloudflare Pages Functions

La tienda es una SPA: los títulos/descripciones/Open Graph/JSON-LD se actualizan en el navegador
(`src/app/hooks/useSeo.ts`, datos en `src/app/lib/seo.ts`), pero WhatsApp, Facebook o Instagram no ejecutan JS.
Por eso hay **Pages Functions** en `functions/` (Cloudflare las despliega solas junto con `dist/`):

| Ruta | Qué hace |
| --- | --- |
| `/sitemap.xml` (`functions/sitemap.xml.ts`) | Home, `/productos`, `/ofertas`, `/contacto`, `/envios` + `/producto/:id` de cada producto activo (`GET /api/product?active=true&detalle=true&paginate=false`). Cache 1 h (5 min si la API falló). |
| `/producto/:id` (`functions/producto/[id].ts`) | Sirve el `index.html` de la SPA con `<title>`, description, canonical, `og:*`, `twitter:*` y JSON-LD `Product` del producto (`GET /api/product/:id`, timeout 2 s). Si la API falla devuelve la página sin cambios. |

`public/robots.txt` apunta al sitemap; la imagen por defecto para compartir es `public/og-image.jpg` (1200×630).

**Variable de entorno** (Cloudflare Pages → Settings → Variables and Secrets; es distinta de las `VITE_*`, que se usan solo en el build):

| Entorno | `API_URL` | `SITE_URL` |
| --- | --- | --- |
| Production | `https://api.canelaenrama.com.ar` | `https://canelaenrama.com.ar` |
| Preview | `https://api-dev.canelaenrama.com.ar` | `https://dev.canelaenrama.com.ar` |

`SITE_URL` fija el dominio de los enlaces canónicos y del sitemap (sin ella se usa el del request, que en previews es `*.pages.dev`).

Sin `API_URL` las Functions no fallan: el sitemap sale solo con las páginas fijas y el detalle sin metadatos del producto.

Las respuestas de las Functions no reciben los headers de `public/_headers`: `functions/_lib/api.ts` agrega los de seguridad
(incluida la CSP) si faltan — mantenerlos sincronizados.

Probar en local:

```bash
npm run build
npx wrangler pages dev dist --binding API_URL=https://api-dev.canelaenrama.com.ar
curl -s http://localhost:8788/sitemap.xml
curl -s http://localhost:8788/producto/1 | grep -E 'og:|<title>|ld\+json'
npx tsc --noEmit -p functions   # chequeo de tipos de las Functions (Workers runtime)
```

Para revisar las previews reales: [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) y
[Rich Results Test](https://search.google.com/test/rich-results) de Google.

## Pantallas y endpoints

| Pantalla | Endpoints |
| --- | --- |
| Inicio, catálogo, búsqueda | `GET /product?active=true&detalle=true&paginate=false` (una vez, cacheado; filtros/orden en el front), `GET /category`, `GET /tag`, `GET /brand` (filtro por marca) |
| Producto | `GET /product/:id` |
| Carrito (invitado o usuario) | `POST /cart`, `GET /cart/me`, `GET/PUT /cart/:token` (`addItem`, `editItem`, `removeItem`, `clear`) |
| Login / registro | `POST /auth/signin`, `POST /auth/signup`, Google (arriba), `GET /user/me`, `POST /auth/signout`, `POST /auth/session/refresh` |
| Al ingresar | `PUT /cart/:sessionId {mergeGuestCart: true}` — el carrito de invitado pasa al usuario |
| Recuperar contraseña | `POST /auth/user/password/reset/token`, `POST /auth/user/password/reset` |
| Checkout | `POST /order {fromCart: true, paymentType}` |
| Mis pedidos | `GET /order/mine`, `GET /order/:id`, `PUT /order/:id {status: CANCELLED}` (solo PENDING) |
| Volver a comprar | `POST /cart` / `PUT /cart/:token {addItem}` con las líneas del pedido |
| Ofertas (`/ofertas`) | Catálogo agrupado por `Offer.discountType` |
| Favoritos (`/favoritos`) y vistos recientemente | Sin endpoint: se guardan en el navegador (`localStorage`, clave `cer_prefs`) |

Sesión: SuperTokens en modo header (tokens en localStorage, refresh automático ante 401), igual que el dashboard.
El carrito de invitado se identifica con el `sessionId` que devuelve `POST /cart` (guardado en localStorage).

## Notas de diseño

- Se respetó el diseño (header, tarjetas, catálogo con filtros, ficha con selector de peso, carrito, login con reseñas).
- Mejoras: buscador con sugerencias, carrusel con contenido, panel lateral al agregar al carrito, conteos y rango de precio
  reales, filtros en mobile, orden por precio/nombre, seguimiento de pedidos, páginas de Contacto y Envíos, skeletons y estados vacíos.
- El bloque "Ingresá tu cupón" del diseño se reemplazó por la elección de **forma de pago**: el backend no tiene cupones
  (las ofertas se aplican solas) y el checkout requiere `paymentType`.
- "Más vendidos" se muestra como "Ofertas de la semana" (o "Novedades") porque no hay endpoint público de ventas.
- Las reseñas del login están en `src/app/components/AuthShell.tsx` (tomadas del diseño): reemplazarlas por reseñas reales.

```bash
npm test
npm run typecheck && npm run build
```
