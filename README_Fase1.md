# Fase 1: Seguridad de Sesión (Session Security)

Esta fase implementa un sistema de autenticación robusto y seguro utilizando JWTs de corto tiempo de vida (Access Tokens) y Cookies HttpOnly rotativas (Refresh Tokens).

## 🔒 Arquitectura de Autenticación

1.  **Login**: El usuario envía credenciales. El servidor valida y retorna:
    - `access_token` (JWT): En el cuerpo de la respuesta. Se guarda en **memoria** del cliente (no localStorage).
    - `refreshToken` (JWT/Hash): En una **Cookie HttpOnly**. No es accesible por JavaScript.
2.  **Sesión en Base de Datos**: Se crea un registro en la tabla `Session` con IP, UserAgent y un hash del refresh token.
3.  **Refresh (Rotación)**: Cuando el `access_token` expira (15 min), el cliente intenta usar la cookie para obtener uno nuevo.
    - El servidor valida la cookie y busca la sesión activa.
    - **Rotación**: Se invalida el refresh token anterior y se emite uno nuevo (nueva cookie, nuevo hash en DB).
    - **Revocación**: Si se detecta uso de un token antiguo o la sesión está marcada como `revokedAt`, se bloquea el acceso.
4.  **Logout**: Se marca la sesión como revocada y se elimina la cookie.

## 🛠 Variables de Entorno

Asegúrate de configurar estas variables en tus archivos `.env`.

### Backend (`apps/api/.env`)

| Variable        | Descripción                                                   | Ejemplo / Valor Recomendado                |
| :-------------- | :------------------------------------------------------------ | :----------------------------------------- |
| `JWT_SECRET`    | Clave secreta para firmar los tókenes JWT.                    | `super-secret-key-change-in-prod`          |
| `COOKIE_SECURE` | `true` en Producción (requiere HTTPS), `false` en Desarrollo. | `true` (Prod) / `false` (Dev)              |
| `CORS_ORIGIN`   | URL del frontend permitida para peticiones con credenciales.  | `http://localhost:5173`                    |
| `PORT`          | Puerto del servidor API.                                      | `4180`                                     |
| `DATABASE_URL`  | String de conexión a PostgreSQL.                              | `postgresql://user:pass@localhost:5432/db` |

### Frontend (`apps/web/.env`)

| Variable       | Descripción                        | Ejemplo                     |
| :------------- | :--------------------------------- | :-------------------------- |
| `VITE_API_URL` | URL base de la API. **Requerido**. | `http://localhost:4180/api` |

## 🛡 Medidas de Seguridad Adicionales

- **Rate Limiting**:
  - Login: 5 intentos por minuto.
  - Refresh: 10 intentos por minuto.
- **Audit Fields**: Se registran IP y UserAgent en cada inicio de sesión y renovación.
- **Fail-Safe UI**: El frontend muestra una alerta bloqueante si `VITE_API_URL` no está configurada.

## 🚀 Cómo Probar

1.  Asegúrate de que la base de datos esté actualizada: `pnpm exec prisma migrate dev`.
2.  Reinicia el backend para aplicar los cambios de código.
3.  Inicia sesión en el frontend.
4.  Verifica que no hay token en LocalStorage.
5.  Verifica la cookie `refreshToken` en las herramientas de desarrollo (Application > Cookies).
