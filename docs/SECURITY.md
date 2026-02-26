# Security Policy & RBAC Architecture

Este documento define la política estándar de manejo de accesos, aislamiento de datos (Data Isolation) y auditoría para CConstructions.

## 1. Normalización de Respuestas de Acceso Denegado

Todos los controladores y guards deben adherirse a la siguiente política de respuestas HTTP para garantizar seguridad predictiva y ocultar información sensible cuando sea requerido:

- **`403 Forbidden`**: Se devuelve cuando el usuario está autenticado, el recurso existe, pero el rol/membresía del usuario no tiene los permisos suficientes (`Insufficient Permissions`) o no pertenece al proyecto (`Access to this project is denied`).
- **`404 Not Found`**: (Opcional pero Recomendado) Se devuelve en lugar de un 403 cuando la mera existencia del recurso es información sensible que un atacante no debe conocer. Actualmente, `ProjectsService.findOne` implementa esto verificando si `project.tenantId !== tenantId` y lanzando un 404 estructurado.

## 2. Aislamiento de Datos (Data Isolation) - enforceScopeWhere

Todas las consultas en Prisma que manejen información Multi-Tenant o Multi-Proyecto deben obligatoriamente pasar por el helper `enforceScopeWhere`.

### Anti-Bypass (Prevención de Inyección)

Se ha implementado hardening en la extracción de filtros para evitar ataques vía payloads JSON donde un usuario malicioso envíe llaves restrictivas.

- **Llaves Bloqueadas en el Payload (`extraWhere`)**: `tenantId`, `projectId`, `portfolioId`, `userId`.
- Si se detectan, el helper las purgará automáticamente y emitirá un log de `[SECURITY WARNING]` a nivel sistema apuntando al intent. El filtro final SIEMPRE sobreescribirá `tenantId` con el contexto criptográfico validado del token (`req.user.tenantId`).

## 3. Auditoría y Observabilidad

El sistema emite _logs estructurados_ en formato JSON cada vez que un control de acceso falla.
Los campos estándar en estos logs incluyen:

- `event`: Tipo de evento (ej. `access_denied`).
- `reason`: Causa (`insufficient_permissions`, `not_a_member`, `inactive_member`).
- `userId`, `tenantId`, `projectId`, `role`, `requiredPermissions`.
- `endpoint`: Ruta solicitada.
- `timestamp`: Marca de tiempo ISO.

Los administradores de la infraestructura (ej. AWS CloudWatch, Datadog) deben configurar alertas semanales filtrando por la cadena `"event":"access_denied"` y vigilar anomalías.
