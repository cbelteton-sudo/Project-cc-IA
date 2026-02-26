# Checklist QA: Fase 1 - Seguridad de Sesión

Realiza estas pruebas manualmente para validar la implementación de seguridad.

## Pruebas de Autenticación

- [x] **1. Login Exitoso**
  - **Acción**: Ingresar credenciales correctas en `/login`.
  - **Resultado Esperado**: Redirección al dashboard.
  - **Verificación Técnica**:
    - Respuesta del servidor contiene `access_token` y `user` en el body.
    - Cookie `refreshToken` es creada (HttpOnly, Secure/Lax).
    - No hay tokens en `localStorage`.

- [x] **2. Persistencia de Sesión (Refresh)**
  - **Acción**: Recargar la página (F5) estando logueado.
  - **Resultado Esperado**: El usuario permanece logueado sin ver la pantalla de login.
  - **Verificación Técnica**: El endpoint `/auth/refresh` es llamado automáticamente, retornando un nuevo `access_token` y rotando la cookie.

- [x] **3. Logout Correcto**
  - **Acción**: Click en botón "Cerrar Sesión".
  - **Resultado Esperado**: Redirección a `/login`.
  - **Verificación Técnica**:
    - La cookie `refreshToken` es eliminada (o expirada).
    - El token en memoria es borrado.
    - (Opcional) Verificar en DB que la sesión tiene `revokedAt`.

- [x] **4. Rotación de Refresh Token**
  - **Acción**: Observar la cookie `refreshToken` antes y después de un refresh (o recarga de página).
  - **Resultado Esperado**: El valor de la cookie cambia.
  - **Verificación Técnica**: El hash en la tabla `Session` se actualiza.

- [x] **5. Sesión Revocada (Seguridad)**
  - **Acción**: Loguearse. Manuaulmente en DB, establecer `revokedAt = NOW()` para la sesión actual. Intentar navegar/refresh.
  - **Resultado Esperado**: El usuario es deslogueado forzosamente al fallar el refresh.
  - **Verificación Técnica**: Respuesta 401 Unauthorized en `/auth/refresh` con mensaje "Session has been revoked".

- [x] **6. Cookie Inválida**
  - **Acción**: Modificar manualmente el valor de la cookie `refreshToken` en el navegador. Recargar.
  - **Resultado Esperado**: Deslogueo inmediato.
  - **Verificación Técnica**: Respuesta 401 Unauthorized.

- [x] **7. Rate Limiting**
  - **Acción**: Intentar hacer Login 10 veces seguidas rápidamente (usando script o click rápido).
  - **Resultado Esperado**: A partir del 6to intento, recibir error 429 Too Many Requests.
  - **Verificación Técnica**: Headers de respuesta `X-RateLimit-Limit` y `X-RateLimit-Remaining`.

- [x] **8. Configuración Frontend**
  - **Acción**: Renombrar temporalmente `.env` a `.env.bak` en `apps/web` y reiniciar frontend.
  - **Resultado Esperado**: Pantalla roja de "Configuration Error" advirtiendo sobre `VITE_API_URL`.
