# Especificación funcional — Canela en Rama Web

## 1. Propósito y alcance

Tienda online pública SPA para explorar productos, administrar un carrito, autenticarse, comprar y consultar pedidos/envíos. Este documento resume la funcionalidad frontend identificada mediante lectura estática; no certifica disponibilidad de servicios, configuración ni comportamiento de producción. Las reglas de negocio y seguridad del servidor siguen perteneciendo al backend.

## 2. Rutas y capacidades

Todas las rutas están anidadas en `StoreLayout`. La home carga de forma inmediata; otras pantallas se cargan de manera diferida. El árbol de `mi-cuenta` está protegido por `RequireAuth`. El carrito y el checkout de retiro en el local están disponibles sin login; el envío a domicilio y el pago online exigen sesión.

| Ruta | Capacidades implementadas |
|---|---|
| `/` | Carrusel/hero, productos destacados y ofertas o novedades, "Para vos" (solo logueados: categorías/marcas/etiquetas de sus compras, excluye lo ya comprado), vistos recientemente, categorías, "Los más pedidos" (`GET /catalog/best-sellers`, ranking real de los últimos 90 días), recomendaciones, beneficios del comercio y reseñas de Google. |
| `/productos` | Catálogo activo; búsqueda sincronizada con URL, filtros por categoría, etiqueta, marca, precio, promociones y productor local; orden y carga incremental en cliente. |
| `/producto/:id` | Ficha con galería, variantes, tamaños de paquete y venta por peso/unidad, cantidad, precio/ofertas/stock, favoritos, compartir, reseñas y productos relacionados. Marca el producto como visto recientemente. |
| `/ofertas` | Productos organizados según tipos de oferta, incluidos descuentos y promociones por cantidad. |
| `/favoritos` | Lista persistida localmente; permite remover y agregar al carrito cuando el producto tiene opción de compra predeterminada. |
| `/carrito` | Consultar y modificar líneas, eliminar o vaciar, ver cotizaciones/stock/avisos, elegir retiro o entrega, capturar dirección, cotizar envío, elegir pago, aplicar cupón y crear pedido. Checkout de invitado disponible para retiro en el local con pago al retirar. |
| `/login` | Acceso por email/contraseña o Google; recupera el destino `returnTo`; mensajes de error del proveedor en español. |
| `/registro` | Registro email/contraseña y posterior autenticación; contempla validación y errores de SuperTokens. |
| `/recuperar` | Solicita por email un token para restablecer contraseña. |
| `/auth/reset-password` | Establece contraseña nueva mediante token; informa token vencido/usado. |
| `/auth/verify-email` | Confirma token de email. |
| `/auth/callback/google` | Valida `state`, procesa el callback OAuth con PKCE y finaliza el inicio de sesión. |
| `/mi-cuenta` | Perfil, identidad, estado de verificación y pedidos recientes. |
| `/mi-cuenta/domicilio` | Consulta/edita domicilio del usuario. |
| `/mi-cuenta/pedidos` | Lista paginada de pedidos propios. |
| `/mi-cuenta/pedidos/:id` | Detalle de pedido, líneas, estados separados, pago, envío/eventos/tracking; cancelar si el pedido está en estado elegible, sincronizar pago y volver a comprar según disponibilidad. |
| `/contacto` | Datos de contacto, redes sociales y mapa. |
| `/envios` | Información sobre compra, entrega, retiro, zonas (con precio y ETA desde `/shipping/config`), pagos y enlace a seguimiento. Parte de la información es contenido estático; consultar configuración de API para disponibilidad/costo efectivo. |
| `/seguimiento`, `/seguimiento/:code` | Formulario de código y cronología pública de envío. |
| `*` | Página no encontrada. |

## 3. Navegación, layout y elementos compartidos

`StoreLayout` incluye barra de anuncio, header adaptable, navegación/categorías, buscador, acceso a favoritos/cuenta/carrito, contenido, footer, panel lateral de carrito y botón flotante de WhatsApp. Componentes comunes implementan:

- Banners e imágenes responsive, categorías y cabeceras de sección.
- Autocomplete de búsqueda con sugerencias e interacción por teclado; recuerda las últimas búsquedas en `localStorage` (`cer_search_recent`) y se enfoca con `/` o `Ctrl/⌘+K`.
- Tarjetas y botones de favoritos; agregado rápido al carrito y confirmación en drawer.
- Selector de variantes, presentaciones, cantidades y progreso hacia ofertas por cantidad.
- Formularios de cuenta y dirección, controles de cantidad, breadcrumbs y estrellas.
- Reseñas de producto, reseñas Google y eventos de seguimiento.
- Skeletons/loading, errores, reintentos y estados vacíos; notificaciones con Sonner.

