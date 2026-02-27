# Field Command Center UAT Checklist v1.1

Checklist de criterios de aceptación obligatorios para la entrega final del nuevo Command Center del Módulo de Campo.

## 1. Validación Visual (Premium Standards)

- [ ] No existen JSONs crudos ni strings de error feos (ej. "UnauthorizedException") en ninguna pantalla.
- [ ] Skeleton Loaders implementados para carga inicial. No hay "pantallas blancas".
- [ ] Empty States hermosos (con texto de soporte) si no hay registros o si los filtros dan resultado vacío.
- [ ] KPIs de colores acordes a semaforización (Rojo urgente, verde cerrado).
- [ ] Responsive perfecto:
  - Mobile (Default): Full width, bottom sheet nav, botones "Thumb-friendly", vista por lista de alta legibilidad.
  - Desktop: Sidebar lateral, tabla ancha o tablero Kanban.

## 2. Flujo Crítico de Carga Rápida (Quick Create)

**Métricas de Performance Objetivo:**

- Dashboard First Render: `< 2.5s` (red 4G simulada).
- Apertura del Quick Create Modal: `< 1.0s`.

**Simulación temporal (Mobile/Red 3G):**

- [ ] Click en "+" ABRE instantáneamente el Modal (<1s).
- [ ] Operador llena los campos requeridos (Tipo canónico `issue`, `daily_log`, etc.).
- [ ] Toma una foto (Fake Input de Cámara/Archivo).
- [ ] Click en Guardar -> El proceso duró **< 45 Segundos en total**.

## 3. Comportamiento Offline/Sync

- [ ] Apagar el internet (Chrome DevTools -> Offline).
- [ ] Llenar formulario "Quick Create". Dar Guardar.
- [ ] UI indica "Modo Sin Conexión. Guardado localmente...".
- [ ] El registro aparece en la Lista Principal adornado con un icono ☁️❌ (Sync pendiente).
- [ ] Prender internet (Online).
- [ ] Reconexión + sync visual visible en `< 5.0s`.
- [ ] El registro desaparece ☁️❌ y se confirma guardado en el backend sin recargar la página completa.

## 4. RBAC (Roles Verification by Capability)

- [ ] La UI decide ocultar (no deshabilitar) botones basados en `canApprove`, `canClose`, `canReassign`, etc.
- [ ] **Operador:** Inicia sesión. "Aprobar", "Resolver" o "Eliminar" están Ocultos. Solo ve sus tareas y puede "Comentar" o reportar.
- [ ] **Residente:** Inicia sesión. Ve KPI Cards globales de su Frente. Puede re-asignar y cambiar prioridades (`canReassign: true`).
- [ ] **Supervisor/Director:** Inicia sesión. Tablero Kanban habilitado. Puede Aprobar Cierres y Rechazar registros (`canApprove: true`).

## 5. Timeline y Detalle

- [ ] Entrar al detalle de un Field Record.
- [ ] Se muestra foto adjunta (thumbnail clickeable).
- [ ] Historial muestra traza de la creación y último cambio de estado cronológicamente.
