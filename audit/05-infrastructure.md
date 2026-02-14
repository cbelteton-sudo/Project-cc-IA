# 05. Auditoría de Infraestructura y DevOps

## 1. Monorepo y Espacio de Trabajo

- **Herramienta**: pnpm workspaces.
- **Estructura**:
  - `apps/api`: Backend NestJS.
  - `apps/web`: Frontend Vite/React.
  - `packages/`: Directorio existente (quizás para librerías compartidas futuras).
- **Scripts**: Scripts raíz para orquestación básica, pero faltan scripts de utilidad tipo `turbo` o `nx` para ejecución paralela optimizada.

## 2. Containerización (Docker)

- ❌ **No encontrado**: No se encontraron archivos `Dockerfile` ni `docker-compose.yml` en la raíz del proyecto.
- **Impacto**: El despliegue depende de configuración manual del entorno (Node.js, Postgres) en el servidor destino. Dificulta el "Onboarding" de nuevos desarrolladores.

## 3. Testing

- **Backend**: Jest configurado.
  - Scripts: `test`, `test:e2e`, `test:cov`.
  - Cobertura: Existe script, pero no se evaluó el % actual.
- **Frontend**: Playwright instalado (`@playwright/test`).
  - Indica capacidad para tests E2E, pero no se validó la existencia de suites de prueba activas.

## 4. CI/CD (Integración Continua)

- ❌ **Inexistente**: No se encontró carpeta `.github/workflows` ni configuración de otros proveedores (GitLab CI, CircleCI).
- **Impacto**: No hay validación automática de Pull Requests ni despliegue automatizado. Todo el proceso es manual.

## 5. Entorno y Configuración

- **Variables de Entorno**:
  - Backend usa `DATABASE_URL`.
  - Auth usa hardcoded secret (Mal).
  - No se encontró `.env.example` en la raíz (punto ciego).
- **Hooks**: No se detectó configuración de `husky` o `lint-staged` en los `package.json` revisados.

## 6. Conclusión del Agente

La infraestructura es el **punto más débil** del proyecto. Es un entorno de desarrollo local funcional ("funciona en mi máquina"), pero no está preparado para un ciclo de vida de desarrollo profesional (DevOps) ni producción.

**Prioridades:**

1.  Crear `Dockerfile` para API y Web.
2.  Crear `docker-compose.yml` para levantar todo el stack localmente DB incluida.
3.  Configurar GitHub Actions básico (Build & Test).

**Calificación: 2/10**
