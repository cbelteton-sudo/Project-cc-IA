# Features Implementadas

## Backend - Módulos y Endpoints Principales
Basado en la estructura de `apps/api/src/modules`:

- [ ] **Activities**: Gestión de actividades del proyecto
- [ ] **Auth**: Autenticación (Login, Register, JWT)
- [ ] **Budgets**: Gestión de presupuestos y líneas presupuestarias
- [ ] **Change Orders**: Órdenes de cambio
- [ ] **Contractors**: Gestión de contratistas
- [ ] **Daily Log**: Bitácora diaria de obra
- [ ] **Field Reports**: Reportes de campo
- [ ] **Field Updates**: Actualizaciones de avance desde campo
- [ ] **Inspections**: Inspecciones de calidad/seguridad
- [ ] **Invoices**: Facturación
- [ ] **Issues**: Gestión de incidencias
- [ ] **Material Requests**: Solicitudes de material
- [ ] **Materials**: Catálogo de materiales
- [ ] **Notifications**: Sistema de notificaciones
- [ ] **Photos**: Gestión de evidencia fotográfica
- [ ] **PM Dashboard**: Dashboard para Project Managers
- [ ] **Progress Estimates**: Estimaciones de avance
- [ ] **Projects**: Gestión de proyectos (CRUD)
- [ ] **Purchase Orders**: Órdenes de compra
- [ ] **Reports**: Reportes generales
- [ ] **RFIs**: Solicitudes de información (Request For Information)
- [ ] **RFQs**: Solicitudes de cotización (Request For Quotation)
- [ ] **Scrum**: Gestión ágil (Sprints, Backlog)
- [ ] **Subcontracts**: Subcontratos
- [ ] **Tenants**: Multi-tenancy
- [ ] **Timesheets**: Hojas de tiempo
- [ ] **Users**: Gestión de usuarios

## Frontend - Páginas y Vistas Principales
Basado en `apps/web/src/pages`:

- [ ] **Auth**: Login
- [ ] **Dashboard**: Vista principal
- [ ] **Projects**: Lista y detalles de proyectos
- [ ] **Project Plan**: Planificación (Gantt/Cronograma)
- [ ] **Budgets**: Presupuestos
- [ ] **Field**: Gestión de campo
- [ ] **Material Requests**: Solicitudes de materiales
- [ ] **Scrum**: Tablero Scrum y Proyectos Ágiles
- [ ] **Reports**: Vistas de reportes (ProjectReport, ExecutiveReport)
- [ ] **Finance**: PurchaseOrders, Invoices, ChangeOrders
- [ ] **Admin**: Gestión de usuarios/configuración
- [ ] **Portal**: Portal de contratistas/externos

## Funcionalidades Scrum Detectadas
- [x] **Product Backlog**: Implementado (Modelo `BacklogItem` y módulo `scrum`)
- [x] **Sprints**: Implementado (Modelo `Sprint`)
- [x] **User Stories**: Implementado (vía Items del Backlog)
- [x] **Kanban Board**: Implementado (Vista ScrumPage)
- [x] **Burndown Chart**: Probable (Modelo `Sprint` tiene fechas, pero requiere verificar implementación visual)
- [x] **Daily Standup**: Implementado (Modelo `DailyUpdate`)
