# Auditoría de Demo Data (Scrum)

## Análisis de `apps/api/prisma/seed.ts`

**Resultado:** ❌ NO HAY SEED DATA ESPECÍFICA DE SCRUM

El archivo de seed actual (`seed.ts`) se enfoca exclusivamente en la gestión de proyectos tradicional (WBS / Gantt):

- Crea un proyecto "TORRE MAWI DEMO".
- Crea actividades de proyecto (WBS) como "Cimentación", "Muros", etc.
- Crea dependencias entre actividades.
- Crea registros de progreso semanal.
- Crea contratistas y usuarios.

**Faltantes Críticos para Scrum:**

1.  **Backlog Items**: No se crea ningún item en el backlog (`BacklogItem`).
2.  **Sprints**: No se crea ningún sprint (`Sprint`).
3.  **Asignaciones Scrum**: No hay usuarios asignados a roles específicos de Scrum en el seed.

**Impacto:**

- Al levantar el entorno desde cero, el módulo de Scrum aparece totalmente vacío.
- El usuario debe crear manualmente items o usar la función de "Convertir WBS a Backlog" (si existe y funciona) para poblar el tablero.
- Dificulta demos rápidas del flujo de Scrum (Sprints, Burndown, Velocidad) ya que no hay histórico.

**Recomendación:**
Crear un archivo `seed_scrum.ts` o extender el actual para:

1.  Crear un Sprint Pasado (Cerrado) con items completados para generar métricas de velocidad.
2.  Crear un Sprint Activo con items en diferentes estados para el Kanban.
3.  Crear un Product Backlog con historias futuras.
