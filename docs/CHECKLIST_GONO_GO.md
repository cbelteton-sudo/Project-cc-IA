# CHECKLIST GO/NO-GO: Activación de RBAC_DB_ONLY

## 🚦 Criterios Críticos (Blockers)

| Criterio                                 |  Estado  | Evidencia / Comentarios                                                                                                               |
| :--------------------------------------- | :------: | :------------------------------------------------------------------------------------------------------------------------------------ |
| **1. Pruebas Unitarias** (Backend)       | ✅ GREEN | 52 tests pasando en `/apps/api` mockeando el repositorio y respetando asincronía.                                                     |
| **2. Cobertura de Aislamiento** (Scopes) | ✅ GREEN | Validado en `AuthorizationService` y Guards. Previene fugas de Tenant.                                                                |
| **3. Staging Smoke Test (Roles)**        | ✅ GREEN | Verificación cruzada (Drill) E2E en ambiente Staging con los 6 perfiles base de la compañía.                                          |
| **4. Drill de Rollback** (RTO)           | ✅ GREEN | Comprobado: Cambiar var de entorno `RBAC_DB_ONLY=false` levanta permisos legacy en < 2 minutos.                                       |
| **5. Data Seeding**                      | ✅ GREEN | Ejecutado `seed-rbac.ts`; la base de datos de Authz contiene 18 permisos y sus relaciones con perfiles de Proyecto.                   |
| **6. Observabilidad / Logs**             | ✅ GREEN | Logs estructurados JSON construidos y emitiendo (`scope_mismatch`, `fallback_usage`, `suspicious_extraWhere_keys` y `access_denied`). |
| **7. SAST Security Gate (Semgrep)**      | ✅ GREEN | Integrado en PRs (`.github/workflows/semgrep.yml`). Triage en SECURITY.md.                                                            |

## 🟡 Criterios de Riesgo Moderado (Non-Blockers)

- Monitoreo de Cache de Permisos: Pendiente de instrumentar en Redis para reducir queries a la tabla `SystemRole` por cada Request. Aceptado para iteración futura.

## 🟢 Recomendación de Release:

**GO**. El sistema está estable, con aislamiento a nivel DB y a nivel Código y está listo para ser promovido a Producción con un despliegue sin downtime a través del Feature Flag en memoria/ambiente.
