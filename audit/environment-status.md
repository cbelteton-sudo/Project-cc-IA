# Estado del Entorno y Demo Data

## 1. Base de Datos

- **Provider:** SQLite (`datasource db { provider = "sqlite" }` en `schema.prisma`).
- **Estado Schema:** Parece consistente. Contiene modelos `Tenant`, `User`, `Project` y todo el módulo Scrum (`BacklogItem`, `Sprint`, `DailyUpdate`, `Impediment`).
- **Migraciones:** Se asume al día (dev.db existe).

## 2. Seed / Demo Data (`apps/api/prisma/seed.ts`)

- **Script:** Existe y corre correctamente.
- **Contenido Generado:**
  - Tenant: "Constructora Demo".
  - Usuario: "Admin User".
  - Proyecto: "TORRE MAWI DEMO".
  - Actividades WBS (Fase 9): Preliminares, Estructura, etc.
- **⚠️ GAP CRÍTICO:** **NO genera datos de Scrum.**
  - No crea Items de Backlog.
  - No crea Sprints.
  - El dashboard de Scrum aparecerá vacío ("No hay Sprint Activo") al inicio.

## 3. Dependencias y Ejecución

- **Proyecto:** Monorepo (Nx-style) con `apps/api` (NestJS) y `apps/web` (Vite/React).
- **Estado:**
  - API: Corriendo en puerto 4180.
  - Web: Corriendo en puerto 5173.
- **Node:** v22.13.1 (según `bootstrap_node.sh`).

## Recomendaciones

1.  **Actualizar Seed:** Urge agregar creación de Backlog Items y un Sprint activo en el seed para que la demo no esté vacía.
2.  **Docker:** No es necesario por ahora (SQLite local simplifica el MVP).
