# Runbook: Troubleshoot Access Issues (403 Forbidden)

Este Runbook provee pasos accionables para agentes de soporte L2/L3 o DevOps cuando un usuario reporta errores `403 Forbidden` inesperados.

## 1. Diagnóstico del Error 403

1. **Localizar el Log de Auditoría**:
   Buscar en los logs del servidor (Datadog, CloudWatch, etc.) filtrando por `"event":"access_denied"` asociado al `userId` o `tenantId` del usuario afecto.
2. **Revisar el campo `reason`**:
   - `not_a_member`: El usuario no existe en la tabla `ProjectMember` para ese `projectId`.
   - `inactive_member`: El usuario está en la tabla, pero su estado está desactivado (`status !== 'ACTIVE'`).
   - `insufficient_permissions`: El usuario es un miembro activo, pero el endpoint requiere una lista de permisos que su rol actual no satisface. (Ver campo `requiredPermissions` en el log vs `role`).

## 2. Revisión de Asignación de Proyecto / Cartera

Si el error es `not_a_member` o `inactive_member`:

1. Verificar que el rol no sea `DIRECTOR_PMO` que haya perdido su alcance general.
2. Consultar Prisma directamente o en la vista de Admin:
   ```sql
   SELECT * FROM "ProjectMember" WHERE "userId" = '...' AND "projectId" = '...';
   ```
3. Para dar de alta nuevamente, usar el módulo de Administración o la API de asignación (`POST /projects/:id/members`).

## 3. Rollback de Permisos / Migración

Si se sospecha que una migración reciente rompió los permisos globales (`ROLE_PERMISSIONS` matrix):

1. Revisar los últimos commits efectuados en `src/common/auth/permissions.matrix.ts`.
2. Si un permiso central fue retirado de `PROJECT_MANAGER` u otro rol vital sin previo aviso, generar un Hotfix PR restaurando el permiso en la matriz y hacer deploy. No se requiere migraciones de DB ya que estos perfiles radican en el código fuente.
3. Una vez finalizado el Hotfix, reiniciar el POD / Instancia en Staging/Producción.
