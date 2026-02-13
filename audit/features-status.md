# Checklist de Features Scrum

## Estado de Implementación

| Feature                      | Implementado | Funcional | Needs Polish | Notas                                                                                                                                 |
| :--------------------------- | :----------: | :-------: | :----------: | :------------------------------------------------------------------------------------------------------------------------------------ |
| **Crear proyecto Scrum**     |      ⚠️      |     ?     |      SI      | No se observó botón de "Crear Proyecto" en `ScrumProjects.tsx`. Probablemente dependa del módulo general de Proyectos o admin db.     |
| **Crear sprint con fechas**  |      ✓       |    SI     |      NO      | `SprintPlanning.tsx` gestiona la creación de Sprints con fecha de inicio/fin y objetivo.                                              |
| **Agregar items al backlog** |      ✓       |    SI     |      NO      | `BacklogView.tsx` permite crear historias y tareas, incluyendo asignación de puntos/horas.                                            |
| **Mover items al sprint**    |      ✓       |    SI     |      NO      | `SprintPlanning.tsx` permite mover items del Backlog a un Sprint (drag & drop o select).                                              |
| **Kanban (Drag & Drop)**     |      ✓       |    SI     |      SI      | `SprintBoard.tsx` implementa un tablero Kanban. Se debe verificar la fluidez del drag & drop (usa botones de mover actualmente).      |
| **Burndown Chart**           |      ✓       |    SI     |      SI      | `ScrumKPIs.tsx` o `ReportsView` contienen visualizaciones. Se requiere verificar si los datos son reales o mock en el componente KPI. |
| **Dashboard con KPIs**       |      ✓       |    SI     |      SI      | `ScrumDashboard` integra KPIs de velocidad y progreso.                                                                                |
| **Crear daily update**       |      ✓       |    SI     |      NO      | `DailyUpdateModal.tsx` permite registrar el status diario (ayer, hoy, bloqueos).                                                      |
| **Ver retrospectiva**        |      ✓       |    SI     |      SI      | `SprintClosureModal.tsx` incluye campos para "Keep/Improve/Stop", actuando como retro básica al cerrar sprint.                        |
| **Gestionar impediments**    |      ✓       |    SI     |      NO      | `ImpedimentTracker.tsx` gestiona impedimentos activos y resueltos.                                                                    |

## Observaciones

1.  **Kanban Interactivo**: El `SprintBoard` actual usa botones ("Iniciar ->", "<- Regresar") para mover tarjetas entre columnas. No se confirmó una implementación de _Drag and Drop_ visual (`dnd-kit` o similar) en la revisión rápida. Esto sería una mejora de UX ("Needs Polish").
2.  **Creación de Proyectos**: La vista de proyectos (`ScrumProjects`) es de solo lectura/navegación. La creación de proyectos parece estar desacoplada, lo cual es común en ERPs grandes, pero podría ser un punto de fricción si se espera crear proyectos "Agile" dedicados desde aquí.
3.  **Reportes**: Existen componentes de KPIs, pero dependen fuertemente de que la data histórica (Sprints cerrados) exista. Sin seed data adecuada, estos dashboards se verán vacíos inicialmente.
