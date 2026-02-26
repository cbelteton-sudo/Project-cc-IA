# Release Notes: CConstructions MVP v1 (Release Candidate)

**Fecha:** 25-Febrero-2026
**Versión:** 1.0.0-rc.1
**Estado:** GO para presentación/demo

Estamos emocionados de anunciar el Release Candidate del MVP v1 de CConstructions. Esta versión consolida el Core del sistema, habilitando la colaboración multi-rol y la gestión integral de proyectos de construcción mediante un entorno digital, seguro, y colaborativo.

## Resumen de la Versión

Esta entrega v1.0.0 establece las bases transaccionales y de control de los proyectos, proveyendo:

1.  **Fundamentos de Autenticación y RBAC (Role-Based Access Control):** Un sólido sistema multi-tenant con usuarios, roles, y asignación de proyectos que limitan la visibilidad de la BD estrictamente a lo que el usuario debe operar.
2.  **Módulos Clave Habilitados:**
    - **Project Plan:** Gestión jerárquica de actividades, y asignación a Contratistas.
    - **Scrum Dashboard (Agile):** Control de ejecución semanal a través de Backlog, Sprints, y un Kanban Board con Drag & Drop y Score Card de salud en vivo.
    - **Punch List:** Listado de defectos interactivo.
    - **Contractors (Contratistas):** Interfaz para manejar la tabla de contratistas que interactúan con el proyecto.

## Mejoras Destacadas

- **UI/UX Refinada:** El frontend está operando con React Vite, integrado completamente con TailwindCSS. Modales animados, estados de carga coherentes (Skeletons/Spinners), y un diseño de layout persistente e intuitivo.
- **Seguridad Garantizada:** 100% de Unit Tests en el Helper de Prisma ( `enforceScopeWhere` ) que encapsula y asegura los datos en cada query emitido hacia la DB.
- **Flujos de Trabajo Ágiles Intuitivos:** La tarjeta de SprintBoard ahora cuenta con botones de acción directa para saltar estados sin necesidad estricta de arrastrar, ideal para dispositivos portátiles en campo.

## Notas Técnicas y Resolución de Problemas (Bug Fixes)

- **RBAC Fuga de Memoria / Overfetching:** El `enforceScopeWhere` ha sido blindado tras resolver un cast de variables estricto en el script de UAT.
- **Formato de Logs CI-CD:** Modificadas aserciones de pruebas de `jest` para procesar el nuevo standard JSON Logging output del backend.

## Roadmap & Features Diferidos (Out of Scope v1)

Como acordado para garantizar una entrega robusta de lo esencial, los siguientes módulos quedan diferidos para versiones posteriores:

- Pagos y Presupuestos (EVM avanzado en tiempo real con datos de transacciones).
- Workflows Complejos de RFI/Submittals.
- Alertas por Email / Push Notifications.

## Recomendación GO / NO-GO

**Decisión Final:** **GO.**

El MVP cumple consistentemente con el _Happy Path_ requerido y con todas las pruebas estresadas a nivel roles y seguridad. La aplicación está lista para ser poblada y demostrada en vivo a prospectos y directores de PMO/Residencia.
