# Final Go/No-Go Checklist (RBAC & Isolation)

Antes de cualquier liberación (Release) a Producción que involucre el control de accesos, roles, o jerarquías multi-tenant, todos los siguientes bloques **deben estar en VERDE**. Cualquier falla crítica significa **NO GO** (Se cancela el pase).

## 1. Seguridad (🟩 VERDE / 🟥 ROJO)

- [ ] No existen fugas de inquilinos (Tenant Isolation cruzado). Validado por Pruebas E2E.
- [ ] Ningún Payload REST o GQL permite inyectar `tenantId` en un `extraWhere` anulando el contexto criptográfico original.
- [ ] Todos los roles base y las restricciones del Portafolio (`DIRECTOR_PMO`) funcionan y listan datos sin comprometer otros scopes.

## 2. Pruebas y Cobertura (🟩 VERDE / 🟥 ROJO)

- [ ] Pruebas unitarias de `AuthorizationService` >= 90%.
- [ ] Pruebas unitarias de `PermissionsGuard` y `ProjectAuthGuard` >= 85%.
- [ ] Helper anti-bypass `prisma-scope.helper` cobertura >= 90%.
- [ ] Pipeline CI es mandatorio y bloquea exitosamente los merges que fallen tests de integración.

## 3. Observabilidad y Auditoría (🟩 VERDE / 🟥 ROJO)

- [ ] Configurados logs estructurados unificados para eventos de `access_denied`.
- [ ] Configurada una alerta automatizada o filtro fácil de chequear si la tasa de errores de permiso se dispara post-despliegue.

## 4. Estrategia y Operación (🟩 VERDE / 🟥 ROJO)

- [ ] Existen los Runbooks de 403 / Access issues para que Soporte maneje tickets.
- [ ] Existe la documentación de seguridad y roles estandarizada.
- [ ] Checklist final de Regresión Functional en Staging completada por QA y PMs reales.

### Aprobaciones Finales:

- **Lead Backend**: [____]
- **QA/SecOps**: [____]
- **Product Manager**: [____]
