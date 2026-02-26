# Control de Alcance: MVP Freeze Final v1

## 1. Alcance Confirmado (In-Scope)

| Módulo               | Feature                     | Critero de Aceptación (DoD)                                                                        | Estado                                             |
| -------------------- | --------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Seguridad & Core** | Multitenancy & RBAC         | Aislamiento DB nativo; Login/Logout funciona; Guardas restringen vistas por rol.                   | ✅ DONE                                            |
| **Scrum Board**      | Gestión de Backlog y Tareas | Transición visual de tickets: `TODO` -> `IN_PROGRESS` -> `DONE`.                                   | 🚧 PARTIAL (Falta UI Drag/Drop o Botones)          |
| **Operaciones**      | Actividades (Cronograma)    | API funcional; UI permite listar y crear actividades del WBS.                                      | 🚧 PARTIAL (Falta UI)                              |
| **Operaciones**      | Contratistas                | API funcional; UI permite registrar asginaciones de empresas a proyectos.                          | 🚧 PARTIAL (Falta UI)                              |
| **UX/UI Base**       | RBAC dinámico en frontend   | Botones "Peligrosos" (Borrar, Crear) deshabilitados para roles de solo lectura (Residente/Viewer). | 🚧 PARTIAL (Falta validación empírica en frontend) |

## 2. Fuera de Alcance (Out-of-Scope)

_Se pospone para la v2 con recomendación de evitar Scope Creep en las últimas 48h:_

- **Presupuestos y Estimaciones (Módulo Financiero):** Lógica matemática y aprobación de pagos a subcontratistas.
- **File Storage Activo:** Subida nativa de archivos adjuntos y evidencias fotográficas (S3/GCP). Requeriría dependencias IaaS.
- **Reporting Nativo:** PDFs dinámicos o dashboards estadísticos con curvas S avanzadas.
- **Onboarding de Tenants Automático:** Creación de nuevos espacios de trabajo via Self-Service; se operará inicialmente mediante scripts de base de datos.

## 3. Matriz General (Endpoint / Frontend Parity)

- **API (NestJS / Prisma):** 100% de los endpoints MVP expuestos (Auth, Scrum, Actividades, Contratistas).
- **Frontend (React / Vite):** Faltan componentes en Proyectos Dinámicos para cerrar la curva de valor del usuario final.
