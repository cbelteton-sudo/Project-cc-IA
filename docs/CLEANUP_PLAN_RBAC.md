# Plan de Limpieza Módulo RBAC (Legacy Cleanup)

## 1. Inventario de Uso de `ROLE_PERMISSIONS` Legacy

- Analizar y listar controladores/servicios que continúan referenciando `ROLE_PERMISSIONS` en lugar de consultar puramente la base de datos de permisos dinámicos o claims del ProjectMembership.
- **Archivos clave sospechosos:**
  - `apps/api/src/common/constants/permissions.ts`
  - `apps/api/src/common/constants/roles.ts`
  - Interceptores y guards que hagan "fallback" en caso de que la tabla de permisos retorne array vacío.
  - Controladores en módulos legacy no migrados completamente a `@RequirePermissions()`.

## 2. Estrategia de Feature Flag (`RBAC_DB_ONLY`)

- Introducir temporalmente una variable de entorno / flag `RBAC_DB_ONLY=true`.
- Cuando el flag esté activo, ignorar completamente el "fallback" legacy en memoria: se fuerza lectura estricta desde Base de Datos (a través del membership del usuario).
- Comportamiento esperado: Si a un usuario le falta un permiso en DB (seeds desactualizados), el sistema denegará el acceso (403), revelando huecos de seeders.
- Observabilidad: Monitorear logs de fallos de acceso `event: access_denied` con tags que incluyan el estado del flag para depurar rápidamente si un 403 fue esperado o producto de la migración DB-only.

## 3. Plan de Rollback

- En caso de interrupciones graves a flujos Core durante Staging/QA, el flag se apagará rápidamente (`RBAC_DB_ONLY=false`).
- Esta acción revertirá temporalmente el Guard para confiar también en el array transitorio de `ROLE_PERMISSIONS` en memoria.
- Tiempo objetivo de recuperación (MTTR): Inmediato tras update del entorno.

## 4. Criterios de Aceptación para Remover el Fallback

1. **Zero Falsos Negativos:** 0 errores `403` inesperados o reportados durante Staging con el Flag encendido por al menos un sprint / ventana de QA.
2. **Cobertura Total de Seeders:** El script global de seeds (`prisma/seed.ts` o equivalente) debe insertar _todos_ los roles y permisos estructurales necesarios para cualquier flujo de un "Proyecto Nuevo" sin acudir nunca a hardcodeos en el source.
3. **Eliminación Limpia (Código Fuente):** Al borrar todas las referencias estáticas a `ROLE_PERMISSIONS` del código fuente de `apps/api/src`, el compilador Typescript no debe arrojar errores, y 100% de la suite de Tests Unitarios + E2E de Accesos debe pasar en Verde (`PASS`).
