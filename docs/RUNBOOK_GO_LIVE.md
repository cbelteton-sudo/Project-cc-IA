# RUNBOOK GO-LIVE — RBAC Hardening (Producción)

**Objetivo:** Desplegar el sistema RBAC endurecido basado en Base de Datos (DB-Only) a producción con el mínimo riesgo operativo, contingencia preparada y trazabilidad total.

## Fases del Despliegue

### 1) Freeze de Cambios (Code Freeze)

- [x] Congelar integraciones (merges) no críticos en la ventana del release.
- [x] Confirmar rama candidata (`main` o `master`) y asegurar el commit candidato.

### 2) Verificación Pre-Release

- [x] **CI Verde:** Revisar que los pipelines de pruebas unitarias (`ci-rbac`) estén pasando verde (~52 tests).
- [x] **SAST Verde:** Revisión de seguridad Semgrep mitigada (`.github/workflows/semgrep.yml`).
- [x] **Documentos Finales listos:**
  - `docs/GO_LIVE_DECISION.md`
  - `docs/CHECKLIST_GONO_GO.md`
  - `docs/DEPLOY.md` / `docs/SECURITY.md` / `docs/RUNBOOK_ACCESS_ISSUES.md`

### 3) Tagging y Versionamiento

- [x] Crear e inyectar tag de Release: `v1.0.0-rbac-hardening` en repositorio Git.

### 4) Backup y Punto de Restauración

- [ ] Ejecutar backup (Snapshot) inmediato de la Base de Datos Productiva antes del release.
- [ ] Guardar código ID/Hash del Snapshot junto con la hora exacta en el log de operación.
- [ ] Validar disponibilidad y script de comando `restore` en caso de corrupción de Database.

### 5) Migraciones y Seeds

- [ ] Ejecutar migraciones en la infraestructura de producción: `pnpm prisma migrate deploy`.
- [ ] Ejecutar sembrado de perfiles/roles: `npx ts-node prisma/scripts/seed-rbac.ts`.

### 6) Deploy de Aplicación

- [ ] Desplegar artefacto/build de Backend comprobado.
- [ ] **Estrategia gradual (Opcional):** Si se planea probar en caliente la API sin aplicar validación, subir con `RBAC_DB_ONLY=false` para un smoke test pasivo.
- [ ] Verificar Health Checks del pod/servicio.

### 7) Activación Controlada (Feature Flag)

- [ ] Inyectar o encender variable de CLI/Entorno: `RBAC_DB_ONLY=true`.
- [ ] Reiniciar/Re-deployar workers para hidratar flag.
- [ ] **Validación inmediata:**
  - `auth/login` emite JWT correctamente.
  - Endpoints críticos restringen y permiten según perfil.
  - Cross-Tenant: Verificar ausencia de fugas (Leak) de un proyecto a otro.

### 8) Smoke Post-Deploy (Producción)

- [ ] Hacer login de prueba usando cuentas seguras de Test Prod en los 6 perfiles base:
  1. `PLATFORM_ADMIN`
  2. `DIRECTOR_PMO`
  3. `PROJECT_MANAGER`
  4. `SUPERVISOR`
  5. `CONTRACTOR_LEAD`
  6. `CLIENT_VIEWER`
- [ ] Cursar que las peticiones retornen `403` ó `200` estrictamente según las tablas RBAC.

### 9) Hypercare y Monitoreo (Primeras 24H)

- [ ] Observabilidad en tiempo real (Datadog/Logs) vigilando:
  - `access_denied`
  - `scope_mismatch`
  - `suspicious_extraWhere_keys`
  - `fallback_usage` (Idealmente este evento debe ser `0` en el contador si la DB opera sana con el Flag=true).
- [ ] Soporte de ingenieros On-Call y canal general de War Room de incidentes abierto activo.

### 10) Cierre Operativo de Release

- [ ] Registrar bitácora de resultado (Éxito liso o con fallos menores mitigados).
- [ ] **Contingencia Activada?** Si ocurre una disrupción sistémica grave:
  - Cambiar flag a `RBAC_DB_ONLY=false` (Tiempo de mitigación de emergencia esperado: < 2 min).
  - Efectuar plan contingente (`RUNBOOK_ACCESS_ISSUES.md`).
- [ ] Publicar Reporte Ejecutivo formal con lecciones aprendidas y el estatus certificado de Live.
