# 02. Auditoría de Backend / API

## 1. Stack Tecnológico

- **Framework**: NestJS v11 (Última versión estable).
- **Lenguaje**: TypeScript.
- **Base de Datos**: Prisma ORM con SQLite (según `schema.prisma`).
- **Arquitectura**: Modular (Modules, Controllers, Services).

## 2. Estructura y Módulos

El backend está altamente modularizado. Se detectaron **27 módulos** de dominio en `apps/api/src/modules/`, incluyendo:

| Módulo          | Estado | Observaciones                                                                           |
| :-------------- | :----: | :-------------------------------------------------------------------------------------- |
| `scrum`         |   ✅   | Controlador completo (`ScrumController`), DTOs detallados, Lógica compleja en Servicio. |
| `auth`          |   ✅   | Login implementado, JWT Strategy, Guards.                                               |
| `users`         |   ⚠️   | CRUD básico. **ALERTA DE SEGURIDAD**: Controlador sin Guards.                           |
| `projects`      |   ✅   | Gestión central de proyectos.                                                           |
| `budgets`       |   ✅   | Gestión financiera.                                                                     |
| `field-updates` |   ✅   | Reportes de campo, fotos.                                                               |
| `notifications` |   ✅   | Sistema de notificaciones.                                                              |
| ... y 20+ más   |   ✅   | Estructura consistente generada por NestJS CLI.                                         |

## 3. API y Endpoints

- **Prefijo Global**: `/api` (configurado en `main.ts`).
- **Swagger**: No se encontró configuración de Documentación (Swagger/OpenAPI) en `main.ts`.
- **CORS**: Habilitado para todos los orígenes (`origin: true`).

### Análisis del Módulo Scrum (Muestra)

El `ScrumController` expone una API REST completa:

- `POST /scrum/projects`
- `GET /scrum/projects/:id/dashboard`
- `POST /scrum/backlog`
- `POST /scrum/sprints`
- `PATCH /scrum/items/:id/status`
- Uso correcto de DTOs (`CreateBacklogItemDto`, `CreateSprintDto`) y validación vía `class-validator`.

## 4. Patrones de Backend

- **Validación**: ✅ `ValidationPipe` global con `whitelist: true`. Esto limpia propiedades no definidas en los DTOs.
- **Manejo de Errores**: ✅ `AllExceptionsFilter` global captura excepciones y normaliza respuestas.
- **Archivos Estáticos**: Sirve archivos desde `uploads/`.
- **Autenticación**: Uso de Decoradores propios (`@ActiveUser`) y Guards estándar (`JwtAuthGuard`).

## 5. Integraciones

- **Email**: No se detectó módulo de envío de correos (SendGrid/Nodemailer) en la revisión rápida.
- **Storage**: Almacenamiento local en disco (`uploads/`). No hay evidencia de S3/Cloudinary.
- **WebSockets**: No se detectó `Gateway` de WebSockets configurado.

## 6. Conclusión del Agente

El backend tiene una **arquitectura sólida y escalable** gracias a NestJS. El código es limpio y sigue buenas prácticas (DTOs, Services).

**Riesgos Críticos:**

1.  **Seguridad en `UsersController`**: Parece exponer endpoints de creación/listado de usuarios sin protección (`@UseGuards` ausente).
2.  **Documentación**: Falta Swagger, lo que dificulta el consumo por terceros o frontend sin ver el código.

**Calificación: 8/10**
