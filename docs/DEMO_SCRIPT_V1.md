# Guión de Demo MVP v1 - CConstructions

## Preparación
Antes de iniciar la demo, asegúrese de:
1. Haber ejecutado el seeder de UAT: `pnpm run seed:uat-demo`.
2. Tener el backend corriendo (`pnpm run dev` en `apps/api`) y el frontend corriendo (`pnpm run dev` en `apps/web`).

## Flujo 1: Director PMO (Vista Global)
- **Usuario:** `director_1@uatcorp.com` / `Developer1!`
- **Acción:** Iniciar sesión.
- **Validación:**
  - El usuario es dirigido al Dashboard principal.
  - El dashboard muestra métricas globales (múltiples proyectos bajo UAT Corporation).
  - Puede navegar al portafolio de proyectos y ver tanto "Torre Residencial Alpes" como "Centro Comercial Plaza Nova".

## Flujo 2: Project Manager (Gestión de Proyecto)
- **Usuario:** `pm_1@uatcorp.com` / `Developer1!`
- **Acción:** Iniciar sesión y navegar a "Torre Residencial Alpes".
- **Validación:**
  - El usuario puede modificar detalles del proyecto y gestionar el equipo.
  - Navegar a "Semanas de Obra (Agile)" -> Ver el Backlog y el Sprint Board.
  - Crear un nuevo elemento en el Backlog.
  - Mover un elemento de la columna "Por Hacer" a "En Progreso" usando Drag & Drop o los botones de acción rápida.
  - Navegar a "Constructores" y verificar la capacidad de añadir un nuevo contratista al proyecto.

## Flujo 3: Field Operator / Residente (Trabajo de Campo)
- **Usuario:** `residente_1@uatcorp.com` / `Developer1!`
- **Acción:** Iniciar sesión.
- **Validación:**
  - Solo debe ver el proyecto "Torre Residencial Alpes" (no Plaza Nova).
  - Entrar al proyecto -> "Semanas de Obra (Agile)".
  - Intentar arrastrar un elemento directo a "Completado" (Debe ser bloqueado por UI/API, debe enviarse a "En Revisión").
  - Mover una tarea "Por Hacer" -> "En Progreso" -> "En Revisión".
  - Navegar a "Punch List" y crear un nuevo defecto (Punch item) asociado a una zona específica de la obra.

## Flujo 4: Executive Viewer (Solo Lectura)
- **Usuario:** `exec_1@uatcorp.com` / `Developer1!`
- **Acción:** Iniciar sesión y entrar a un proyecto disponible.
- **Validación:**
  - El acceso es de solo lectura.
  - En "Semanas de Obra", no debe poder arrastrar tarjetas del tablero Scrum.
  - En "Punch List", no aparece el botón para crear nuevos defectos.
  - Todas las gráficas del Análisis EVM son completamente funcionales para reporte.

---
**Nota:** Este script cubre de principio a fin las funcionalidades in-scope para la entrega del MVP v1.
