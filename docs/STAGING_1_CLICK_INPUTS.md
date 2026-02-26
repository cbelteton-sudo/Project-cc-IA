# Staging 1-Click Inputs (Railway)

Este documento centraliza todos los inputs exactos requeridos para desplegar el proyecto "CConstructions" (Monorepo pnpm) en un entorno de **Staging** en Railway sin fricción.

---

## 1. Repositorio y Ramas

- **Nombre exacto del repo:** `Project-CConstructions` (o el nombre mapeado en GitHub).
- **Rama recomendada para Staging:** `staging` (si existe) o directamente `main` (si se usa flujo continuo).
- **Estrategia Merge `staging -> main`:** "Squash and Merge" o "Fast-forward", asegurando que el código pasa las pruebas (GitHub Actions) antes de que Railway reaccione al push en `main`.

## 2. Monorepo Commands (pnpm)

_Nota: Railway detecta automáticamente los workspaces de pnpm, pero es más seguro usar los "Custom Start Commands" y "Custom Build Commands" apuntando a los directorios o filtrando._

| Acción             | Comando (Directorio Raíz)                               | Alternativa (Dentro del directorio)                           |
| :----------------- | :------------------------------------------------------ | :------------------------------------------------------------ |
| **Build API**      | `pnpm --filter api build`                               | `cd apps/api && pnpm run build`                               |
| **Start API**      | `pnpm --filter api start:prod`                          | `cd apps/api && pnpm run start:prod`                          |
| **Build Web**      | `pnpm --filter web build`                               | `cd apps/web && pnpm run build`                               |
| **Start Web**      | `pnpm --filter web preview --host 0.0.0.0 --port $PORT` | `cd apps/web && pnpm run preview --host 0.0.0.0 --port $PORT` |
| **Prisma Migrate** | `pnpm --filter api exec prisma migrate deploy`          | `cd apps/api && npx prisma migrate deploy`                    |
| **Seed UAT Demo**  | `pnpm --filter api run seed:demo`                       | `cd apps/api && pnpm run seed:demo`                           |

_(Recomendación Web: Aunque Vite `preview` funciona, para un Staging más robusto se aconseja servir la carpeta `apps/web/dist` con un servidor estático ligero como `npx serve -s dist`)_.

## 3. Paths de Trabajo

- **Directorio API:** `apps/api`
- **Directorio WEB:** `apps/web`
- **Ubicación `schema.prisma`:** `apps/api/prisma/schema.prisma`
- **Directorio de compilación API:** `apps/api/dist/main`
- **Directorio de compilación WEB:** `apps/web/dist`

## 4. Variables de Entorno (Enviroment Variables)

### API Service

- **`PORT`** (Opcional en Railway, lo inyecta solo, pero es buena práctica no hardcodearlo)
- **`JWT_SECRET`** [CRÍTICO] - Clave para firmar el acceso a sesiones.
- **`DATABASE_URL`** [CRÍTICO] - Connection string de PostgreSQL.
- **`NODE_ENV`** - `production` (clave para activar cookies `secure: true`).
- **`FRONTEND_URL`** - Variable a crear para mitigar CORS hardcodeado (ej. `https://web-staging.railway.app`).

### Web (Frontend) Service

- **`VITE_API_URL`** [CRÍTICO] - Debe apuntar al "Public Domain" generado por Railway para el servicio API (ej. `https://api-staging.railway.app/api`).
- **`VITE_FIELD_RECORDS_V1_FRONTEND`** - `true` (Para mantener habilitado el módulo refactorizado).

## 5. Networking / CORS / Cookies

- **Configuración Esperada (Staging):**
  - El backend API y el Frontend Web corren como dos servicios separados en Railway.
  - El backend debe aceptar el dominio público generado del Frontend.
- **CORS Mitigation:** **¡Atención!** Actualmente `apps/api/src/main.ts` tiene un array hardcodeado de `localhost`. Es vital modificar el archivo para incluir los dominios públicos permitidos (ej. leer proces.env.FRONTEND_URL) u origin `*` no funcionará correctamente con `credentials: true`.
- **Cookies:** La configuración en `auth.controller.ts` usa `sameSite: 'lax'` y determina la propiedad `secure` según `process.env.NODE_ENV === 'production'`. Se REQUIERE que la variable de entorno `NODE_ENV` sea `production` en Railway para que iOS/Android y navegadores estrictos no tiren las cookies.

## 6. Healthchecks

- **Endpoint API Health:** `/` o `/health` (Ambos configurados en `app.controller.ts` o al nivel de Express con respuesta 'OK').
- **Criterio "Deploy Healthy":** Código HTTP 200 devuelto. En Railway, puedes agregar un "Healthcheck Path" en la configuración del servicio apuntando a `/health`.

## 7. Riesgos de Despliegue Conocidos (y Mitigaciones)

1. **CORS Bloqueado por Hardcoding**
   - _Riesgo:_ `main.ts` rechaza peticiones del dominio Railway Web.
   - _Mitigación:_ Antes de hacer push, cambiar la configuración origen de `main.ts` para tolerar la URL de Railway o parametrizarlo (añadir `process.env.FRONTEND_URL` al array).
2. **Cookies no transmitidas (Sessión perdida)**
   - _Riesgo:_ `sameSite: lax` fallando cross-domain si el frontend y backend no comparten el mismo Root Domain.
   - _Mitigación:_ Si Railway da dominios totalmente distintos (ej. `api-xxx.up.railway.app` y `web-yyy.up.railway.app`), las cookies `sameSite: lax` pueden fallar. Idealmente configurar un `Custom Domain` en Railway como `api.tudominio.com` y `app.tudominio.com`.
3. **Migración de DB no Automática**
   - _Riesgo:_ El API levanta, pero la BD no tiene tablas.
   - _Mitigación:_ Configurar `prisma migrate deploy` en el "Deploy Command" o un "Pre-Deploy" script de Railway.
4. **Fallo de Build por falta de Typescript**
   - _Riesgo:_ Dependencias `devDependencies` siendo ignoradas si `NODE_ENV=production` durante el build.
   - _Mitigación:_ Railway corre el build. Si usa `npm ci` con production flags puede fallar. En pnpm suele ser más robusto, pero asegurarse que typescript no sea podado antes de `tsc -b`.
5. **Vite Preview Timeout/Memoria**
   - _Riesgo:_ Vite preview no está diseñado 100% para alto tráfico (aunque Staging es bajo volumen).
   - _Mitigación:_ Sustituir el start command del frontend por instalar y usar `serve` (`pnpm i -g serve && serve -s -p $PORT dist`).
