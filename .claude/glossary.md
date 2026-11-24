# Glosario y vocabulario contractual

Este vocabulario se deriva del código de la tienda pública, sobre todo `src/app/api/types.ts`, `src/app/api/shopApi.ts`, los slices y el enrutado. Los nombres exactos enviados/recibidos por API o persistidos en el navegador deben preservarse salvo migración coordinada. No equivale al esquema completo del backend.

## Conceptos de dominio

| Término | Significado en la tienda |
|---|---|
| Producto (`Product`) | Ítem público del catálogo, con categoría, marca, etiquetas, medida, variantes y posibles ofertas. |
| Variante (`ProductVariant`) | Presentación vendible de un producto; concentra precio visible, stock, presentación, disponibilidad y medios. |
| Presentación / venta suelta | Opción de paquete elegida para una variante. `selectedBulkOption = 0` representa venta suelta; un valor positivo es tamaño de paquete en gramos o unidades. |
| Medida (`Measure`) | Unidad de contenido/venta. Para `KG`, el frontend muestra el precio por kilo y el stock en gramos; para otras medidas las cantidades se interpretan según la variante. |
| Precio final (`finalPrice`) | Precio comercial de venta entregado por API. No debe confundirse con el costo `price` ni calcularse a partir de campos ocultos al comprador. |
| Oferta (`Offer`) | Descuento/promoción con tipo, valores, vigencia y posible umbral. El catálogo y el detalle presentan ofertas; el carrito recibe del servidor cotización, total y descuento. |
| Carrito de invitado | Carrito asociado a un `sessionId` conservado localmente; puede fusionarse con el carrito de la cuenta al iniciar sesión. |
| Línea de carrito | Variante, cantidad y presentación. Una misma variante puede estar en más de una presentación. |
| Pedido / orden (`Order`) | Compra del cliente, con total de productos, forma de pago, estados y líneas de pedido; el costo de envío se presenta por separado. |
| Snapshot | Nombre y precio de la variante/producto copiados al pedido para representar la compra histórica. |
| Envío (`Shipment`) | Entrega a domicilio o retiro, con estado, código de tracking, eventos y, si existen, datos de proveedor externo. |
| Tracking público | Progreso consultable por código; el contrato `PublicTracking` omite nombre, teléfono y dirección del destinatario. |
| Favoritos | Lista local de IDs de producto; no hay endpoint de favoritos en la API de tienda. |
| Vistos recientemente | Últimos 12 IDs de producto almacenados localmente. |
| Reseña de producto (`Review`) | Opinión de compra elegible con rating, variante, estado de moderación y posible respuesta pública. |
| Reseña de Google (`GoogleReview`) | Reseña del local obtenida/caché por backend; la tienda filtra las inactivas para visualización. |
| Banner / placement | Contenido público asignado a una ubicación (`BannerPlacement`) y ordenado por `position`. |
| Productor local | Indicador (`isLocal`/`local`) que permite presentar producto local en lugar de la marca cuando corresponde. |
| Carrito cotizado | Respuesta del backend con `summary`, `quote`, `available`, `enoughStock` y posibles avisos de oferta. La cotización remota es autoritativa para checkout. |

## Literales exactos usados por el frontend

### Medidas y ofertas

- `Measure`: `KG`, `U`, `L`, `ML`, `G`.
- `DiscountType`: `PERCENTAGE`, `FIXED`, `BUY_MORE_GET_MORE`, `BUY_ONE_GET_MORE`, `BUY_MORE_GET_DISCOUNT`, `BUY_MORE_GET_FIXED_DISCOUNT`.
- `ReviewOrder`: `recent`, `rating_desc`, `rating_asc`.

### Pedido, pago y envío

- `OrderStatus`: `PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`.
- `OrderItemStatus`: `FULFILLED`, `AWAITING_STOCK`, `PARTIALLY_RETURNED`, `CANCELLED`, `RETURNED`.
- `PaymentType`: `CASH`, `TRANSFER`, `MERCADOPAGO`.
- `PaymentStatus`: `PENDING`, `IN_PROCESS`, `APPROVED`, `REJECTED`, `CANCELLED`, `REFUNDED`, `CHARGED_BACK`.
- `ShipmentMethod`: `DELIVERY`, `PICKUP`.
- `ShipmentStatus`: `PENDING`, `PREPARING`, `READY_FOR_PICKUP`, `SHIPPED`, `OUT_FOR_DELIVERY`, `FAILED_ATTEMPT`, `DELIVERED`, `RETURNED`, `CANCELLED`.

### Reseñas, banners y cotización

- `ReviewStatus`: `PENDING`, `APPROVED`, `REJECTED`.
- `BannerPlacement`: `HOME_HERO`, `HOME_RECOMMENDATION`, `CATALOG_STRIP`, `ANNOUNCEMENT_BAR`.
- `BannerSize`: `SQUARE`, `WIDE`.
- Proveedores tipados para cotización: `uber`, `own`, `null`.
- Moneda de `ShippingQuote`: `ARS`.