El layout debe mantenerse utilizable en móvil y escritorio. Los banners públicos proceden de placements de API; no hay administración de banners en este repositorio.

## 4. Catálogo, precio y preferencias

- RTK Query carga catálogo activo y taxonomías; el catálogo se filtra/ordena en el cliente y conserva caché.
- El detalle de producto se consulta por ID. La UI presenta solo variantes comprables según los criterios del frontend (actividad, disponibilidad web y precio visible positivo, donde aplique).
- `finalPrice` es el precio de venta del API; la UI no debe intentar reconstruirlo con `price`/`profitMargin`.
- Lógica en `src/app/lib/shop.ts` formatea y presenta unidades, opciones de paquete y mensajes de oferta. La cotización final del carrito la determina el servidor.
- Favoritos y máximo 12 productos vistos recientemente se guardan bajo `cer_prefs`. Con sesión iniciada se sincronizan con la cuenta (`GET`/`PUT /user/prefs`): al entrar se descargan y fusionan (unión) con las locales y los cambios se suben con ~1 s de debounce; al cerrar sesión quedan solo las locales.
- Compartir usa Web Share cuando está disponible y alternativa compatible en el navegador.

## 5. Carrito y checkout

- Invitados: `POST /cart` crea/reutiliza un carrito y su `sessionId` se persiste bajo `cer_guest_cart`; siguientes cambios usan `/cart/:sessionId`. Usuarios: la tienda consulta `/cart/me` y agrega usando `/cart`.
- El inicio de sesión intenta fusionar carrito invitado con carrito de usuario y luego descarta el token invitado local.
- Se pueden agregar, actualizar cantidades, quitar líneas y vaciar. Actualizaciones de cantidad son optimistas; al fallar, la caché vuelve a consultarse. Las respuestas viejas no deben sobrescribir una edición más reciente.
- Una línea representa una variante y `selectedBulkOption`; ventas sueltas y paquetes tienen cantidades semánticamente distintas.
- El carrito muestra disponibilidad, suficiencia de stock, cotización por línea, subtotal/descuento/total y avisos cuando falta cantidad para alcanzar oferta. No asumir que una vista previa local es total confirmado.
- El resumen muestra un aviso de ahorro cuando el backend reporta descuento por ofertas (`summary.discount`) y una sección "Complementá tu compra" con productos afines (misma categoría/etiquetas) que no estén en el carrito.
- Checkout con sesión: selecciona `DELIVERY` o `PICKUP`, guarda/usa domicilio y requiere `paymentType`. En entrega la cotización se solicita al backend y este vuelve a fijar el costo al crear orden.
- Checkout de invitado (`POST /order/guest`, solo `PICKUP` + `CASH`): pide nombre, email y teléfono; el backend crea un usuario interno `guest:<hash>` y un envío `PICKUP` con código de seguimiento público. El cliente puede seguir el pedido en `/seguimiento/:code` y recibe los mails de pedido con ese enlace. Envío a domicilio y Mercado Pago siguen requiriendo login.
- Mercado Pago solo se ofrece si `/payment/config` lo informa habilitado. Al completar pedido se crea preferencia y se redirige a `initPoint`; al regresar se vuelve a sincronizar el pago. Efectivo (`CASH`) y transferencia (`TRANSFER`) se coordinan manualmente; no se ofrecen débito/crédito directos.
- Cupón de descuento: `/discount-code/validate` muestra la vista previa y el código se envía en el checkout (`discountCode`); el descuento final lo calcula el backend.

## 6. Autenticación y cuenta

- SuperTokens en modo header; mecanismos email/contraseña, registro, Google ThirdParty, verificación de email, recuperación/restablecimiento de contraseña y cierre de sesión.
- Google OAuth almacena temporalmente `state`, `pkceCodeVerifier` y `returnTo` en `sessionStorage`; callback comprueba `state` antes de llamar a signinup. `returnTo`/`location.state.from` se normalizan a rutas internas para evitar redirecciones abiertas.
- Al autenticarse se consulta `/user/me`; al iniciar la app se restaura sesión si existen tokens. El cliente HTTP gestiona renovación y sesión expirada.
- `RequireAuth` protege cuenta/subrutas; las páginas guardan o recuperan la ruta a la que volver tras login.
- Cuenta permite ver perfil, verificar email y reenviar correo de verificación. No se identificó edición de nombre/email ni cambio directo de contraseña en la UI; recuperar contraseña es el flujo disponible.

