# GO-LIVE DECISION DOCUMENT

**Status General: GO INMEDIATO 🟢**

El presente documento resume los entregables, riesgos, mitigaciones e implementaciones generadas a lo largo de las fases del Epic "RBAC Database-Only Refactoring", habilitando así la directiva final sobre el Release productivo.

### 1. Estado Actual (GO)

Tras completar las fases 1 al 6 de nuestra matriz de desarrollo:

- **Fases Completadas:** Se crearon los modelos Prisma, se instrumentó un `PermissionRepository` abstracto, se acopló a un Singleton de Node y se instrumentó transversalmente en un Guard (Async compatible). Adicionalmente en Seguridad, se instrumentó un mitigador de fuga SQL de inquilinos en el `prisma-scope.helper.ts`.
- **Malla de Pruebas:** Los unit tests core (52 suites del módulo `apps/api`) y Authz corren de principio a fin validando cada caso en Jest, asegurando que el Coverage y el acoplamiento es alto y seguro.
- **Tolerancia a Fallos:** Se instauró un Boot Check a la API (Fail Fast sobre DB vacía), así como la capacidad de conmutador de Rollback mediante un switch booleano externo (`RBAC_DB_ONLY` flag) provisto por OS/Env.

### 2. Riesgos Remanentes y Aceptados

1. **Query Overhead (Load DB):**
   - _Riesgo:_ Validar múltiples request leyendo el RBAC desde Postgres puede disparar RDS CPU si hay altísima concurrencia (10K RPMs).
   - _Aceptación:_ Como la plataforma B2B (SaaS constructor) maneja tráficos controlados (Bajo o Medio), el nivel actual no es un cuello de botella.
   - _Mitigación Activa Programada:_ Inclusión transaccional en Redis de la respuesta de `PermissionRepository` (TBD - Sprint+1).
2. **Latencias en Evaluaciones Complejas (Roles Heredados):**
   - _Riesgo:_ Árboles profundos de jerarquía en base de datos.
   - _Aceptación:_ Nuestro esquema es plano/aplanado en Database (El seed "desenrolló" la matriz), lo que elimina recurrencias y simplifica la lógica a 1 Query (Join Roles-Permisos). Riesgo mitigado totalmente pre-lanzamiento.

### 3. Plan de Acción y Monitoreo Primera Semana Post-Release

- **[Día Cero - Pase]** Correr migraciones SQL Prisma -> Correr `seed-rbac.ts` (Mandatorio) -> Actualizar ENVs con Backend.
- **[Día 1 a 3 - Hypercare]** Buscar anomalías u ocurrencias sistemáticas en Logging Tool buscando métricas de:
  `event: "fallback_usage"` u `event: "scope_mismatch"`. Si un cliente específico padece Denegación 403, usar el Runbook `RUNBOOK_ACCESS_ISSUES.md`.
- **[Día 7 - Limpieza]** Una vez certificado un performance regular del sistema, retirar el flag `RBAC_DB_ONLY` completamente del código (Convertirlo en Standard DB Behavior) y erradicar las estructuras estáticas JSON antiguas (Constants) logrando paridad de modernización completa y limpiando +400 Líneas de Technical Debt.

> Emitido y Firmado Digitalmente por la Célula de Arquitectura AI (Antigravity).
