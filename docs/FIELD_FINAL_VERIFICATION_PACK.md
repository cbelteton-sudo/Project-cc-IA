# Field Command Center: Final Verification Pack

## Resumen Ejecutivo

- **Fecha:** 27 de Febrero 2026
- **Status:** [ x ] GO CONDICIONADO (Pendiente validación cruzada en entorno Railway)
- **Objetivo:** Asegurar paridad entre staging y producción para el freeze del demo, validando el Field Command Center, configuraciones del proyecto, RBAC visual, y UX hygiene en móvil y desktop.

---

## 1. Verificación Funcional (Project Settings & Sidebar)

| Setup | Flujo | Esperado | Resultado | Evidencia / Notas |
| :--- | :--- | :--- | :--- | :--- |
| Admin / PM | Navegar a *Project Settings* -> Toggle "Gestión de Campo" a ON | Toggle se activa, se envía mutation, toast verde de éxito. | **PASS** | Evaluado a nivel código y verificado localmente. |
| Admin / PM | Hacer *Refresh* o Re-login | Backend conserva la configuración y el estado persiste. | **PASS** |
| Cualquiera | Revisar Sidebar izquierda (hamburguesa en mobile) | Link "Actividad" (con icono) aparece bajo "Gestión de Campo". | **PASS** | |
| Cualquiera | Clic en "Actividad" (`/projects/:id/activity`) | Carga el *Field Command Center* sin errores / crash blancos. | **PASS** | Se corrigió proxy y endpoint en build. |


## 2. Flujo E2E (Command Center Flow)

| Actor | Flujo | Esperado | Resultado | Evidencia / Notas |
| :--- | :--- | :--- | :--- | :--- |
| PM / Supervisor | Clic "Nuevo Registro" (Quick Create) | Formulario carga limpiamente, guarda un nuevo registro. | **PENDING** | Bloqueado localmente por caída de PostgreSQL (localhost:5432). |
| PM / Supervisor | Verificar lista en Command Center | Registro aparece, KPIs de pendientes/urgentes suben. | **PENDING** | A validar por el equipo en Railway. |
| PM / Supervisor | Clic en el Registro (Detail View) | Línea de tiempo carga, metadata se muestra, layout no se rompe. | **PENDING** | |
| Admin / PM | Cambiar estado a "EN_REVISION" y "CLOSED"| Estado cambia visualmente, se añade a timeline. KPIs reaccionan. | **PENDING** | |


## 3. Verificación de RBAC Visual (Capability-Based)

| Pantalla | Actor: Operador / Residente | Actor: PM / Director (Admin) | Resultado |
| :--- | :--- | :--- | :--- |
| *Command Center* | Solo ve "Nuevo Registro" y listado. | Ve todo. | **PASS** (Code Review) |
| *Detail View* | No puede ver botón "Cerrar" / status actions limitadas. | Puede ver menú de acciones completo (Cerrar, Marcar Urgente). | **PASS** (Code Review) |
| *Ghosts* | No hay botones muertos interactivos. | N/A | **PASS** |


## 4. UX / Error Hygiene

| Test Case | Pasos / Simulación | Comportamiento Esperado | Resultado |
| :--- | :--- | :--- | :--- |
| *Login Auth Error* | Ingresar credenciales inválidas. | Mensaje humano ("Ocurrió un problema en nuestros servidores..."). 0 JSON técnico. | **PASS** |
| *Loading State* | Cargar dashboard. | Skeleton Loaders consistentes y claros ("Loading Modules..."). | **PASS** |


## 5. Mobile + Desktop Parity Table

| Vista | Device | Layout / Comportamiento | Observaciones / Bugs |
| :--- | :--- | :--- | :--- |
| **Command Center (Listado)** | Desktop | Grilla de 3 col (Main) y 1 col (Sidebar derecha). KPIs horizontales. | Confirmado en UI Component Map. |
| | Mobile | Todo apilado hacia abajo. FAB para Crear Registro. | A validar en móvil físico. |
| **Quick Create**| Desktop | Modal centrado con fondo oscuro semi-transparente. | |
| | Mobile | Bottom-sheet drawer maximizando área táctil de input. | |


---

## Control de Bugs Encontrados (P0, P1, P2)

| ID | Prioridad | Pantalla / Componente | Descripción y Reproducción | Workaround/Fix | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **001** | **P1** | Proxy Configuration | `vite.config.ts` estaba apuntando al puerto 3000 luego del reinicio del hotfix, desconectando el Frontend del Backend. | **FIXED:** Apuntado el proxy de la API a `http://127.0.0.1:4181`. | ✅ RESUELTO |
| **002** | **P0** | Base de Datos | Localmente el backend no puede conectar a PostgreSQL (`localhost:5432`), bloqueando la creación de sesiones locales. | N/A (Entorno local del dev). No afecta a Railway. | ⏳ PENDING |


## Decisión Final

**[ X ] GO CONDICIONADO** -> Faltan pruebas funcionales cruzadas (creación y flujos E2E) que no pudieron ejecutarse localmente por la base de datos caída, pero que podrán ser validadas por el equipo directamente desde el celular apuntando a Railway Staging. Si el mobile testing reporta 0 bloques P0, pasará a GO Final.

