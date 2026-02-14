# Checklist de Features Implementados

| #   | Feature                  | ¿Implementado? | ¿Funcional? | ¿Necesita Polish? | Notas                                                                                                                          |
| --- | ------------------------ | -------------- | ----------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Crear proyecto Scrum     | ✗              | ✗           | N/A               | **BLOQUEANTE**. No existe botón/modal en `ScrumProjects.tsx`. Solo se pueden ver proyectos existentes (creados por seed).      |
| 2   | Crear sprint con fechas  | ✓              | ✓           | Sí                | Gestionado en `SprintPlanning` (endpoints existen, UI parece completa).                                                        |
| 3   | Agregar items al backlog | ✓              | ✓           | No                | `BacklogView` tiene modal completo con tipos (Story/Task), estimación y asignación.                                            |
| 4   | Mover items al sprint    | ✓              | ✓           | Sí                | Soportado en flujo de planificación.                                                                                           |
| 5   | Drag & drop en Kanban    | ✓              | ✓           | No                | Implementado con `@dnd-kit` en `SprintBoard.tsx`. Soporta optimistically updates.                                              |
| 6   | Burndown chart           | ✓              | ?           | Sí                | Componente `ScrumKPIs` existe, pero no se validó si renderiza datos reales con `recharts`.                                     |
| 7   | Dashboard ejecutivo      | ✓              | ✓           | Sí                | Endpoint de métricas backend existe. Frontend tiene tab de Métricas.                                                           |
| 8   | Crear daily standup      | ✓              | ✓           | No                | `DailyUpdateModal` implementado y conectado a botones en el Board.                                                             |
| 9   | Ver/crear retrospectiva  | ⚠️             | ⚠️          | Sí                | Existe `SprintClosureModal` para cerrar sprint, pero no se ve un módulo específico de "Retrospectiva" detallada (solo cierre). |
| 10  | Gestionar impediments    | ✓              | ✓           | No                | Tab `Impediments` y endpoint backend existen.                                                                                  |

**Resumen de Gaps:**

1.  **Creación de Proyectos:** El usuario no puede iniciar un nuevo proyecto Scrum desde cero.
2.  **Seed Data:** No hay datos de Scrum en el seed, por lo que el tablero aparece vacío inicialmente a menos que se creen datos manualmente.
3.  **Retrospectiva:** La funcionalidad parece limitada a "Cerrar Sprint", faltando quizás una gestión más rica de la retrospectiva (Start/Stop/Continue).
