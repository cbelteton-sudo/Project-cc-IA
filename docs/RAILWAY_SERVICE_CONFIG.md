# Railway Service Config

Este manual define la configuración servicio-a-servicio que debe mapearse dentro de la consola UI de Railway (Settings).

## 1. Servicio: PostgreSQL (Database)

- **Tipo de recurso:** Provisionar un "Postgres plugin" desde el dashboard.
- **Acceso:** Obtener la String Connection estándar provista por Railway. Estará disponible bajo el formato `postgresql://usuario:pass@host:port/dbname`.

## 2. Servicio: NestJS API (Backend)

- **Source:** Conectar Repo de GitHub -> Carpeta `apps/api` (Root Directory).
- **Builder:** Nixpacks o Dockerfile (Nixpacks funciona por defecto con pnpm workspaces).
- **Variables de Entorno (Environment Variables):**
  - _Click en + New Variable_ (Ver bloque de Variables en `ENV_TEMPLATE_STAGING.txt`)
- **Build Command:** `pnpm run build`
- **Start Command:** `pnpm run start:prod`
- **Networking:** Generar "Public Domain" (ej. `api-staging.up.railway.app`). Configurar en Custom Domain si existe.
- **Port:** (Dejar automático o 3000).
- **Healthcheck Path:** `/health`
- **Pre-deploy Command:** Asegurarse de ejecutar migraciones antes. `npx prisma migrate deploy` o en el package.json script.

## 3. Servicio: React Vite (Frontend Web)

- **Source:** Conectar Repo de GitHub -> Carpeta `apps/web` (Root Directory).
- **Builder:** Nixpacks.
- **Variables de Entorno (Environment Variables):**
  - _Click en + New Variable_ -> Agregar `VITE_API_URL` apuntando al Public Domain del Backend.
- **Build Command:** `pnpm run build`
- **Start Command:** `pnpm run preview --host 0.0.0.0 --port $PORT`
- **Networking:** Generar "Public Domain" (ej. `web-staging.up.railway.app`).

## Flujo de Orquestación Recomendado en Railway:

1. Crear el proyecto en Railway.
2. Añadir Plugin PostgreSQL.
3. Añadir el servicio **API** y configurarle el `DATABASE_URL`.
4. Disparar el deploy del API.
5. Ejecutar la semilla (Command Palette en Railway > Execute Command: `pnpm run seed:demo`).
6. Añadir el servicio **WEB**, copiando la URL pública que arrojó el API y colocándola en `VITE_API_URL`.
7. Disparar deploy de WEB.
