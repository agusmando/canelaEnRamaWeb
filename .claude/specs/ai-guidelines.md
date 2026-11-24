# Guía de trabajo para asistentes de IA

## Antes de cambiar código

1. Leer `.claude/README.md` y la sección correspondiente de `specs/functional.md` y `glossary.md`.
2. Seguir el flujo real desde ruta/página a componente, hooks/store, API/types y, si afecta contratos, al backend sibling. No modificar por una descripción aislada.
3. Identificar si una regla es local (presentación/estado), remota (backend), de build (Vite) o de despliegue (Cloudflare).
4. Buscar usos de rutas, nombres de campos, literales y claves locales antes de renombrarlos.
5. Revisar la interfaz actual y sus estados de carga, error, vacío, autenticación y móvil antes de añadir otro flujo.

## Compatibilidad y restricciones

- Conservar API paths, métodos, payloads, query params y semántica de respuesta. Cambios de contrato requieren coordinación con backend y actualización de tipos/docs.
- No cambiar enum strings ni campos JSON para “traducirlos”; los literales del glosario son contractuales.
- No suponer que el cliente es fuente de verdad para precios, stock, disponibilidad, descuentos, permisos, pago o costo de envío. Dejar validaciones definitivas al backend.
- No tratar `price`/`profitMargin` como precio de venta; la UI usa `finalPrice` cuando está disponible.
- No mezclar `OrderStatus`, `PaymentStatus` y `ShipmentStatus`.
- No eliminar validación `state`/PKCE en OAuth, renovación de sesión o comprobaciones de `RequireAuth`.
- No confiar en la UI como autorización; no exponer datos personales de destinatario en tracking público.
- No asumir que favoritos se sincronizan en backend, que existe cupón, ni que integraciones/logística tienen automatización no visible.
- No leer, copiar, imprimir ni añadir secretos desde `.env`, almacenamiento de sesión o respuestas de tokens.
- Al tocar `functions/`, mantener compatibilidad con Workers/Pages y headers de seguridad; probar compilación separada si corresponde.

## Calidad de implementación

- Mantener TypeScript estricto y los patrones React/Redux del repositorio.
- Usar RTK Query para recursos remotos existentes, con tags e invalidación consistentes; evitar fetch paralelo duplicado.
- Mantener actualizaciones optimistas reversibles y evitar que respuestas fuera de orden sobrescriban estado más reciente.
- Conservar accesibilidad (labels, teclado, foco, semántica), diseño responsive y mensajes en español rioplatense.
- Reutilizar componentes/utilidades de producto y seguir convenciones de naming/format del archivo cercano.
- No añadir dependencia si puede resolverse con el stack instalado o un helper existente.

## Documentación y verificación

- Actualizar `.claude/specs/functional.md` si se añade, quita o cambia una capacidad o ruta.
- Actualizar `.claude/glossary.md` para enums/campos/paths/keys; `architecture.md` para stack, flujo de datos o despliegue; `operations-and-gaps.md` para comandos, entorno o limitaciones.
- Ejecutar al menos `npm run typecheck` y `npm run build` para cambios de código. Para cambios aislados de docs, revisar enlaces/rutas y coherencia manualmente.
- No afirmar pruebas de comportamiento si no existe suite; reportar comprobaciones realizadas y las pendientes.
- Distinguir “el código frontend presenta/solicita” de “el backend garantiza” y de “producción está configurada”.

## Informe de entrega

Resumir objetivo, rutas/documentos modificados y verificaciones. Mencionar límites relevantes o dependencias backend; no copiar diffs completos salvo que se soliciten.