## 7. Pedidos, pago y entrega

- Lista propia paginada, detalle de pedido y estados de orden/pago distintos.
- Cancelación solicita `status: CANCELLED`; el servidor valida si puede cancelarse (el frontend no es la autoridad para esa transición).
- Volver a comprar agrega al carrito líneas disponibles del pedido.
- Si existe `MERCADOPAGO`, la interfaz permite crear preferencia y sincronizar al volver; el estado final proviene del backend.
- Dirección se consulta/guarda en `/shipping/address`; `/shipping/config` entrega zonas/departamentos y datos de retiro; `/shipping/quote` estima costo/disponibilidad.
- Tracking por código en `/shipment/track/:code`; detalle puede consultar envío propio por pedido y muestra eventos y datos de carrier si están presentes.

## 8. Opiniones y contenido de confianza

- Ficha lista reseñas aprobadas paginadas, resumen y distribución por estrellas; filtros por puntuación/variante y orden.
- Usuario autenticado consulta elegibilidad, crea/edita/elimina reseña propia. La UI muestra compra verificada y comunica moderación; el backend determina elegibilidad/estado y una edición puede volver a `PENDING`.
- Home muestra calificación y reseñas de Google proporcionadas por API.
- Reseñas de autenticación observadas en diseño/código no deben describirse como reseñas reales verificadas sin confirmar su origen.

## 9. SEO y páginas públicas

- Hooks de SEO actualizan título, descripción, canonical, Open Graph, Twitter, robots y JSON-LD en el navegador.
- Inicio y detalle de producto tienen datos estructurados; rutas de búsqueda, privadas y auth que se marcan noindex se especifican en el código SEO.
- Cloudflare Pages Function `/sitemap.xml` lista rutas públicas seleccionadas y productos activos disponibles por API.
- Function `/producto/:id` sirve HTML de SPA con metadatos/JSON-LD específicos para crawlers y plataformas sociales; conserva fallback SPA si la API falla.
- `robots.txt` referencia sitemap; `_headers` define políticas/headers estáticos y la respuesta de Functions añade encabezados que no hereda de `public/_headers`.
- PWA instalable: `manifest.webmanifest` + service worker mínimo (`public/sw.js`, cache-first para assets con hash, network-first para el resto, nunca `/api`), registrado solo en producción desde `main.tsx`.

## 10. Cobertura API invocada por el cliente

Base path `/api` (la configuración `VITE_API_URL` se define sin añadir `/api`). Principales recursos observados:

| Recurso | Uso desde UI |
|---|---|
| `/product`, `/product/:id`, `/category`, `/tag`, `/brand` | Catálogo, ficha y filtros. |
| `/cart`, `/cart/me`, `/cart/:token` | Carritos, cambios, fusión invitado. |
| `/order`, `/order/guest`, `/order/mine`, `/order/:id` | Checkout (con sesión e invitado), lista/detalle/cancelación. |
| `/payment/config`, `/payment/order/:id/preference`, `/payment/order/:id/sync` | Disponibilidad Mercado Pago, preferencia y sincronización. |
| `/user/me` y endpoints `/auth/*` de SuperTokens | Sesión, email/password, Google, verificación y reset. |
| `/shipping/config`, `/shipping/address`, `/shipping/quote` | Configuración, domicilio y cotización de envío. |
| `/shipment/order/:orderId`, `/shipment/track/:code` | Envío de pedido y tracking público. |
| `/banner/public` | Contenido por `BannerPlacement`. |
| `/google-review` | Lugar y reseñas Google. |
| `/review`, `/review/summary`, `/review/eligible`, `/review/mine`, `/review/:id` | Lectura, elegibilidad y gestión de opinión del usuario. |

Consultar `src/app/api/shopApi.ts`, `src/app/store/authSlice.ts` y `src/app/api/types.ts` para payloads y tipos exactos. La cobertura no equivale a todas las rutas existentes en el backend.

## 11. No funcionalidades / límites

- Sin panel de staff/administración en este repositorio.
- Sin gestión de cupones.
- No se observa API directa para sincronización con transportistas, Google Places, Cloudinary o redes sociales desde el navegador; estas capacidades son mediadas por backend, enlaces o funciones de despliegue.
- No inferir que el proveedor `uber` está habilitado siempre: depende de configuración y cotización remotas.
- No afirmar que pagos offline se concilian automáticamente ni que existen reembolsos por funcionalidad visible en la tienda.
