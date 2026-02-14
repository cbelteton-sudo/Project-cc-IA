# 🚀 Despliegue DEMO (Railway + Vercel)

Guía paso a paso para desplegar **Project CConstructions** en la nube en menos de 30 minutos.

## 1. Backend (Railway)

El backend se desplegará en Railway usando Docker.

### Pasos Previos

1. Instala [Railway CLI](https://docs.railway.app/guides/cli) o usa la interfaz web.
2. Ten a mano tu repo en GitHub.

### Paso 1: Crear Proyecto y Base de Datos

1. En Railway, "New Project" -> "Provision PostgreSQL".
2. Una vez creada la DB, ve a la pestaña **Variables** de PostgreSQL y copia `DATABASE_URL` (usa el formato "Connection URL" o "Private").

### Paso 2: Desplegar API

1. En el mismo proyecto, "New" -> "GitHub Repo" -> Selecciona este repositorio.
2. **IMPORTANTE**: Entra en "Settings" del servicio creado INMEDIATAMENTE (antes de que termine el build si puedes, o espera a que falle).
3. Configura las **Variables de Entorno**:
   - `PORT`: `3000`
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: _(Pegar la URL de Postgres del paso 1)_
   - `JWT_SECRET`: `clave-secreta-larga-y-segura-para-demo`
   - `CORS_ORIGIN`: `https://tu-proyecto-web.vercel.app` (Pondremos esto después de desplegar el front, por ahora pon `*` para probar si falla).

4. Configura el **Build** (Settings -> Build):
   - **Root Directory**: Deja vacío (`/`). **NO pongas `apps/api`** porque necesitamos acceso a `packages/` y `pnpm-lock.yaml`.
   - **Dockerfile Path**: `apps/api/Dockerfile`

5. Configura el **Start Command** (Settings -> Deploy > Start Command):
   - Railway usa el `CMD` del Dockerfile, así que déjalo vacío.
   - **Migraciones**: Para la demo, el Dockerfile _no_ corre migraciones automáticamente al inicio para no retrasar el boot.
   - Ve a la pestaña **Deployments**, haz clic en el último deploy -> **View Logs**.
   - Una vez "Active", ve a la pestaña **Settings** -> **Generate Domain**. Copia este dominio (ej: `api-production.up.railway.app`).

### Paso 3: Inicializar Base de Datos (Seed)

Como no podemos acceder a la consola interactiva fácilmente, usaremos el endpoint de salud para verificar y luego correremos las migraciones localmente apuntando a la nube (solo por esta vez) o añadiremos un comando de deploy.

**Opción Recomendada (Build Command):**
En Railway Settings -> Build -> **Build Command**, puedes agregar:
`npx prisma migrate deploy`
Pero esto corre en el build time, donde no siempre hay acceso a la DB si están en redes privadas.

**Opción Manual (Desde tu máquina local):**

1. En tu terminal local:
   ```bash
   export DATABASE_URL="postgresql://postgres:password@roundhouse.proxy.rlwy.net:PORT/railway" # (Usa la URL pública de Railway Postgres)
   cd apps/api
   npx prisma migrate deploy
   npx ts-node prisma/seed-demo.ts
   ```

### Validación API

Entra a `https://<tu-dominio-api>/api/health`.
Debe responder: `{"status":"ok", ...}`

---

## 2. Frontend (Vercel)

### Paso 1: Importar Proyecto

1. Ve a Vercel -> "Add New..." -> "Project".
2. Selecciona el mismo repo Git.

### Paso 2: Configuración del Build

Vercel detectará que es un monorepo o te preguntará.

- **Root Directory**: `apps/web`
- **Framework Preset**: Vite
- **Build Command**: `pnpm build` (o `npm run build` si Vercel lo prefiere, pero asegúrate de que instale dependencias)
  - Si Vercel no detecta pnpm, ve a Settings -> Build & Development e instala pnpm (`corepack enable && pnpm install`).
  - _Truco_: A veces es más fácil poner **Root Directory** en `apps/web`.

### Paso 3: Variables de Entorno

En la configuración del proyecto Vercel:

- `VITE_API_URL`: `https://<tu-dominio-api>/api` (Ojo: añade `/api` al final si tu backend sirve ahí).
  - Ejemplo: `https://project-cconstructions-production.up.railway.app/api`

### Paso 4: Deploy

Haz clic en "Deploy".

---

## 3. Troubleshooting Común

### CORS Error

- **Síntoma**: El frontend dice "Network Error" o consola muestra "CORS policy".
- **Solución**: Ve a Railway -> API Service -> Variables. Asegúrate que `CORS_ORIGIN` incluya el dominio EXACTO de Vercel (sin slash al final). Ej: `https://project-web.vercel.app`.
- Si fallas, pon `CORS_ORIGIN` en `*` (solo para demo).

### Error de Base de Datos

- **Síntoma**: API logs dicen "P2010" o "Connection Refused".
- **Solución**: Verifica que `DATABASE_URL` en Railway Variables es correcta. Re-deploy para que tome el cambio.

### Error "VITE_API_URL is undefined"

- **Síntoma**: El frontend intenta conectar a `localhost:4180`.
- **Solución**: En Vercel, asegura que la variable se llame EXACTAMENTE `VITE_API_URL`. Re-deploy necesario tras cambiar vars.

### Fotos no cargan

- **Síntoma**: Subes una foto y luego desaparece o da 404.
- **Causa**: Railway es efímero. El sistema de archivos se reinicia en cada deploy.
- **Solución Demo**: Es normal. Para producción real se requiere AWS S3.

## 4. Usuarios Demo (Seed)

Si corriste el seed:

- **Admin**: `maria@constructora.com` / `Demo2026!`
- **PM**: `carlos@constructora.com` / `Demo2026!`
- **User**: `ana@constructora.com` / `Demo2026!`