Los roles llegan como cadenas (`User.role`, `User.roles`), pero esta tienda no implementa administración de roles; no inferir permisos desde esos campos.

## Rutas de la SPA

Mantener los paths del router y sus parámetros dinámicos:

| Ruta | Uso |
|---|---|
| `/` | Inicio. |
| `/productos` | Catálogo y filtros por query string. |
| `/producto/:id` | Detalle de producto. |
| `/ofertas` | Promociones. |
| `/favoritos` | Lista de deseos local. |
| `/carrito` | Carrito y checkout. |
| `/login`, `/registro`, `/recuperar` | Acceso, alta y recuperación de contraseña. |
| `/auth/reset-password`, `/auth/verify-email`, `/auth/callback/google` | Flujos de SuperTokens y OAuth Google. |
| `/mi-cuenta` | Perfil autenticado. |
| `/mi-cuenta/domicilio` | Dirección de entrega. |
| `/mi-cuenta/pedidos`, `/mi-cuenta/pedidos/:id` | Pedidos propios y detalle. |
| `/contacto`, `/envios` | Información pública del comercio. |
| `/seguimiento`, `/seguimiento/:code` | Consulta pública de tracking. |
| `*` | Página 404. |

Los filtros de catálogo relevantes en UI incluyen búsqueda (`q`), categoría, etiqueta, marca, precio, ofertas y productor local; revisar `Catalog.tsx` para el nombre exacto de cada query param antes de alterar enlaces.

## Campos importantes del contrato

Preservar la ortografía y mayúsculas de los nombres. Esta lista es vocabulario usado/documentado por tipos del frontend, no una lista completa de lo que cada endpoint acepta.

| Área | Campos exactos |
|---|---|
| Identidad | `id`, `supertokensId`, `email`, `name`, `avatarUrl`, `role`, `roles`, `createdAt` |
| Catálogo | `Product`: `active`, `measure`, `categoryId`, `brandId`, `Category`, `Brand`, `Tags`, `variants`, `offers`; `ProductVariant`: `finalPrice`, `currentStock`, `contentMeasure`, `contentAmount`, `packagingOptions`, `requestTime`, `stockThreshold`, `availableWeb`, `isLocal`, `local`, `hasComponents`, `images` |
| Oferta | `productId`, `productVariantId`, `startTime`, `finishTime`, `discountType`, `discountValue`, `discountQuantity`, `quantityToGet`, `stockThreshold` |
| Carrito | `sessionId`, `userSuperTokensId`, `items`, `summary`, `itemsCount`, `subtotal`, `discount`, `total`, `selectedBulkOption`, `quantity`, `available`, `enoughStock`, `quote`, `unitPrice`, `offerType`, `offerHint`, `missing` |
| Pedido | `totalPrice`, `totalItems`, `paymentType`, `paymentStatus`, `paymentStatusDetail`, `paidAt`, `estimatedReadyAt`, `status`, `orderItems`, `productNameSnapshot`, `variantNameSnapshot`, `unitPriceSnapshot`, `discountAppliedSnapshot`, `offerTypeSnapshot`, `shippingMethod`, `shippingCost`, `shippingProvider`, `shippingZone` |
| Dirección | `recipientName`, `phone`, `street`, `number`, `apartment`, `zone`, `city`, `province`, `postalCode`, `notes` |
| Cotización/envío | `available`, `provider`, `price`, `currency`, `etaMinutes`, `providerQuoteId`, `reason`, `trackingCode`, `carrierTrackingCode`, `carrierTrackingUrl`, `events` |
| Reseñas | `rating`, `title`, `comment`, `status`, `verifiedPurchase`, `reply`, `repliedAt`, `moderatedAt`, `authorName`, `distribution`, `byVariant` |
| Banner | `placement`, `name`, `eyebrow`, `headline`, `text`, `ctaLabel`, `linkUrl`, `size`, `desktopImageUrl`, `mobileImageUrl`, `backgroundColor`, `textColor`, `position`, `startsAt`, `endsAt`, `active` |

## Persistencia del navegador y auth

- `cer_guest_cart`: `sessionId` del carrito invitado en `localStorage`.
- `cer_prefs`: objeto de favoritos y vistos recientes en `localStorage` (`favorites`, `recent`; máximo 12 recientes).
- `cer_google_oauth`: `state`, `pkceCodeVerifier` y `returnTo` temporal en `sessionStorage` durante el flujo Google.
- SuperTokens guarda tokens en el almacenamiento configurado por el cliente HTTP (actualmente `localStorage` en modo header). No leer ni mostrar sus valores.
- Query/API usa `thirdPartyId=google`, `rid=emailpassword`, `rid=thirdparty` y `rid=emailverification` para distinguir recetas de SuperTokens.

## Variables de entorno (solo nombres)

- Build frontend: `VITE_API_URL`, `VITE_API_PROXY_TARGET`, `VITE_API_TIMEOUT`, `VITE_WHATSAPP`, `VITE_INSTAGRAM_URL`, `VITE_FACEBOOK_URL`.
- Cloudflare Pages Functions: `API_URL`, `SITE_URL`.

No incluir valores reales en documentación o respuestas.
