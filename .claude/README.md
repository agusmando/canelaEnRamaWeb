# Contexto de Canela en Rama Web

Documentación de referencia para personas y agentes que trabajan en la tienda pública. Describe el frontend versionado y sus contratos observables; no garantiza el estado de API, datos o configuración de producción.

## Documentos

- [Glosario y vocabulario contractual](glossary.md): términos de negocio, nombres de campos, literales de rutas, estados y claves locales.
- [Especificación funcional](specs/functional.md): todas las rutas de tienda, flujos y capacidades de interfaz documentadas.
- [Arquitectura y contratos técnicos](specs/architecture.md): stack, estado, API, autenticación, SEO y despliegue.
- [Guía de trabajo para IA](specs/ai-guidelines.md): lectura requerida, restricciones y criterios de verificación.
- [Operación y brechas conocidas](specs/operations-and-gaps.md): comandos, variables por nombre, CI, Cloudflare y límites verificados.

El archivo [CLAUDE.md](../CLAUDE.md) en la raíz es la guía de entrada para Claude Code y enlaza las reglas esenciales.

## Alcance y autoridad

Se realizó una lectura estática del repositorio. La documentación no sustituye al código ni confirma que el backend o el despliegue estén disponibles. Ante diferencias, prevalece la implementación vigente en este repositorio; para el contrato remoto, contrastar también el backend sibling `../canelaEnRamaBack` y su colección de Postman cuando esté disponible.

«Palabras reservadas» significa aquí vocabulario contractual propio del producto: enums, campos, rutas, parámetros y claves de almacenamiento. No es un inventario de palabras clave de JavaScript, TypeScript, SQL ni otros lenguajes.

Al cambiar rutas, comportamiento, contratos de API, valores persistidos o variables, actualizar los documentos afectados. No documentar secretos ni convertir una suposición en una garantía.
