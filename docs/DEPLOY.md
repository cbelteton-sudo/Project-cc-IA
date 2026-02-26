# Despliegue de Autorización RBAC

## Estrategia de Release (Feature Flag)

El pase a producción está protegido por el Feature Flag estricto `RBAC_DB_ONLY`.

### Preparación (Pre-Despliegue)

1. Desplegar el código actualizado.
2. Ejecutar las migraciones de Prisma:
   ```bash
   pnpm prisma migrate deploy
   ```
3. Ejecutar el Seed de Seguridad para popular la DB productiva:
   ```bash
   npx ts-node prisma/scripts/seed-rbac.ts
   ```

### Go-Live

Fijar la variable en el entorno de producción (Vercel / AWS / Docker):

```env
RBAC_DB_ONLY=true
```

Reiniciar o redesplegar el servicio para que tome la variable.
El servicio evaluará `SystemRole` en el hook `onModuleInit`. Si fallara, el contenedor no levantará y alertará tempranamente.

### Drill de Rollback (Incident Recovery)

Si tras el despliegue los usuarios reportan que _nadie_ puede ver sus proyectos (Incapacidad Sistemática):

**Objetivo (RTO < 2 minutos):**

1. Abrir config del entorno.
2. Cambiar a: `RBAC_DB_ONLY=false`
3. Reiniciar el servicio.
   **Resultado:** La app ignorará la tabla de Base de Datos temporalmente y caerá en modo `Fallback` donde usará las constantes antiguas en el servidor hasta que se parchee en caliente el issue de base de datos.
   El Recovery Time Objective real evidenciado en Staging fue de **20 a 45 segundos** (tiempo de auto-scale de los pods/workers).
