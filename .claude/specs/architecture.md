# Arquitectura y contratos técnicos

## Stack y arranque

- React 18, TypeScript, Vite 6, módulos ESM.
- React Router 7 para SPA y code splitting por rutas.
- Redux Toolkit/React Redux; RTK Query para recursos remotos y caché.
- Axios como transporte HTTP, Tailwind CSS 4 para estilos.
- UI complementaria: Lucide React, Sonner, `clsx` y `tailwind-merge`.
- Entrada: `src/main.tsx`; montaje, sesión inicial y provider: `src/app/App.tsx`; rutas en `src/app/routes.tsx`; estilos globales en `src/styles/index.css`.
- Pages Functions de Cloudflare en `functions/`.

## Organización de capas

- `src/app/pages/`: vistas/rutas; agrupan composición y comportamiento de página.
- `src/app/components/`: UI reutilizable (forms, cards, navegación, compra, estados).
- `src/app/layouts/`: estructura compartida de la tienda.
- `src/app/api/client.ts`: base URL, auth headers/tokens, errores, refresh y helper HTTP.
- `src/app/api/shopApi.ts`: endpoints RTK Query, caché, tags e invalidaciones.
- `src/app/api/types.ts`: tipos de contrato consumidos por la UI.
- `src/app/store/`: store Redux y slices de auth, carrito/preferencias.
- `src/app/hooks/`: SEO, retorno de navegación y títulos.
- `src/app/lib/`: cálculos/formateo de tienda, SEO, órdenes, envíos, banners, Cloudinary y contacto.
- `functions/`: endpoints de sitemap y pre-render de metadata de producto para Cloudflare Pages.

Mantener reglas de interfaz y composición en frontend; seguridad, cotizaciones y transiciones críticas son autoritativas en backend.

## Flujo de datos y estado

- RTK Query mantiene datos remotos en caché, reconsulta al reconectar y usa invalidaciones por tags. Catálogo/taxonomías/banners conservan caché extendida.
- Los filtros y el orden del catálogo se aplican principalmente en cliente a los productos cargados.
- Estado Redux `auth` representa usuario/estado de restauración; `cart` conserva token de invitado y visibilidad del drawer; `prefs` persiste favoritos y vistos localmente.
- Claves locales explícitas: `cer_guest_cart` en localStorage, `cer_prefs` en localStorage y `cer_google_oauth` en sessionStorage.
- Cachés optimistas se usan para actualizaciones del carrito; al error se invalida y se recupera la versión del servidor.
- El resumen/quote del carrito y el costo de envío de checkout vienen del backend. No usar cálculos de interfaz como garantía de precio o stock definitivos.

## API y contratos

- Las llamadas de tienda usan `/api` más el recurso. `VITE_API_URL` es la URL base sin sufijo `/api`; vacía usa mismo origen y proxy de Vite en dev.
- Cliente común basado en Axios; normaliza errores del API y maneja token SuperTokens en modo header (`st-auth-mode`, `Authorization`). Hace refresh de sesión al recibir 401 según lógica del cliente.
- Checkout invoca `POST /order` con `fromCart`, `paymentType` y `shippingMethod`; el servidor vuelve a validar stock, importe y envío.
- Tipos se mantienen en `src/app/api/types.ts`; preservar nombres exactos, enum literales, `null` y semánticas de unidades.
- No asumir que todos los campos de backend se publican a usuarios de tienda: costo/margen pueden ser filtrados por servidor.

## Autenticación y privacidad

- SuperTokens email-password y ThirdParty Google. Google callback usa `state`, `pkceCodeVerifier` y `returnTo` en `sessionStorage`; no quitar validaciones anti-CSRF.
- Tokens se conservan en `localStorage` por cliente actual; nunca registrarlos ni incluir valores en documentación/telemetría.
- Al entrar se consulta `/user/me`; al login se fusiona el carrito de invitado si hay token.
- Rutas de cuenta están tras `RequireAuth`; tracking público usa un tipo de respuesta reducido. Nunca exponer datos personales solo porque el API de detalle trae más información.
- El frontend no implementa autorización de staff; los roles entregados por usuario no deben tomarse como autorización local.

## Servicios externos y configuraciones

- Backend de tienda: productos, taxonomías, carrito, pedidos, pagos, envíos, banners y reseñas.
- SuperTokens: sesiones, auth email/password y Google OAuth.
- Mercado Pago: UI condicional según `/payment/config`, preferencia Checkout Pro y sincronización de estado.
- Google Reviews: consulta backend y visualización; no se llama directamente a Places desde la tienda.
- Cloudinary: transformaciones/URLs de imágenes para frontend; cargas/admin no están implementadas en este sitio público.
- WhatsApp, Instagram, Facebook y mapa son enlaces/configuración de contacto.

Variables de build: `VITE_API_URL`, `VITE_API_PROXY_TARGET`, `VITE_API_TIMEOUT`, `VITE_WHATSAPP`, `VITE_INSTAGRAM_URL`, `VITE_FACEBOOK_URL`. Cloudflare Pages Functions usan `API_URL` y `SITE_URL`. Describir solo nombres; secretos nunca.

## SEO y Cloudflare Pages

- Metadata client-side: `src/app/hooks/useSeo.ts`, datos/helpers `src/app/lib/seo.ts`.
- `functions/sitemap.xml.ts` genera sitemap usando `API_URL`; usa URLs canónicas basadas en `SITE_URL` si existe.
- `functions/producto/[id].ts` obtiene producto con timeout limitado y devuelve `index.html` con metadatos de Open Graph/Twitter y JSON-LD Product; fallback si la API no está disponible.
- `functions/_lib/api.ts` aplica headers de seguridad a respuestas de Pages Functions. Mantener su política alineada con `public/_headers`.
- `public/robots.txt` controla rastreo y referencia sitemap.

## Diseño e interfaz

Usar tokens y utilidades ya presentes en `src/styles/index.css`; mantener la tipografía, paleta y lenguaje visual existente, responsive, controles accesibles, focos visibles y estados vacíos/cargando/error. Evitar duplicar estilos o introducir librerías para patrones que ya tienen componente local.

- `src/app/components/ActionButton.tsx` normaliza botones con peticiones: bloquea doble envío, muestra spinner, cambia a estilo de progreso y vuelve al estado original al terminar.
- `src/app/lib/notifications.ts` centraliza notificaciones flotantes de éxito/error mediante Sonner con mensajes claros y duración consistente.
