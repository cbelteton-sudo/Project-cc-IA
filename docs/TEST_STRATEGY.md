# Test Strategy & Regresión Funcional en Staging

Este documento detalla la matriz mínima de pruebas de aceptación (UAT) requerida por product managers y el equipo de QA antes de lanzar cambios en el sistema de RBAC Multi-proyecto.

## Matriz de Regresión (Staging)

Los siguientes escenarios **deben ser probados manualmente (o automatizado vía E2E en UI)** iniciando sesión con los siguientes perfiles de usuario de prueba:

### 1. PM Multi-Proyecto (Rol: `PROJECT_MANAGER`)

- [ ] Debe poder listar todos los proyectos a los que fue invitado explícitamente.
- [ ] Debe poder editar fechas cronológicas, presupuesto y sprints _solo_ en proyectos asignados.
- [ ] **Data Isolation**: Debe recibir _404 o 403_ si digita en el URL un ID de proyecto válido que existe en el tenant pero al que no está vinculado.

### 2. Director PMO (Rol: `DIRECTOR_PMO`)

- [ ] Al cargar la vista de Proyectos (`GET /projects`), debe recibir un listado de _todos_ los proyectos de ese `tenantId` activo.
- [ ] Dashboard Financiero debe totalizar datos del Portafolio completo.
- [ ] No puede crear nuevos recursos que interfieran el trabajo operativo a menos que tengan explícito permiso de edición granular (verificar vista _solo lectura_ vs _edición_).

### 3. Contratista Limitado (Rol: `CONTRACTOR_LEAD`)

- [ ] Al entrar a un proyecto, solo debe ver Tickets / Actividades vinculadas a sus `contractorId`.
- [ ] **Data Isolation**: Si trata de enviar un cURL POST /activities asociándolo a otro contratista dentro del mismo proyecto, el sistema debe rechazarlo o reescribir el `contractorId`.
- [ ] Flujo de cierre de tareas operativo exitoso.

### 4. Cliente Espectador (Rol: `VIEWER` u otros readonly)

- [ ] Botones de edición (`POST`, `PUT`, `DELETE`) deben estar ocultos en UI.
- [ ] Vistas autorizadas deben cargar sin fallos.
- [ ] Llamadas manuales de API a mutaciones deben ser denegadas rigurosamente con 403.
