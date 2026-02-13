# Memoria de Sesiones - Proyecto CConstructions

Este documento sirve como historial persistente de todas las sesiones de trabajo. **Debe ser leído al inicio de cada nueva sesión** para recuperar contexto, evitar errores recurrentes y continuar el flujo de trabajo sin interrupciones.

## Estructura de Registro

Cada entrada debe contener:

- **Fecha y Hora**: Cuándo ocurrió la sesión.
- **Objetivo Principal**: Qué se intentó lograr.
- **Logros / Features**: Qué se implementó con éxito.
- **Bugs / Problemas Encontrados**: Errores técnicos, de lógica o bloqueos.
- **Soluciones Aplicadas**: Cómo se resolvieron los problemas.
- **Instrucciones Críticas**: Reglas de negocio o preferencias del usuario aprendidas.
- **Estado Final**: Qué quedó pendiente o listo para la siguiente sesión.

---

## Sesión: 11 de Febrero, 2026 - Implementación de Órdenes de Cambio y Refinamiento UI

### Objetivo Principal

Implementar el flujo completo de gestión de Órdenes de Cambio (Change Orders) e impactar el presupuesto del proyecto, además de refinar la interfaz gráfica del Dashboard Presupuestario.

### Logros / Features Implementados

1.  **Gestión de Órdenes de Cambio (Change Orders)**:
    - Backend:
      - Modelo `ChangeOrder` y `ChangeOrderItem` en Prisma.
      - Servicio con transacción atómica para aprobar órdenes e incrementar montos en `BudgetLine`.
      - Endpoints: `POST /change-orders`, `GET /change-orders`, `POST /change-orders/:id/approve`.
    - Frontend:
      - Nueva página `ChangeOrders.tsx` con listado y formulario de creación.
      - Validación de formularios y cálculo automático de totales.
      - Navegación integrada en el header del proyecto.

2.  **Refinamiento de UI (Budget Dashboard)**:
    - Limpieza visual financiera: Eliminación de decimales y uso de fuentes claras (Inter/Sans-serif).
    - Rediseño de tarjetas KPI: Sombras suaves, iconos sutiles, mejor espaciado.
    - Eliminación de "ruido visual": Se quitó el código del proyecto de la cabecera.

3.  **Corrección de Reportes Financieros**:
    - Se estabilizó el módulo de reportes (`ReportingService`) corrigiendo la lógica de cálculo de presupuesto total (`Base + CO + Transfer`).

### Bugs / Problemas Encontrados y Solucionados

- **Bug Crítico en Creación de Change Orders**:
  - _Síntoma_: Error 400 al crear una orden.
  - _Causa_: Faltaban decoradores de validación (`@IsArray`, `@ValidateNested`) en los DTOs, lo que provocaba que `ValidationPipe` (con `whitelist: true`) eliminara la propiedad `items`.
  - _Solución_: Se agregaron los decoradores correctos de `class-validator` y `class-transformer`.
- **Confusión en UI**:
  - _Síntoma_: Usuario reportó que la interfaz se veía "amontonada" y poco profesional.
  - _Solución_: Se iteró 3 veces en el diseño de `ProjectBudget.tsx` hasta lograr un estilo satisfactorio (clean & professional).

### Instrucciones Críticas (Preferencias del Usuario)

- **Estilo Visual**:
  - NO usar fuentes mono-espaciadas para montos generales.
  - NO mostrar decimales (`.00`) en dashboards ejecutivos.
  - Diseño "suavizado" (soft shadows, rounded corners) sobre diseño técnico/tosco.
- **Gestión del Proyecto**:
  - Actualizar siempre el Backlog en Notion al finalizar hitos importantes.
  - Mantener el historial de sesiones en este documento.

### Estado Final

- **Sistema**: Estable y operacional en puertos 3000 (Web) y 4180 (API).
- **Pendientes**: Ninguno crítico reportado. Siguiente paso lógico sería ampliar la cobertura de pruebas o implementar el módulo de estimaciones (si aplica).

---

## Sesión: 12 de Febrero, 2026 - Jerarquía de Historias/Tareas y Mejoras en Diagrama de Gantt

### Objetivo Principal

Implementar una estructura jerárquica para "Historias" y "Tareas" en el Backlog y Sprint Board, diferenciando sus estimaciones (Puntos de Historia vs Horas). Además, mejorar la visualización del Diagrama de Gantt para reflejar tareas atrasadas y leyendas de estado.

### Logros / Features Implementados

1.  **Jerarquía de Historias y Tareas**:
    - **Backend**:
      - Actualización del esquema Prisma: `BacklogItem` ahora tiene `parentId`, `storyPoints`, y `estimatedHours`.
      - Servicio `ScrumService` actualizado para soportar consultas jerárquicas (padre-hijo).
    - **Frontend**:
      - `BacklogView.tsx`: Refactorizado para mostrar Tareas anidadas bajo sus Historias padres.
      - `CreateItemModal`: Ahora permite seleccionar una Historia padre al crear una Tarea.
      - `SprintBoard.tsx`: Las tarjetas de Tareas muestran un "badge" con el nombre de la Historia padre para contexto.

2.  **Mejoras en Diagrama de Gantt**:
    - **Lógica de Atraso**: Las tareas que no están al 100% y cuya fecha de fin ya pasó se visualizan en **Rojo** (tanto la barra como el texto).
    - **Leyenda de Colores**: Se agregó una leyenda en la barra de herramientas explicando los estados:
      - Verde: Completado
      - Azul: En Progreso
      - Rojo: Atrasado
      - Gris: Pendiente

### Bugs / Problemas Encontrados y Solucionados

- **Problemas de Tipado en Frontend**:
  - _Síntoma_: Errores de TypeScript relacionados con propiedades faltantes en `BacklogItem` (`parentId`, `children`).
  - _Solución_: Se actualizó la interfaz `BacklogItem` y se castearon valores de `FormData` correctamente.
- **Error de Sintaxis en JSX**:
  - _Síntoma_: Error de compilación por falta de etiqueta de cierre `</div>` en `GanttChart.tsx`.
  - _Solución_: Se identificó y cerró el div faltante en la estructura del toolbar.

### Instrucciones Críticas (Preferencias del Usuario)

- **Visualización de Atrasos**: Es crucial que las tareas atrasadas sean inmediatamente obvias (color rojo) en el Gantt chart.
- **Claridad Visual**: El uso de leyendas explícitas es preferido para evitar confusiones sobre el significado de los colores.

### Estado Final

- **Sistema**: La funcionalidad de Scrum y Planeación (Gantt) está actualizada con la nueva lógica jerárquica y visualización de estados.
- **Pendientes**: Continuar con el plan de trabajo establecido (posiblemente asignación de recursos o reportes avanzados).
