# Fase 3: Sistema de Invitación de Usuarios

## Descripción General

En esta fase se ha implementado un sistema de registro de usuarios "invite-only". Los usuarios ya no pueden registrarse libremente; en su lugar, un administrador debe enviar una invitación por correo electrónico.

## Funcionalidades Implementadas

### 1. Modelo de Usuario Actualizado

- **Status**: Se añade el campo `status` con valores `INVITED`, `ACTIVE`, `DISABLED`.
- **Token de Invitación**: Se genera un token único para cada invitación.
- **Expiración**: Los tokens son válidos por 48 horas.
- **Contraseña Opcional**: El campo `password` ahora es nullable para permitir la creación de usuarios invitados sin contraseña inicial.

### 2. Backend (API)

- **Endpoint de Invitación (Admin)**: `POST /admin/invite`
  - Body: `{ email: "user@example.com", role: "USER", name: "Nombre" }`
  - Genera un usuario con estado `INVITED` y envía un correo (mocked actualmente).
- **Endpoint de Aceptación (Público)**: `POST /auth/accept-invite`
  - Body: `{ token: "token_string", password: "new_password" }`
  - Valida el token y la expiración.
  - Activa el usuario (status `ACTIVE`).
  - Establece la contraseña.
  - Inicia sesión automáticamente.

### 3. Frontend (Web)

- **Página de Aceptación**: Nueva ruta `/accept-invite?token=...`
  - Formulario para establecer contraseña.
  - Validación de coincidencia de contraseñas.
  - Redirección automática al Dashboard tras el éxito.

## Instrucciones de Uso

### Para Administradores

1. Iniciar sesión como administrador.
2. (Pendiente en UI) Usar API o futura interfaz de administración para invitar usuarios.
   - Ejemplo cURL:
     ```bash
     curl -X POST http://localhost:4180/api/admin/invite \
       -H "Authorization: Bearer <ADMIN_TOKEN>" \
       -H "Content-Type: application/json" \
       -d '{"email": "nuevo@demo.com", "role": "USER", "name": "Nuevo Usuario"}'
     ```

### Para Usuarios Invitados

1. Recibirán un enlace por correo (simulado en logs del servidor por ahora).
   - Enlace: `http://localhost:5173/accept-invite?token=<TOKEN>`
2. Al hacer clic, verán la pantalla de "Completar Registro".
3. Ingresar y confirmar su nueva contraseña.
4. Al enviar, accederán directamente a la aplicación.

## Testing y QA

### Script de Verificación Automática

Se ha creado un script para probar el flujo completo:
`apps/api/scripts/test_invite_flow.ts`

Ejecución:

```bash
cd apps/api
npx ts-node scripts/test_invite_flow.ts
```

### Casos de Prueba Manuales

| ID  | Caso                        | Pasos                                    | Resultado Esperado                                |
| --- | --------------------------- | ---------------------------------------- | ------------------------------------------------- |
| 1   | Invitar Usuario Nuevo       | Admin envía invite a email no registrado | Usuario creado con status INVITED, token generado |
| 2   | Invitar Usuario Existente   | Admin envía invite a email ya registrado | Error "User already exists"                       |
| 3   | Aceptar Invitación Válida   | Usuario accede con token válido          | Formulario de contraseña visible                  |
| 4   | Aceptar Invitación Expirada | Usuario usa token > 48h                  | Error "Invitation token has expired"              |
| 5   | Aceptar Invitación Inválida | Usuario usa token inexistente            | Error "Invalid invitation token"                  |
| 6   | Activar Cuenta              | Usuario envía contraseña válida          | Cuenta pasa a ACTIVE, login exitoso               |

## Notas Técnicas

- **Seguridad**: El token es de un solo uso. Al activar la cuenta, el token se elimina (`null`).
- **Auditoría**: Se recomienda revisar los logs del servidor para ver los tokens generados (en entorno de desarrollo).
