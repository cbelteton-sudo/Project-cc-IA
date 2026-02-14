# 01. Auditoría de Base de Datos y Modelos

## 1. Resumen de Modelos (Prisma Schema)

El esquema de base de datos es extenso y cubre múltiples dominios complejos.

| Dominio        | Modelo             | Campos Aprox. | Relaciones Clave              | Estado                   |
| :------------- | :----------------- | :-----------: | :---------------------------- | :----------------------- |
| **Core**       | `Tenant`           |      10+      | Users, Projects               | ✅ Completo              |
|                | `User`             |      15+      | Tenant, ProjectActivity, Auth | ✅ Completo              |
|                | `AuditLog`         |       8       | User, Tenant                  | ✅ Básico                |
| **Proyectos**  | `Project`          |      20+      | Budget, Scrum, Field          | ✅ Completo              |
|                | `Contractor`       |      15+      | Project, Users                | ✅ Completo              |
| **Scrum**      | `Sprint`           |      10       | Project, Items                | ✅ Completo              |
|                | `BacklogItem`      |      15+      | Sprint, User, Hierarchy       | ✅ Completo (Jerárquico) |
|                | `SprintItem`       |       5       | Sprint, BacklogItem           | ✅ Completo              |
|                | `DailyUpdate`      |       8       | User, Sprint                  | ✅ Completo              |
|                | `Impediment`       |      10       | Sprint, BacklogItem           | ✅ Completo              |
|                | `Retro`            |       5       | Sprint                        | ✅ Básico                |
| **Field**      | `ProjectActivity`  |      25+      | Project, Budget, FieldUpdate  | ✅ Muy Completo          |
|                | `FieldUpdate`      |      15+      | Activity, Photos              | ✅ Completo              |
|                | `FieldDailyReport` |      10       | Project, Entries              | ✅ Completo              |
|                | `RFI`              |      10       | Project                       | ✅ Básico                |
|                | `Inspection`       |       8       | Project                       | ✅ Básico                |
|                | `Issue`            |      15+      | Project, Location             | ✅ Completo              |
| **Financiero** | `Budget`           |       5       | Project, Lines                | ✅ Estructural           |
|                | `BudgetLine`       |      15       | Activity, POs                 | ✅ Completo              |
|                | `CostLedger`       |      10       | Project, WBS                  | ✅ Completo              |
|                | `PurchaseOrder`    |      12       | Vendor, Items                 | ✅ Completo              |
|                | `Invoice`          |      15       | PO, Project                   | ✅ Completo              |

## 2. Evaluación Técnica

### ✅ Puntos Fuertes

- **Relaciones Claras**: El uso de Foreign Keys (`@relation`) es consistente en todo el esquema.
- **Multitenancy**: El modelo `Tenant` está presente y vinculado a las entidades principales (`Project`, `User`), permitiendo aislamiento de datos.
- **Trazabilidad**: Modelos como `CostLedger` y `AuditLog` sugieren un diseño orientado a auditoría financiera y de sistema.
- **Jerarquías**: `BacklogItem` (Parent/Child) y `ProjectActivity` (WBS) soportan estructuras recursivas.

### ⚠️ Áreas de Atención (Gaps)

- **Enums como Strings**: Se utiliza `String` para campos de estado (`status`, `type`, `role`) en lugar de `enum` nativos de Prisma. Esto se debe probablemente al uso de SQLite (`provider = "sqlite"`), que no soporta enums nativos, pero reduce la seguridad de tipos en la DB.
- **Soft Delete**: No se observó un patrón consistente de `deletedAt` o `isDeleted`. El borrado parece ser físico (hard delete), lo cual es riesgoso para datos financieros/legales.
- **Índices**: Faltan índices explícitos (`@@index`) en campos de búsqueda frecuentes (ej. `status`, `date`, `assigneeUserId`), lo que podría afectar el rendimiento con grandes volúmenes de datos.

## 3. Migraciones y Seeds

- **Migraciones**: Existen **11 migraciones** en `prisma/migrations`, indicando una evolución activa del esquema (fases 9, 16, 17, scrum, reports, etc.).
- **Seeds**: Sistema de seed robusto.
  - `seed.ts` (Principal)
  - `seed-scrum.ts` (Datos específicos de Scrum)
  - `seed-demo.ts` (Datos de demostración completos)
  - `seed-pm.ts`, `seed-materials.ts`, etc.

## 4. Conclusión del Agente

La capa de datos es **madura y completa** para una aplicación de gestión de construcción. Cubre todos los aspectos críticos (costos, tiempos, alcance, calidad). La principal deuda técnica es la falta de `Soft Delete` y el uso de SQLite con Strings en lugar de una DB más robusta (PostgreSQL) con Enums nativos para producción.

**Calificación: 9/10 (Modelo) | 7/10 (Implementación DB)**
