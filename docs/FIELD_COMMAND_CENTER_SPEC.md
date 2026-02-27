# Field Command Center Specification (v1.1)

## Resumen del Proyecto

Implementación del "Field Command Center", una experiencia de usuario (UX) de clase mundial, rápida, intuitiva y _mobile-first_, diseñada para operadores de campo, supervisores y Project Managers en proyectos de construcción. Reemplaza la interfaz actual del módulo de campo utilizando el contrato canónico del backend `/field-records`.
El desarrollo debe ser de **alta calidad visual (Premium Enterprise, estilo SALI/MAWI)** y no modificar ni romper módulos externos ni la red de datos _legacy_ (que permanece bajo feature flag).

## Alcance (In-Scope)

### 1. Pantalla Command Center (FieldDashboard v2)

- **KPI Cards Visuales:**
  - Pendientes (Rojo/Naranja)
  - En progreso (Azul/Amarillo)
  - En revisión/bloqueadas (Morado/Gris)
  - Cerradas hoy/semana (Verde)
- **Filtros Rápidos Canónicos (Valores reales del backend):**
  - Tipo: `issue`, `daily_log`, `inspection`, `material_request`
  - Estado: `Open`, `In Progress`, `Blocked`, `Closed`
  - Zona/Frente (Dropdown rápido)
  - Responsable (Usuario asignado)
  - Fecha (Hoy, Ayer, Semana)
  - Toggle: "Solo mis asignadas"
- **Vista de Datos (Mobile vs Desktop):**
  - Default en Mobile: Vista Lista optimizada (alta legibilidad).
  - Default en Desktop: Tabs para alternar entre "Vista Lista" y "Kanban Board". (Kanban en móvil solo si es muy simplificado, sin afectar performance).
- **Acción Principal:**
  - Floating Action Button (FAB) o CTA fijo prominente: "+ Nuevo registro".

### 2. Quick Create Flow

- **Meta de UX:** Creación completa en menos de 45 segundos por un operario en sitio.
- **Campos optimizados (1 pantallazo, sin scroll infinito):**
  - Tipo y Título.
  - Descripción breve (soporte voz-a-texto nativo del teclado).
  - Zona/Frente (Select/Buscador).
  - Responsable.
  - Prioridad (Baja, Normal, Alta, Crítica).
  - Evidencia (Botón gigante para tomar foto rápida o galería).
- **Offline-First:**
  - Si hay red -> Guardar y Sincronizar instantáneamente.
  - Si no hay red -> Guardar en IndexedDB offline con indicador visual claro ("Guardado localmente, sync pendiente"). No usar JSON técnico en la UI.

### 3. Detalle de Registro (Record Detail view)

- **Header dinámico:** Muestra color de estado, prioridad y avatar del responsable.
- **Galería de Evidencias:** Grid visual de fotos. Expandible a pantalla completa.
- **Timeline de Trazabilidad:** Historial estilo "chat" o feed de actividad (quién, cuándo, qué cambió).
- **Barra de Acción Inferior Fija (Sticky):**
  - Condicionada al rol: Aprobar, Cerrar, Reabrir, Comentar.

### 4. RBAC Visual por Capacidades

- La UI **no** debe basarse en strings fijos (ej. `if (role === 'ADMIN')`), sino en capacidades efectivas (ej. `canApprove`, `canClose`, `canReassign`).
- Las acciones no permitidas deben ocultarse desde el render inicial, no solo deshabilitar botones.
- El backend `/field-records` provee la base del RBAC; la UI evalúa estas reglas contra el `user` logueado y sus proyectos.

### 5. Estados UX y Performance

- Prohibidos los errores crudos ("Error 401: Invalid Credentials JSON").
- **Métricas de Performance Objetivo:**
  - Dashboard First Render: `< 2.5s` (simulando red 4G).
  - Apertura de Quick Create: `< 1.0s`.
  - Reconexión y Sincronización visual: `< 5.0s`.
- **Tipos de estado a implementar:**
  - `Loading`: Skeletons rápidos.
  - `Empty`: Mensaje humano y claro.
  - `Error`: Mensajes amigables de fallo de red o permisos.
  - `Success`: Toast visuales y microinteracciones de completado.

### 6. Diseño: Legibilidad > Efectos

- Mantener un look enterprise, pero priorizando contraste y claridad para su uso en campo (bajo la luz del sol).
- Evitar glassmorphism pesado o estilos que degraden la lectura o accesibilidad visual de los datos críticos.

## Fuera de Alcance (Out-of-Scope)

- Modificar el CRM, Módulo Financiero, Reportes PDF de alto nivel, Backlog de PMO general.
- Romper fallbacks legacy. La UI nueva usará el flag `FIELD_RECORDS_V1_FRONTEND=true`.
- Crear un nuevo backend (se usará el que ya existe `/field-records`).

## Flujo de Trabajo y Tecnologías

- **Framework:** React 19 + TypeScript + Vite.
- **Estilos:** TailwindCSS 4, componentes modulares (Radix/Lucide). UI Glassmorphism, colores vibrantes de marca (FieldBlue, FieldOrange).
- **Estado Offline:** Dexie.js (existente) + offlineSync loop.
- **Tipografía:** Inter/Outfit para legibilidad extrema en móviles bajo luz solar.
