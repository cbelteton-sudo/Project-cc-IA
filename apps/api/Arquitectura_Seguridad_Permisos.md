# Arquitectura de Seguridad y Permisos: TorreMawi

A continuación se detalla el modelo de seguridad implementado en la aplicación, abarcando Modelo de Datos, Capa de Aplicación (Middlewares/Guards) y Políticas de Base de Datos.

---

## 1. Modelo de Roles y Permisos (Capa Lógica)

La seguridad se basa en un esquema de **Rol Basado en Acceso (RBAC)** a nivel de **Proyecto**. Un usuario puede tener un rol global en el Tenant, pero sus permisos críticos se evalúan por el rol específico que tiene dentro de un Proyecto (`ProjectMember`).

### 1.1 Esquema en Base de Datos (Prisma)

El modelo `ProjectMember` vincula a un Usuario con un Proyecto, asignándole un Rol y, opcionalmente, un Contratista.

```prisma
model ProjectMember {
  id           String      @id @default(uuid())
  projectId    String
  project      Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  userId       String
  user         User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  role         String      @default("VIEWER")
  // ENUM guardado como String: PROJECT_ADMIN, PM, FINANCIERO, CONTRACTOR_LEAD, FIELD_OPERATOR, VIEWER, etc.

  contractorId String?
  contractor   Contractor? @relation(fields: [contractorId], references: [id])
  status       String      @default("ACTIVE") // ACTIVE, DISABLED

  @@unique([projectId, userId])
}
```

### 1.2 Definición de Permisos (TypeScript)

Los permisos son granulares y están estructurados mediante un `enum` en `/src/common/constants/permissions.ts`.

```typescript
export enum Permission {
  PROJECT_VIEW = 'project.view',
  PROJECT_EDIT = 'project.edit',
  TASK_CREATE = 'task.create',
  TASK_APPROVE = 'task.approve',
  // etc...
}
```

### 1.3 Asignación de Permisos a Roles (Matriz Hardcoded)

En el mismo archivo `permissions.ts`, existe una constance `ROLE_PERMISSIONS` que actúa como la matriz de seguridad en memoria.

```typescript
export const ROLE_PERMISSIONS: Record<ProjectRole, Permission[]> = {
  [ProjectRole.PROJECT_ADMIN]: Object.values(Permission), // Todos
  [ProjectRole.PM]: [
    Permission.PROJECT_VIEW,
    Permission.TASK_CREATE,
    // ... múltiples permisos específicos
  ],
  [ProjectRole.FIELD_OPERATOR]: [
    Permission.PROJECT_VIEW,
    Permission.TASK_MARK_DONE, // Permisos limitados
  ],
  // ... etc
};
```

---

## 2. Middlewares y Guards (Capa de Aplicación NestJS)

La aplicación utiliza un sistema de **dos capas de Guards** para proteger las rutas REST/GraphQL: Contexto de Proyecto (Auth) + Validación de Permisos (Authz).

### Capa 1: `ProjectAuthGuard` (Verificar Membresía)

Este Guard (`src/common/guards/project-auth.guard.ts`) se ejecuta primero. Su objetivo es:

1. Extraer el `projectId` de la URL (`params.id`, `params.projectId`, o `query.projectId`).
2. Consultar a la base de datos si el usuario autenticado (del Token JWT) tiene un registro `ProjectMember` activo en ese proyecto.
3. Si lo tiene, **inyectar el objeto `membership`** dentro del objeto `request` de Express para que los siguientes Guards lo puedan utilizar sin golpear la Base de Datos nuevamente.
4. Si no lo tiene, lanza un `ForbiddenException ('Access to this project is denied')`.

### Capa 2: `PermissionsGuard` (Validar RBAC Granular)

Este Guard (`src/common/guards/permissions.guard.ts`) se ejecuta después de que el `ProjectAuthGuard` validó la membresía.

1. Utiliza el `Reflector` de NestJS para leer los permisos requeridos por el endpoint en ejecución.
2. Lee el rol del usuario desde el `request.projectMember` (inyectado previamente).
3. Obtiene la lista de permisos para ese rol usando el diccionario en memoria `ROLE_PERMISSIONS`.
4. Verifica que el usuario tenga **todos** los permisos requeridos. Si falta alguno, lanza `ForbiddenException ('Insufficient Permissions')`.

### Implementación en Controladores (Decoradores)

Las rutas se protegen utilizando ambos Guards y el decorador personalziado `@RequirePermissions()`.

```typescript
@UseGuards(JwtAuthGuard, ProjectAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.TASK_CREATE)
@Post(':projectId/tasks')
async createTask(...) { ... }
```

---

## 3. Políticas SQL / RLS (Capa de Base de Datos)

El stack tecnológico está construido con **NestJS + Prisma Client + PostgreSQL Standard**.

**Actualmente NO se utilizan Row Level Security (RLS) policies nativas de PostgreSQL (como en Supabase nativo).**

Toda la seguridad, multi-tenancy y separación de datos es implementada **100% en la capa lógica del Backend (NestJS)** a través de:

1. **Guards de Autenticación y Autorización** (mencionados arriba).
2. **Consultas Restringidas en Prisma (Where clauses):**
   En los Servicios (Services/Repositories), siempre se inyecta el `tenantId` y `projectId` en los métodos de búsqueda para garantizar que los datos filtrados pertenezcan estrictamente al contexto del usuario.

   Ejemplo típico en un Service:

   ```typescript
   // La seguridad SQL se simula a nivel del ORM forzando la cláusula WHERE
   await this.prisma.projectActivity.findMany({
     where: {
       tenantId: currentUser.tenantId, // Separación Multi-Tenant Base
       projectId: projectId, // Separación por Proyecto
     },
   });
   ```

_Nota: Dado que no se exponen los endpoints directamente a un cliente sin pasar por NestJS, no hay riesgo de salto (Bypass) del servidor hacia la base de datos (como sucedería si clientes de frontend atacaran directo a Supabase sin RLS)._
