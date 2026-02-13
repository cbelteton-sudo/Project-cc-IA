# Rutas Principales

## Backend (NestJS)
**Entry Point**: `apps/api/src/main.ts`
**Root Module**: `apps/api/src/app.module.ts`

El backend utiliza la estructura modular de NestJS. Las rutas se definen en los controladores de cada módulo (ver `features-implemented.md` para la lista completa de módulos).
Prefijo global típico: `/api` (configurable en `main.ts`, pendiente de verificar en runtime).

## Frontend (React Router)
**Entry Point**: `apps/web/src/main.tsx` (o `index.tsx`)
**Router Config**: `apps/web/src/App.tsx` o `apps/web/src/routes.tsx`

Rutas inferidas por estructura de páginas:
- `/login`
- `/dashboard`
- `/projects`
- `/projects/:id`
- `/field`
- `/scrum`
- `/reports`
