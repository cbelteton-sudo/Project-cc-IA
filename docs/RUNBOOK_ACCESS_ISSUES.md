# Runbook: Manejo de Incidentes de Permisos y Acceso (RBAC)

**Audience:** Soporte de Nivel 2 y DevOps.

## Incidente: "Un usuario no ve los proyectos de su Portafolio (DIRECTOR_PMO)"

1. **Chequeo de Logs Estructurados:**
   Filtrar los logs de DataDog, CloudWatch o tu log viewer por `event: scope_mismatch`.
   Buscar el `userId` afectado.
   ```json
   {
     "event": "scope_mismatch",
     "reason": "outside_allowed_scope",
     "userId": "123",
     "role": "DIRECTOR_PMO"
   }
   ```
2. **Causa Probable:**
   La consulta o endpoint intentó inyectar un `tenantId` o `portfolioId` que no correspondía al scope validado.
3. **Resolución:**
   Verificar si en Prisma la asignación del usuario realmente tiene el `portfolioId` seteado activo en su tabla `tenantMember`. Si no, re-invitarlo o asignarle el rol correctamente vía UI.

## Incidente: "Todo el sistema arroja Error 403 de Accesos a Nivel Masivo"

1. **Chequeo de Logs Estructurados:**
   Filtrar por el evento `access_denied`. Si la volumetría sube dramáticamente:
2. **Causa Probable:**
   Las tablas `SystemRole` o `RolePermission` de BD podrían estar corruptas, eliminadas (Truncate accidental) o desincronizadas de la lógica.
3. **Remediación Rápida (Soporte L1/DevOps):**
   Ejecutar el proceso de Rollback Feature Flag (Ver `DEPLOY.md`) apagando `RBAC_DB_ONLY=false`.
4. **Restaurar el estado (L2):**
   Correr `seed-rbac.ts` de vuelta para reparar las vinculaciones de base de datos. Una vez confirmada por consultas, encender el Flag nuevamente.

## Incidente: "Suspicious Extra Where Keys en Logs"

1. **Chequeo preventivo:**
   Visualización de warnings semanales de `event: suspicious_extraWhere_keys`.
2. **Causa Probable:**
   Algún bug o intento de By-pass del lado del cliente enviando `?tenantId=X` o en un body Post.
3. **Resolución:**
   Esta vulnerabilidad _fue prevenida_ automáticamente por el sistema, pero indica la necesidad de auditar qué cliente (App u otra API) está enviando payloads no conformes. Abrir Bug Report a Frontend si es por un formulario desactualizado.
