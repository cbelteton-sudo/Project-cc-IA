# Inventario de Flujos del Sistema

Este documento detalla el estado actual del sistema, mapeando rutas, endpoints, entidades y flujos de usuario identificados en el código.

## 1. Pantallas y Rutas Principales

| Ruta | Componente | Responsabilidad | Archivo Clave |
|---|---|---|---|
| `/projects` | `Projects.tsx` | Listado general y creación de proyectos | `apps/web/src/pages/Projects.tsx` |
| `/projects/:id` | `ProjectBudget.tsx` | Vista detalle del proyecto y presupuesto | `apps/web/src/pages/ProjectBudget.tsx` |
| `/projects/:id/plan` | `ProjectPlan.tsx` | Gestión del cronograma (WBS/Gantt) | `apps/web/src/pages/ProjectPlan.tsx` |
| `/projects/:id/pm` | `PMDashboard.tsx` | Dashboard del Project Manager | `apps/web/src/pages/pm/PMDashboard.tsx` |
| `/field` | `FieldLayout.tsx` | Layout base para módulo de campo | `apps/web/src/layouts/FieldLayout.tsx` |
| `/field/dashboard` | `FieldPMDashboard.tsx` | Dashboard de campo para PM | `apps/web/src/pages/field/FieldPMDashboard.tsx` |
| `/field/today` | `FieldToday.tsx` | Lista de tareas diarias para residentes | `apps/web/src/pages/field/FieldToday.tsx` |
| `/field/entry/:id` | `FieldEntryDetail.tsx` | Detalle de actividad y reporte de avance | `apps/web/src/pages/field/FieldEntryDetail.tsx` |
| `/field/issues` | `IssueTracker.tsx` | Gestión de problemas (Punchlist) | `apps/web/src/pages/field/IssueTracker.tsx` |
| `/procurement/requests` | `MaterialRequests.tsx` | Solicitudes de material | `apps/web/src/pages/MaterialRequests.tsx` |
| `/admin/contractors` | `Contractors.tsx` | Administración de contratistas | `apps/web/src/pages/admin/Contractors.tsx` |
| `/portal/*` | `PortalLayout.tsx` | Portal para acceso de contratistas | `apps/web/src/components/layout/PortalLayout.tsx` |

## 2. Endpoints y Server Actions

| Endpoint | Método | Controlador | Responsabilidad |
|---|---|---|---|
| `/projects` | POST, GET | `ProjectsController` | Crear proyecto, listar proyectos por tenant |
| `/projects/:id` | GET, PATCH, DELETE | `ProjectsController` | CRUD detalle proyecto |
| `/activities` | POST | `ActivitiesController` | Crear actividad en WBS |
| `/activities/project/:projectId` | GET | `ActivitiesController` | Obtener árbol de actividades del proyecto |
| `/activities/:id/dependencies` | POST | `ActivitiesController` | Asignar dependencias (predecesoras) |
| `/activities/:id/close` | POST | `ActivitiesController` | Cerrar actividad formalmente |
| `/field-updates/draft` | POST | `FieldUpdatesController` | Guardar avance (soporte offline/draft) |
| `/field-updates/today` | GET | `FieldUpdatesController` | Obtener stats del día |
| `/issues` | POST, GET | `IssuesController` | Crear y listar problemas reportados |
| `/contractors` | POST, GET | `ContractorsController` | CRUD empresas contratistas |
| `/contractors/:id/projects` | POST | `ContractorsController` | Asignar contratista a un proyecto |

## 3. Entidades y Modelos (DB Schema)

| Entidad (Model) | Responsabilidad | Relaciones Clave |
|---|---|---|
| `Project` | Entidad central, agrupa toda la info | `Tenant`, `Activities`, `Budget`, `Issues` |
| `ProjectActivity` | Nodo del WBS (Cronaograma) | `Project`, `Parent`, `Children`, `Contractor` |
| `ActivityDependency` | Relación de dependencia entre actividades | `Activity`, `DependsOn` |
| `FieldUpdate` | Registro de progreso (Bitácora) | `ProjectActivity`, `Photos`, `FieldUpdateItem` |
| `FieldUpdateItem` | Detalle de avance por actividad | `FieldUpdate`, `ProjectActivity` |
| `Issue` | Problema, bloqueo o punchlist | `Project`, `Activity`, `Comments` |
| `Photo` | Evidencia visual | `Project`, `FieldUpdate`, `Issue` |
| `Contractor` | Empresa externa o proveedor | `Tenant`, `Assignments`, `Users` |
| `ContractorProjectAssignment` | Relación N:M Contratista-Proyecto | `Contractor`, `Project` |
| `User` | Usuario del sistema (Admin, PM, Contratista) | `Tenant`, `Contractor` |

## 4. Flujos de Usuario Identificados

### A. Crear/Editar Proyecto (Dates, Budget)
**Ruta:** `/projects` (Lista) -> Modal Creación -> `/projects/:id` (Detalle)
**Descripción:** El PM crea el proyecto definiendo nombre, código, fechas y presupuesto global.
**Archivos:** `Projects.tsx`, `ProjectsController.ts`, `CreateProjectDto.ts`.

### B. Árbol de Actividades (WBS)
**Ruta:** `/projects/:id/plan`
**Descripción:** Gestión jerárquica de actividades. Se crean nodos padres e hijos, se definen fechas planificadas y dependencias.
**Archivos:** `ProjectPlan.tsx`, `ActivitiesController.ts`, `ProjectActivity` (Entity).

### C. Registro de Avances/Evidencia
**Ruta:** `/field/today` -> Seleccionar Actividad -> `/field/entry/:id`
**Descripción:** El residente selecciona una actividad programada para hoy, sube fotos, reporta porcentaje de avance o items de checklist.
**Archivos:** `FieldToday.tsx`, `FieldEntryDetail.tsx`, `FieldUpdatesController.ts`, `FieldUpdate` (Entity).

### D. Punchlist/Issues
**Ruta:** `/field/issues`
**Descripción:** Reporte de problemas bloqueantes o listas de pendientes (punchlist). Se asigna severidad y estado.
**Archivos:** `IssueTracker.tsx`, `IssuesController.ts`, `Issue` (Entity).

### E. Módulo Contratista y Asignaciones
**Ruta:** `/admin/contractors` -> `/admin/contractors` (Modal Asignar)
**Descripción:** Admin da de alta la empresa contratista y la asigna a un proyecto específico. Luego, en el WBS (`ProjectPlan`), se asignan actividades a ese contratista.
**Archivos:** `Contractors.tsx`, `ContractorsController.ts`, `Contractor` (Entity).
