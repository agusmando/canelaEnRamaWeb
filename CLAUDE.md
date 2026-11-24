# Instrucciones para Claude — Canela en Rama Web

Antes de realizar cambios, consulta `.claude/README.md` y los documentos que correspondan:

- Vocabulario y literales del proyecto: `.claude/glossary.md`.
- Comportamiento y cobertura de pantallas: `.claude/specs/functional.md`.
- Stack, estado, API y despliegue: `.claude/specs/architecture.md`.
- Proceso de trabajo y compatibilidad: `.claude/specs/ai-guidelines.md`.
- Comandos, entornos y límites conocidos: `.claude/specs/operations-and-gaps.md`.

## Reglas esenciales

1. El código vigente es la fuente de verdad; confirma las reglas en rutas, componentes, hooks, slices, API y Functions antes de cambiar comportamiento.
2. Este repositorio es el frontend público. No agregues funcionalidades de administración/backend que no existan en la interfaz ni supongas que una llamada de API implica una integración automática.
3. Mantén sincronizados los contratos del frontend con la API. Preserva rutas, nombres de campos, enums, valores de pago/estado, claves de almacenamiento y flujo de autenticación; si cambian, documenta el impacto y actualiza `.claude/`.
4. No leas ni expongas valores secretos de `.env`. Documenta solo nombres de variables.
5. Mantén TypeScript estricto, React funcional, React Router, Redux Toolkit/RTK Query, Tailwind y el estilo del código cercano. No incorpores dependencias sin necesidad.
6. Comprueba accesibilidad, estados de carga/error/vacío, diseño adaptable y privacidad de datos, especialmente en cuenta, pedidos y tracking público.
7. Después de cambios relevantes ejecuta `npm run typecheck` y `npm run build`; no afirmes que hay pruebas automatizadas si no las hay.
8. Distingue claramente lo implementado en código de lo que depende del backend, de la configuración de despliegue y de los aspectos pendientes de confirmar.

Al cambiar una funcionalidad, actualiza la especificación funcional y, cuando aplique, el glosario o la arquitectura. No copies reglas del backend sibling sin verificar que el frontend las consume o presenta.
