# 03. Auditoría de Autenticación y Seguridad

## 1. Sistema de Autenticación

- **Estrategia**: JWT (JSON Web Token) vía `passport-jwt`.
- **Flujos Implementados**:
  - **Login**: `POST /auth/login`. Valida credenciales y retorna Access Token.
  - **Registro**: Falta un endpoint explícito de "Registro Público". Existe `POST /users` en `UsersController`, pero actúa como un admin-create o auto-registro no asegurado.
  - **Logout**: No implementado (común en JWT stateless, pero falta lista negra o revocación).
  - **Refresh Token**: No se detectó implementación de Refresh Tokens. El token expira fijo (configurado a 60m).

## 2. Autorización (RBAC)

- **Roles**: El modelo `User` tiene campo `role` (default "USER").
- **Protección**:
  - Se usa `JwtAuthGuard` para proteger rutas.
  - **CASO CRÍTICO**: El `UsersController` (`apps/api/src/modules/users/users.controller.ts`) **NO TIENE GUARDS**.
    - `GET /users`: Cualquiera puede listar todos los usuarios.
    - `POST /users`: Cualquiera puede crear un usuario.
    - `DELETE /users/:id`: Cualquiera podría borrar usuarios.
  - El `ScrumController` sí está correctamente protegido (`@UseGuards(JwtAuthGuard)` a nivel de clase).

## 3. Configuración de Seguridad

- **Secretos**:
  - ⚠️ **VULNERABILIDAD ALTA**: La clave secreta de JWT está hardcodeada en `auth.module.ts`:
    ```typescript
    secret: 'secretKey', // TODO: Use env var
    ```
  - Esto permite a cualquiera que vea el código (o si se filtra el repo) forjar tokens de administrador.
- **CORS**: Muy permisivo (`origin: true`). Aceptable para dev, riesgoso para prod.
- **Helmet**: No se vio configuración de `helmet` en `main.ts`.

## 4. Conclusión del Agente

La base de autenticación funciona, pero la **seguridad es deficiente** para un entorno de producción.

**Acciones Inmediatas Requeridas:**

1.  🛑 **FIX URGENTE**: Mover el JWT Secret a variables de entorno (`.env`).
2.  🛑 **FIX URGENTE**: Proteger `UsersController` con `JwtAuthGuard` y añadir lógica de roles (solo Admin crea usuarios).
3.  Implementar Refresh Tokens o aumentar la seguridad del Access Token.

**Calificación: 4/10 (Funcional pero Inseguro)**
