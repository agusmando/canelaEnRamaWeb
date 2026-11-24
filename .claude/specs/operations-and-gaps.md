# Operación y brechas conocidas

## Desarrollo y comprobaciones

- Requisito de ejecución: Node/npm compatibles con Vite 6 (ver `.nvmrc` para versión fijada).
- `npm install` instala dependencias; para instalaciones reproducibles/CI se usa `npm ci`.
- `npm run dev` inicia Vite en `http://localhost:5173`; el puerto fijo forma parte del callback OAuth Google local.
- `npm test` ejecuta las pruebas unitarias Vitest existentes.
- `npm run typecheck` comprueba TypeScript de SPA y Pages Functions.
- `npm run build` crea el build estático para despliegue.
- `npm run preview` sirve localmente el build de Vite; no equivale por sí solo a emular Pages Functions.
- Para probar Functions localmente, seguir README y Wrangler Pages con `dist` y binding `API_URL`. Los comandos/URLs productivos pueden cambiar; confirmar README antes de ejecutar.
- CI en `.github/workflows/ci.yml` corre `npm ci`, `npm run typecheck`, `npm run build` y `npm test` en PR y pushes a `main`.

## Variables de configuración (nombres solamente)

### Vite/frontend

- `VITE_API_URL`: base API sin `/api`; vacía usa origen actual y configuración de proxy local.
- `VITE_API_PROXY_TARGET`: destino del proxy dev; default documentado `http://localhost:8080`.
- `VITE_API_TIMEOUT`: límite de espera de llamadas.
- `VITE_WHATSAPP`, `VITE_INSTAGRAM_URL`, `VITE_FACEBOOK_URL`: enlaces/config de contacto.

### Cloudflare Pages Functions

- `API_URL`: base API para Functions.
- `SITE_URL`: dominio canónico/sitemap, especialmente para previews.

No almacenar valores efectivos ni credenciales aquí. Las `VITE_*` se integran en build; `API_URL` y `SITE_URL` son bindings/configuración de Pages runtime.

## Despliegue / SEO

- Cloudflare Pages publica `dist/` junto a `functions/`, que se ejecutan como Pages Functions.
- `/sitemap.xml` produce rutas públicas seleccionadas y fichas de productos activos; si el backend falla, conserva las rutas estáticas.
- `/producto/:id` personaliza metadata social/SEO desde producto; con fallo de API devuelve HTML SPA sin enriquecimiento específico.
- `SITE_URL` evita canonicals de preview `*.pages.dev`; configurar valores por entorno en Cloudflare.
- Las respuestas de Functions no heredan `public/_headers`; sincronizar headers CSP/seguridad con `functions/_lib/api.ts`.
- Google OAuth requiere callback local y de producción registrado en Google y dominios/cors correspondientes en backend. Confirmar configuración real fuera del repo.

## Brechas y aspectos por confirmar

1. **API y despliegues:** el inventario es estático; no se consultó API real ni configuración de Cloudflare, Google, SuperTokens o Mercado Pago.
2. **Carrito de invitado:** el frontend persiste `sessionId` en localStorage (`cer_guest_cart`) y lo usa como path token; documentación del backend sibling puede describir cookie `guest_cart_id`. Confirmar contrato desplegado antes de alterar cualquiera de los mecanismos.
3. **Entrega:** la pantalla informativa contiene texto/zonas estáticas; datos efectivos de zona/precio/proveedor vienen de endpoints de shipping. No afirmar disponibilidad universal.
4. **Pagos offline:** la UI los ofrece como métodos, pero su conciliación/procesamiento no se confirma desde este frontend.
5. **Transportistas:** se muestran campos/código/URL recibidos; no se observa integración directa para actualizaciones automáticas.
6. **Reseñas login:** verificar origen/autorización antes de presentar contenido de diseño como reseñas verificadas.
7. **Favoritos/vistos:** guardado local, sin cuenta/sincronización entre dispositivos ni endpoint backend.
8. **Contenido de banners/reseñas:** consumo público de API, sin administración desde este repositorio.
9. **Cloudinary/Google Places:** frontend transforma/representa contenidos, la carga o sincronización se hace fuera de esta UI.
10. **Comportamiento de API:** filtros por producto, elegibilidad, estados cancelables, ajustes de stock y validaciones son servidor; actualizar esta guía solo tras contrastar implementación.

La existencia de un tipo, llamada o variable no implica que la integración esté habilitada en un entorno concreto.
