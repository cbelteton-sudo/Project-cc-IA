# Auditoría Backend: Endpoints Scrum

| Endpoint                        | Método | DTO Validado             | Error Handling    | Estado |
| ------------------------------- | ------ | ------------------------ | ----------------- | ------ |
| `projects/:projectId/dashboard` | GET    | N/A (Param)              | ✓ (Global Filter) | OK     |
| `backlog`                       | POST   | ✓ (CreateBacklogItemDto) | ✓ (Global Filter) | OK     |
| `backlog/:projectId`            | GET    | N/A (Param)              | ✓ (Global Filter) | OK     |
| `backlog/convert`               | POST   | ✓ (ConvertActivityDto)   | ✓ (Global Filter) | OK     |
| `backlog/:id`                   | PATCH  | ✓ (UpdateBacklogItemDto) | ✓ (Global Filter) | OK     |
| `backlog/:id/assign`            | PATCH  | ✓ (AssignBacklogItemDto) | ✓ (Global Filter) | OK     |
| `sprints`                       | POST   | ✓ (CreateSprintDto)      | ✓ (Global Filter) | OK     |
| `sprints/:projectId`            | GET    | N/A (Param)              | ✓ (Global Filter) | OK     |
| `sprints/:sprintId/items`       | POST   | ✓ (AddSprintItemsDto)    | ✓ (Global Filter) | OK     |
| `sprints/:sprintId/start`       | PATCH  | N/A (Param)              | ✓ (Global Filter) | OK     |
| `sprints/:sprintId/close`       | PATCH  | ✓ (CloseSprintDto)       | ✓ (Global Filter) | OK     |
| `items/:itemId/status`          | PATCH  | ✓ (UpdateItemStatusDto)  | ✓ (Global Filter) | OK     |
| `items/reorder`                 | POST   | ✓ (ReorderItemsDto)      | ✓ (Global Filter) | OK     |
| `daily-updates`                 | POST   | ✓ (CreateDailyUpdateDto) | ✓ (Global Filter) | OK     |
| `daily-updates/:projectId`      | GET    | N/A (Query)              | ✓ (Global Filter) | OK     |
| `impediments`                   | POST   | ✓ (CreateImpedimentDto)  | ✓ (Global Filter) | OK     |
| `impediments/:projectId`        | GET    | N/A (Param)              | ✓ (Global Filter) | OK     |
| `impediments/:id/resolve`       | PATCH  | N/A (Param)              | ✓ (Global Filter) | OK     |

**Notas:**

- Se utiliza `ValidationPipe` global con `whitelist: true`, asegurando que los DTOs filtran propiedades no deseadas.
- Se utiliza `AllExceptionsFilter` global para manejo de errores.
- La estructura del controlador sigue las prácticas estándar de NestJS.
