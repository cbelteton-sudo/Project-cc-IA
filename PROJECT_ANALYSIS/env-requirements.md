# Requerimientos de Variables de Entorno

## Archivos Encontrados
- `apps/api/.env`: Existe
- `apps/web/.env`: Existe

## Variables Típicas Esperadas (Inferidas)

### Backend
- `DATABASE_URL`: URI de conexión a la base de datos (SQLite/Postgres).
- `JWT_SECRET`: Clave secreta para firmar tokens.
- `PORT`: Puerto del servidor (ej. 3000).
- `FRONTEND_URL`: URL del frontend para CORS.

### Frontend
- `VITE_API_URL`: URL del backend API.

Nota: Se recomienda verificar `apps/api/.env.example` si existe para la lista completa de variables requeridas.
