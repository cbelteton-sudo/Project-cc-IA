# Auditoría Backend: Módulo Scrum

## Análisis de Endpoints

Revisión del archivo: `apps/api/src/modules/scrum/scrum.controller.ts`

| Endpoint                          | Método | Status     | Notas                                              |
| :-------------------------------- | :----- | :--------- | :------------------------------------------------- |
| `/scrum/backlog`                  | POST   | ⚠️ Partial | Usa `any` en body. Falta DTO estricto.             |
| `/scrum/backlog/:projectId`       | GET    | ✓ OK       | -                                                  |
| `/scrum/backlog/convert`          | POST   | ✓ OK       | Body tipado `{ activityId, projectId }`.           |
| `/scrum/backlog/:id`              | PATCH  | ⚠️ Partial | Usa `any` en body. Falta DTO estricto.             |
| `/scrum/backlog/:id/assign`       | PATCH  | ✓ OK       | Body tipado `{ userId }`.                          |
| `/scrum/sprints`                  | POST   | ⚠️ Partial | Usa `any` en body. Falta DTO estricto.             |
| `/scrum/sprints/:projectId`       | GET    | ✓ OK       | -                                                  |
| `/scrum/sprints/:sprintId/items`  | POST   | ✓ OK       | Body tipado `{ items: string[] }`.                 |
| `/scrum/sprints/:sprintId/start`  | PATCH  | ✓ OK       | -                                                  |
| `/scrum/sprints/:sprintId/close`  | PATCH  | ✓ OK       | Body tipado opcional `{ keep?, improve?, stop? }`. |
| `/scrum/items/:itemId/status`     | PATCH  | ✓ OK       | Body tipado `{ status }`.                          |
| `/scrum/items/reorder`            | POST   | ✓ OK       | Body tipado `{ sprintId, orderedIds }`.            |
| `/scrum/daily-updates`            | POST   | ⚠️ Partial | Usa `any` en body. Falta DTO estricto.             |
| `/scrum/daily-updates/:projectId` | GET    | ✓ OK       | Soporta query params `sprintId`, `backlogItemId`.  |
| `/scrum/impediments`              | POST   | ⚠️ Partial | Usa `any` en body. Falta DTO estricto.             |
| `/scrum/impediments/:projectId`   | GET    | ✓ OK       | -                                                  |
| `/scrum/impediments/:id/resolve`  | PATCH  | ✓ OK       | -                                                  |

## Hallazgos Generales

1.  **Falta de DTOs Estrictos**: Varios endpoints de creación y actualización (`createBacklogItem`, `updateBacklogItem`, `createSprint`, `createDailyUpdate`, `createImpediment`) utilizan types `any` en el decorador `@Body()`. Esto representa un riesgo de seguridad y validación. Se recomienda implementar clases DTO con `class-validator`.
2.  **Manejo de Errores**: El controlador delega el manejo de errores al servicio. Se asume que existe un filtro de excepciones global, pero sería ideal verificar validaciones explícitas en el controller o pipes de validación.
3.  **Auth Guards**: Se observó una línea comentada `// import { JwtAuthGuard } ...`. Es necesario verificar si existe un Guard global aplicado o si estos endpoints están actualmente públicos/protegidos correctamente.
