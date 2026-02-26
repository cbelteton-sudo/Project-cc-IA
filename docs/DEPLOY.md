# Deployment Guide (API)

Este documento contiene las prácticas recomendadas y pasos pre-despliegue para el módulo de Backend / API y despliegues incrementales.

## Estrategia Zero Downtime

Dado que las actualizaciones del modelo RBAC (Role-Based Access Control) multi-tenant pueden bloquear a los usuarios si se despliega el código antes que las mitigaciones en Base de Datos:

1. **Migraciones primero**: Ejecutar integraciones de base de datos (`npx prisma migrate deploy`) antes que iniciar el nuevo container/servicio web.
2. **Backward Compatibility**: Los Guards como `ProjectAuthGuard` ignorarán `projectId` si las rutas no lo requieren. Evitar re-escribir rutas antiguas en la misma etapa.

## Pasos de Deploy (Producción)

1. Verificar que el Checklist Go/No-Go esté completamente en Verde.
2. Verificar que los tests E2E y Unit Tests del CI han pasado exitosamente. (El pipeline bloquea merges en rojo automáticamente).
3. Construir la imagen de Docker / artefactos de NestJS.
4. Desplegar los artefactos.
5. Vigilar los logs (Datadog/Cloudwatch) durante los primeros 15 minutos en busca de alertas `"event":"access_denied"` no esperadas, indicando algún error de configuración en `PermissionsGuard` o falta de propagación del JWT.
6. Notificar al Project Manager y Equipos pertinentes una vez estabilizado.
